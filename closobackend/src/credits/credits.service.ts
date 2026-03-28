import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class CreditsService {
  constructor(private readonly db: DatabaseService) {}

  private conversionRate() {
    return Number(process.env.CREDITS_PER_MON ?? "100");
  }

  async ensureSellerWallet(sellerId: string) {
    await this.db.query(
      `INSERT INTO seller_credits (seller_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (seller_id) DO NOTHING`,
      [sellerId],
    );
  }

  async getBalance(sellerId: string) {
    await this.ensureSellerWallet(sellerId);
    const res = await this.db.query<{ balance: number }>(
      `SELECT balance
       FROM seller_credits
       WHERE seller_id = $1`,
      [sellerId],
    );
    return {
      balance: Number(res.rows[0]?.balance ?? 0),
      creditsPerMon: this.conversionRate(),
    };
  }

  async listTools() {
    const res = await this.db.query<{ toolKey: string; displayName: string; creditCost: number }>(
      `SELECT tool_key AS "toolKey", display_name AS "displayName", credit_cost AS "creditCost"
       FROM tool_catalog
       WHERE is_active = true
       ORDER BY display_name ASC`,
    );
    return res.rows;
  }

  async purchase(sellerId: string, monAmount: number, txHash?: string) {
    await this.ensureSellerWallet(sellerId);
    const creditsToAdd = Math.floor(monAmount * this.conversionRate());
    if (creditsToAdd <= 0) throw new BadRequestException("Purchase amount is too low");

    await this.db.transaction(async (query) => {
      await query(
        `UPDATE seller_credits
         SET balance = balance + $2, updated_at = NOW()
         WHERE seller_id = $1`,
        [sellerId, creditsToAdd],
      );
      await query(
        `INSERT INTO credit_ledger (seller_id, entry_type, credits_delta, mon_amount, tx_hash, metadata)
         VALUES ($1, 'purchase', $2, $3, $4, $5::jsonb)`,
        [sellerId, creditsToAdd, monAmount, txHash ?? null, JSON.stringify({ source: "monad_purchase" })],
      );
    });

    return this.getBalance(sellerId);
  }

  async consume(sellerId: string, toolKey: string, metadata: Record<string, unknown> = {}) {
    await this.ensureSellerWallet(sellerId);
    return this.db.transaction(async (query) => {
      const toolRes = await query<{ credit_cost: number; is_active: boolean }>(
        `SELECT credit_cost, is_active
         FROM tool_catalog
         WHERE tool_key = $1
         LIMIT 1`,
        [toolKey],
      );
      const tool = toolRes.rows[0];
      if (!tool || !tool.is_active) throw new BadRequestException("Unknown tool");

      const balanceRes = await query<{ balance: number }>(
        `SELECT balance
         FROM seller_credits
         WHERE seller_id = $1
         FOR UPDATE`,
        [sellerId],
      );
      const current = Number(balanceRes.rows[0]?.balance ?? 0);
      if (current < tool.credit_cost) {
        throw new BadRequestException(`Insufficient credits. Needed: ${tool.credit_cost}, current: ${current}`);
      }

      await query(
        `UPDATE seller_credits
         SET balance = balance - $2, updated_at = NOW()
         WHERE seller_id = $1`,
        [sellerId, tool.credit_cost],
      );
      await query(
        `INSERT INTO credit_ledger (seller_id, entry_type, tool_key, credits_delta, metadata)
         VALUES ($1, 'consume', $2, $3, $4::jsonb)`,
        [sellerId, toolKey, -tool.credit_cost, JSON.stringify(metadata)],
      );

      return {
        used: tool.credit_cost,
        remaining: current - tool.credit_cost,
      };
    });
  }
}

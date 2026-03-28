import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Contract, JsonRpcProvider, Wallet, id } from "ethers";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class PayoutsService {
  constructor(private readonly db: DatabaseService) {}

  private readonly escrowAbi = [
    "function approveAndRelease(bytes32 saleId) external",
  ];

  private getEscrowClient() {
    const rpcUrl = process.env.MONAD_RPC_URL;
    const privateKey = process.env.MONAD_PAYOUT_OPERATOR_PRIVATE_KEY;
    const escrowAddress = process.env.MONAD_ESCROW_ADDRESS;
    if (!rpcUrl || !privateKey || !escrowAddress) return null;

    const provider = new JsonRpcProvider(rpcUrl, process.env.MONAD_CHAIN_ID ? Number(process.env.MONAD_CHAIN_ID) : 10143);
    const signer = new Wallet(privateKey, provider);
    const contract = new Contract(escrowAddress, this.escrowAbi, signer);
    return { contract };
  }

  private simulateMonadTransfer() {
    return `0xmonad${randomUUID().replaceAll("-", "").slice(0, 32)}`;
  }

  private toSaleIdHash(saleId: string) {
    return id(`sale:${saleId}`);
  }

  async triggerPayout(commissionId: string, idempotencyKey?: string) {
    return this.db.transaction(async (query) => {
      const commissionRes = await query<{
        id: string;
        status: string;
        seller_amount: string;
        seller_wallet: string | null;
        sale_id: string;
      }>(
        `SELECT c.id, c.status, c.seller_amount, c.sale_id, u.wallet_address AS seller_wallet
         FROM commissions c
         JOIN sales s ON s.id = c.sale_id
         JOIN users u ON u.id = s.seller_id
         WHERE c.id = $1`,
        [commissionId],
      );
      const commission = commissionRes.rows[0];
      if (!commission) throw new BadRequestException("Commission not found");
      if (commission.status !== "calculated") {
        throw new BadRequestException("Commission is not ready for payout");
      }
      if (!commission.seller_wallet) {
        throw new BadRequestException("Seller wallet is missing");
      }

      const key = idempotencyKey ?? `payout:${commissionId}`;
      const existingPayout = await query<{
        id: string;
        status: string;
        tx_hash: string | null;
      }>(
        `SELECT id, status, tx_hash FROM payouts WHERE idempotency_key = $1 LIMIT 1`,
        [key],
      );
      if (existingPayout.rows[0]) {
        return existingPayout.rows[0];
      }

      const pending = await query(
        `INSERT INTO payouts (commission_id, chain, wallet_to, amount, idempotency_key, status)
         VALUES ($1, 'monad', $2, $3, $4, 'pending')
         RETURNING id, status`,
        [commissionId, commission.seller_wallet, commission.seller_amount, key],
      );

      let txHash = this.simulateMonadTransfer();
      const escrow = this.getEscrowClient();
      if (escrow) {
        const onchainSaleId = this.toSaleIdHash(commission.sale_id);
        const tx = await escrow.contract.approveAndRelease(onchainSaleId);
        const receipt = await tx.wait(1);
        txHash = receipt?.hash ?? tx.hash;
      }

      const paid = await query(
        `UPDATE payouts
         SET status = 'paid', tx_hash = $2, paid_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id, commission_id AS "commissionId", status, tx_hash AS "txHash", paid_at AS "paidAt"`,
        [pending.rows[0].id, txHash],
      );

      await query("UPDATE commissions SET status = 'paid', updated_at = NOW() WHERE id = $1", [commissionId]);
      return paid.rows[0];
    });
  }

  async listForUser(userId: string) {
    const result = await this.db.query(
      `SELECT p.id, p.commission_id AS "commissionId", p.chain, p.wallet_to AS "walletTo",
              p.amount::float AS amount, p.tx_hash AS "txHash", p.status, p.paid_at AS "paidAt"
       FROM payouts p
       JOIN commissions c ON c.id = p.commission_id
       JOIN sales s ON s.id = c.sale_id
       WHERE s.seller_id = $1
       ORDER BY p.created_at DESC`,
      [userId],
    );
    return result.rows;
  }
}

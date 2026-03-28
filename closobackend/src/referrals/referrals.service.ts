import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class ReferralsService {
  constructor(private readonly db: DatabaseService) {}

  private makeCode() {
    return `clo_${randomBytes(4).toString("hex")}`;
  }

  async create(sellerId: string, productId: string) {
    const productRes = await this.db.query<{ id: string; business_id: string; is_active: boolean }>(
      `SELECT id, business_id, is_active
       FROM products
       WHERE id = $1`,
      [productId],
    );
    const product = productRes.rows[0];
    if (!product || !product.is_active) throw new NotFoundException("Product not found or inactive");

    const code = this.makeCode();
    const inserted = await this.db.query(
      `INSERT INTO referral_links (code, seller_id, business_id, product_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, product_id AS "productId", click_count AS "clickCount", conversion_count AS "conversionCount", created_at AS "createdAt"`,
      [code, sellerId, product.business_id, product.id],
    );

    const baseUrl = process.env.REFERRAL_BASE_URL ?? "https://closo.sales/r";
    return {
      ...inserted.rows[0],
      url: `${baseUrl}/${code}`,
    };
  }

  async listMine(sellerId: string) {
    const rows = await this.db.query(
      `SELECT rl.id, rl.code, rl.product_id AS "productId", p.title AS "productTitle",
              rl.click_count AS "clickCount", rl.conversion_count AS "conversionCount",
              rl.created_at AS "createdAt"
       FROM referral_links rl
       JOIN products p ON p.id = rl.product_id
       WHERE rl.seller_id = $1 AND rl.is_active = true
       ORDER BY rl.created_at DESC`,
      [sellerId],
    );
    const baseUrl = process.env.REFERRAL_BASE_URL ?? "https://closo.sales/r";
    return rows.rows.map((row) => ({ ...row, url: `${baseUrl}/${row.code}` }));
  }

  async resolve(code: string) {
    const result = await this.db.transaction(async (query) => {
      const refRes = await query<{
        code: string;
        product_id: string;
        seller_id: string;
        business_id: string;
        is_active: boolean;
        title: string;
        website: string | null;
        business_name: string;
        business_wallet: string | null;
      }>(
        `SELECT rl.code, rl.product_id, rl.seller_id, rl.business_id, rl.is_active,
                p.title, p.website, u.name AS business_name, u.wallet_address AS business_wallet
         FROM referral_links rl
         JOIN products p ON p.id = rl.product_id
         JOIN users u ON u.id = rl.business_id
         WHERE rl.code = $1
         LIMIT 1`,
        [code],
      );
      const referral = refRes.rows[0];
      if (!referral || !referral.is_active) throw new NotFoundException("Referral link not found");

      await query(
        `UPDATE referral_links
         SET click_count = click_count + 1, updated_at = NOW()
         WHERE code = $1`,
        [code],
      );

      return referral;
    });

    return {
      code: result.code,
      productId: result.product_id,
      sellerId: result.seller_id,
      businessId: result.business_id,
      productTitle: result.title,
      targetUrl: result.website,
      businessName: result.business_name,
      businessWalletAddress: result.business_wallet,
    };
  }

  async incrementConversion(code: string) {
    const res = await this.db.query(
      `UPDATE referral_links
       SET conversion_count = conversion_count + 1, updated_at = NOW()
       WHERE code = $1`,
      [code],
    );
    if (!res.rowCount) {
      throw new BadRequestException("Referral code is invalid");
    }
  }
}

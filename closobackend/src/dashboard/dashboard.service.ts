import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateBusinessProfileDto } from "./dto/update-business-profile.dto";
import { getAddress } from "ethers";

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  private normalizeWalletAddress(walletAddress?: string | null) {
    if (typeof walletAddress !== "string") return null;
    const trimmed = walletAddress.trim();
    if (!trimmed) return null;
    try {
      return getAddress(trimmed);
    } catch {
      throw new BadRequestException("Invalid wallet address format.");
    }
  }

  async sellerOverview(userId: string) {
    const [stats, leads, payouts] = await Promise.all([
      this.db.query(
        `SELECT 
          COALESCE(SUM(c.seller_amount), 0)::float AS "totalEarnings",
          COALESCE(SUM(CASE WHEN c.status = 'calculated' THEN c.seller_amount ELSE 0 END), 0)::float AS "pendingEarnings",
          COUNT(DISTINCT s.id)::int AS "salesCount"
         FROM sales s
         LEFT JOIN commissions c ON c.sale_id = s.id
         WHERE s.seller_id = $1`,
        [userId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS "leadCount"
         FROM lead_assignments
         WHERE seller_id = $1`,
        [userId],
      ),
      this.db.query(
        `SELECT p.id, p.amount::float AS amount, p.status, p.tx_hash AS "txHash", p.paid_at AS "paidAt"
         FROM payouts p
         JOIN commissions c ON c.id = p.commission_id
         JOIN sales s ON s.id = c.sale_id
         WHERE s.seller_id = $1
         ORDER BY p.created_at DESC
         LIMIT 8`,
        [userId],
      ),
    ]);

    return {
      stats: {
        ...stats.rows[0],
        leadCount: leads.rows[0]?.leadCount ?? 0,
      },
      payouts: payouts.rows,
    };
  }

  async businessOverview(userId: string) {
    const [profile, stats, topProducts, topSellers, queue, recentSales] = await Promise.all([
      this.db.query(
        `SELECT id, name, email, company_name AS "companyName", wallet_address AS "walletAddress",
                status, created_at AS "createdAt"
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId],
      ),
      this.db.query(
        `SELECT
          COALESCE(SUM(s.gross_amount), 0)::float AS "revenue",
          COUNT(DISTINCT s.id)::int AS "salesCount",
          COUNT(DISTINCT s.seller_id)::int AS "activeSellers",
          COUNT(DISTINCT CASE WHEN s.status = 'verified' THEN s.id END)::int AS "verifiedSales",
          COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END)::int AS "pendingSales",
          COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.seller_amount ELSE 0 END), 0)::float AS "commissionsPaid"
         FROM sales s
         LEFT JOIN commissions c ON c.sale_id = s.id
         WHERE s.business_id = $1`,
        [userId],
      ),
      this.db.query(
        `SELECT p.id, p.title, p.price::float AS price, p.commission_value AS "commissionValue",
                COUNT(s.id)::int AS "salesCount",
                COUNT(CASE WHEN s.status = 'verified' THEN 1 END)::int AS "verifiedCount",
                COUNT(CASE WHEN s.status = 'pending' THEN 1 END)::int AS "pendingCount",
                COALESCE(SUM(s.gross_amount), 0)::float AS "grossRevenue"
         FROM products p
         LEFT JOIN sales s ON s.product_id = p.id
         WHERE p.business_id = $1
         GROUP BY p.id
         ORDER BY "salesCount" DESC
         LIMIT 10`,
        [userId],
      ),
      this.db.query(
        `SELECT u.id, u.name,
                COUNT(s.id)::int AS "salesCount",
                COALESCE(SUM(c.seller_amount), 0)::float AS "sellerEarnings"
         FROM sales s
         JOIN users u ON u.id = s.seller_id
         LEFT JOIN commissions c ON c.sale_id = s.id
         WHERE s.business_id = $1
         GROUP BY u.id
         ORDER BY "salesCount" DESC
         LIMIT 10`,
        [userId],
      ),
      this.db.query(
        `SELECT s.id, s.product_id AS "productId", p.title AS "productTitle",
                s.seller_id AS "sellerId", u.name AS "sellerName",
                s.gross_amount::float AS "grossAmount", s.external_reference AS "externalReference",
                s.referral_code AS "referralCode", s.created_at AS "createdAt"
         FROM sales s
         JOIN users u ON u.id = s.seller_id
         JOIN products p ON p.id = s.product_id
         WHERE s.business_id = $1 AND s.status = 'pending'
         ORDER BY s.created_at DESC
         LIMIT 20`,
        [userId],
      ),
      this.db.query(
        `SELECT s.id, s.product_id AS "productId", p.title AS "productTitle",
                s.seller_id AS "sellerId", u.name AS "sellerName",
                s.gross_amount::float AS "grossAmount", s.status, s.external_reference AS "externalReference",
                s.referral_code AS "referralCode", s.verification_method AS "verificationMethod",
                s.verification_reference AS "verificationReference", s.verified_at AS "verifiedAt", s.created_at AS "createdAt"
         FROM sales s
         JOIN users u ON u.id = s.seller_id
         JOIN products p ON p.id = s.product_id
         WHERE s.business_id = $1
         ORDER BY s.created_at DESC
         LIMIT 30`,
        [userId],
      ),
    ]);

    const statsRow = stats.rows[0] ?? {
      revenue: 0,
      salesCount: 0,
      activeSellers: 0,
      verifiedSales: 0,
      pendingSales: 0,
      commissionsPaid: 0,
    };

    return {
      profile: profile.rows[0] ?? null,
      stats: {
        ...statsRow,
        verificationRate:
          Number(statsRow.salesCount) > 0
            ? Number(((Number(statsRow.verifiedSales) / Number(statsRow.salesCount)) * 100).toFixed(2))
            : 0,
      },
      products: topProducts.rows,
      sellers: topSellers.rows,
      verificationQueue: queue.rows,
      recentSales: recentSales.rows,
    };
  }

  async updateBusinessProfile(userId: string, dto: UpdateBusinessProfileDto) {
    const currentRes = await this.db.query<{
      company_name: string | null;
      wallet_address: string | null;
    }>(
      `SELECT company_name, wallet_address
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );
    const current = currentRes.rows[0];
    const nextCompany = dto.companyName ?? current?.company_name ?? null;
    const nextWallet =
      dto.walletAddress !== undefined
        ? this.normalizeWalletAddress(dto.walletAddress)
        : this.normalizeWalletAddress(current?.wallet_address);

    const result = await this.db.query(
      `UPDATE users
       SET company_name = $2, wallet_address = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, company_name AS "companyName", wallet_address AS "walletAddress", status, created_at AS "createdAt"`,
      [userId, nextCompany, nextWallet],
    );
    return result.rows[0];
  }
}

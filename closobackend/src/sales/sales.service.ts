import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { VerifySaleDto } from "./dto/verify-sale.dto";
import { PayoutsService } from "../payouts/payouts.service";
import { AuthUser } from "../auth/auth.types";
import { CreateReferralSaleDto } from "./dto/create-referral-sale.dto";
import { ReferralsService } from "../referrals/referrals.service";

@Injectable()
export class SalesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly payoutsService: PayoutsService,
    private readonly referralsService: ReferralsService,
  ) {}

  private async assertSellerProductLink(sellerId: string, productId: string) {
    const linked = await this.db.query(
      `SELECT 1
       FROM seller_product_selections
       WHERE seller_id = $1 AND product_id = $2 AND is_active = true
       LIMIT 1`,
      [sellerId, productId],
    );
    if (!linked.rows[0]) {
      throw new BadRequestException("Seller must add this product to dashboard before creating/verifying sales");
    }
  }

  private async assertNoDuplicateExternalReference(
    businessId: string,
    productId: string,
    externalReference?: string,
  ) {
    if (!externalReference) return;
    const dup = await this.db.query(
      `SELECT id
       FROM sales
       WHERE business_id = $1
         AND product_id = $2
         AND external_reference = $3
       LIMIT 1`,
      [businessId, productId, externalReference],
    );
    if (dup.rows[0]) {
      throw new BadRequestException("Duplicate externalReference for this product/business");
    }
  }

  private async createVerificationEvent(input: {
    saleId: string;
    actorId: string;
    actorRole: string;
    method?: string;
    reference?: string;
    note?: string;
  }) {
    await this.db.query(
      `INSERT INTO sale_verification_events (sale_id, actor_id, actor_role, method, reference, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.saleId,
        input.actorId,
        input.actorRole,
        input.method ?? null,
        input.reference ?? null,
        input.note ?? null,
      ],
    );
  }

  private async createCommissionAndMaybePayout(saleId: string, triggerPayout = true) {
    const commissionRes = await this.db.query<{
      id: string;
      seller_amount: string;
      platform_amount: string;
      business_amount: string;
      status: string;
    }>(
      `INSERT INTO commissions (sale_id, seller_amount, platform_amount, business_amount, status)
       SELECT s.id,
              ROUND((s.gross_amount * p.commission_value / 100.0)::numeric, 2) AS seller_amount,
              ROUND((s.gross_amount * 0.05)::numeric, 2) AS platform_amount,
              ROUND((s.gross_amount - (s.gross_amount * p.commission_value / 100.0) - (s.gross_amount * 0.05))::numeric, 2) AS business_amount,
              'calculated'
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE s.id = $1
       ON CONFLICT (sale_id) DO UPDATE SET updated_at = NOW()
       RETURNING id, seller_amount::text, platform_amount::text, business_amount::text, status`,
      [saleId],
    );
    const commission = commissionRes.rows[0];

    let payout: unknown = null;
    if (triggerPayout) {
      payout = await this.payoutsService.triggerPayout(commission.id, `sale:${saleId}`);
    }
    return { commission, payout };
  }

  async create(userId: string, dto: CreateSaleDto) {
    if (!dto.leadAssignmentId && !dto.referralCode) {
      throw new BadRequestException("leadAssignmentId or referralCode is required");
    }

    if (dto.referralCode) {
      const referralRes = await this.db.query<{
        code: string;
        seller_id: string;
        business_id: string;
        product_id: string;
      }>(
        `SELECT code, seller_id, business_id, product_id
         FROM referral_links
         WHERE code = $1 AND is_active = true
         LIMIT 1`,
        [dto.referralCode],
      );
      const referral = referralRes.rows[0];
      if (!referral) throw new BadRequestException("Referral code not found");
      if (referral.seller_id !== userId) {
        throw new ForbiddenException("Referral code does not belong to current seller");
      }
      await this.assertSellerProductLink(userId, referral.product_id);
      await this.assertNoDuplicateExternalReference(
        referral.business_id,
        referral.product_id,
        dto.externalReference ?? undefined,
      );

      const sale = await this.db.query(
        `INSERT INTO sales (seller_id, business_id, product_id, gross_amount, status, external_reference, referral_code, customer_wallet)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
         RETURNING id, seller_id AS "sellerId", business_id AS "businessId", product_id AS "productId",
                   gross_amount::float AS "grossAmount", referral_code AS "referralCode", status, created_at AS "createdAt"`,
        [
          referral.seller_id,
          referral.business_id,
          referral.product_id,
          dto.amount,
          dto.externalReference ?? null,
          referral.code,
          dto.customerWallet ?? null,
        ],
      );
      return sale.rows[0];
    }

    const assignment = await this.db.query<{
      id: string;
      lead_id: string;
      product_id: string;
      seller_id: string;
      business_id: string;
    }>(
      `SELECT la.id, la.lead_id, la.product_id, la.seller_id, p.business_id
       FROM lead_assignments la
       JOIN products p ON p.id = la.product_id
       WHERE la.id = $1`,
      [dto.leadAssignmentId as string],
    );
    const found = assignment.rows[0];
    if (!found) throw new BadRequestException("Lead assignment not found");
    if (found.seller_id !== userId) throw new ForbiddenException("Not your assignment");
    await this.assertSellerProductLink(userId, found.product_id);
    await this.assertNoDuplicateExternalReference(
      found.business_id,
      found.product_id,
      dto.externalReference ?? undefined,
    );

    const sale = await this.db.query(
      `INSERT INTO sales (seller_id, business_id, product_id, lead_id, gross_amount, status, external_reference)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id, seller_id AS "sellerId", business_id AS "businessId", product_id AS "productId", lead_id AS "leadId",
                 gross_amount::float AS "grossAmount", status, created_at AS "createdAt"`,
      [userId, found.business_id, found.product_id, found.lead_id, dto.amount, dto.externalReference ?? null],
    );

    return sale.rows[0];
  }

  async createFromReferral(actor: AuthUser, dto: CreateReferralSaleDto) {
    const referralRes = await this.db.query<{
      code: string;
      seller_id: string;
      business_id: string;
      product_id: string;
    }>(
      `SELECT code, seller_id, business_id, product_id
       FROM referral_links
       WHERE code = $1 AND is_active = true
       LIMIT 1`,
      [dto.referralCode],
    );
    const referral = referralRes.rows[0];
    if (!referral) throw new BadRequestException("Referral code not found");
    if (actor.role === "business" && referral.business_id !== actor.id) {
      throw new ForbiddenException("Referral does not belong to your startup");
    }
    await this.assertSellerProductLink(referral.seller_id, referral.product_id);
    await this.assertNoDuplicateExternalReference(
      referral.business_id,
      referral.product_id,
      dto.externalReference ?? undefined,
    );

    const saleRes = await this.db.query<{ id: string }>(
      `INSERT INTO sales (seller_id, business_id, product_id, gross_amount, status, external_reference, referral_code, customer_wallet, verified_at, verified_by, verification_method, verification_reference, verification_note)
       VALUES ($1, $2, $3, $4, 'verified', $5, $6, $7, NOW(), $8, $9, $10, $11)
       RETURNING id`,
      [
        referral.seller_id,
        referral.business_id,
        referral.product_id,
        dto.amount,
        dto.externalReference ?? null,
        referral.code,
        dto.customerWallet ?? null,
        actor.id,
        dto.verificationMethod ?? "referral_link",
        dto.verificationReference ?? null,
        dto.verificationNote ?? null,
      ],
    );
    const saleId = saleRes.rows[0].id;
    await this.createVerificationEvent({
      saleId,
      actorId: actor.id,
      actorRole: actor.role,
      method: dto.verificationMethod ?? "referral_link",
      reference: dto.verificationReference,
      note: dto.verificationNote,
    });
    await this.referralsService.incrementConversion(referral.code);
    const { commission, payout } = await this.createCommissionAndMaybePayout(saleId, dto.triggerPayout !== false);
    return { saleId, commission, payout, referralCode: referral.code };
  }

  async verify(actor: AuthUser, dto: VerifySaleDto) {
    const saleRes = await this.db.query<{
      id: string;
      business_id: string;
      product_id: string;
      gross_amount: string;
      status: string;
      referral_code: string | null;
    }>(
      `SELECT id, business_id, product_id, gross_amount, status, referral_code
       FROM sales
       WHERE id = $1`,
      [dto.saleId],
    );
    const sale = saleRes.rows[0];
    if (!sale) throw new BadRequestException("Sale not found");
    if (sale.status !== "pending") throw new BadRequestException("Sale already processed");
    if (actor.role === "business" && sale.business_id !== actor.id) {
      throw new ForbiddenException("You can only verify your own product sales");
    }

    await this.assertSellerProductLink(
      (
        await this.db.query<{ seller_id: string }>("SELECT seller_id FROM sales WHERE id = $1", [dto.saleId])
      ).rows[0].seller_id,
      sale.product_id,
    );

    await this.db.query(
      `UPDATE sales
       SET status = 'verified',
           verified_at = NOW(),
           verified_by = $2,
           verification_method = $3,
           verification_reference = $4,
           verification_note = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [
        dto.saleId,
        actor.id,
        dto.verificationMethod ?? "manual_review",
        dto.verificationReference ?? null,
        dto.verificationNote ?? null,
      ],
    );
    await this.createVerificationEvent({
      saleId: dto.saleId,
      actorId: actor.id,
      actorRole: actor.role,
      method: dto.verificationMethod ?? "manual_review",
      reference: dto.verificationReference,
      note: dto.verificationNote,
    });

    if (sale.referral_code) {
      await this.referralsService.incrementConversion(sale.referral_code);
    }
    const { commission, payout } = await this.createCommissionAndMaybePayout(dto.saleId, dto.triggerPayout !== false);

    return { saleId: dto.saleId, commission, payout };
  }

  async listMine(user: AuthUser) {
    if (user.role === "seller") {
      const res = await this.db.query(
        `SELECT id, product_id AS "productId", lead_id AS "leadId", gross_amount::float AS "grossAmount", status,
                verified_at AS "verifiedAt", verification_method AS "verificationMethod",
                verification_reference AS "verificationReference", created_at AS "createdAt"
         FROM sales
         WHERE seller_id = $1
         ORDER BY created_at DESC`,
        [user.id],
      );
      return res.rows;
    }

    const res = await this.db.query(
      `SELECT id, product_id AS "productId", lead_id AS "leadId", gross_amount::float AS "grossAmount", status,
              verified_at AS "verifiedAt", verification_method AS "verificationMethod",
              verification_reference AS "verificationReference", created_at AS "createdAt"
       FROM sales
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );
    return res.rows;
  }
}

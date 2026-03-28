import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AssignLeadDto } from "./dto/assign-lead.dto";

@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}

  listAvailable(limit = 20) {
    return this.db.query(
      `SELECT id, source, company_name AS "companyName", contact_name AS "contactName",
              contact_channel AS "contactChannel", location, score, status
       FROM leads
       WHERE status IN ('new', 'assigned')
       ORDER BY score DESC, created_at DESC
       LIMIT $1`,
      [limit],
    );
  }

  listMine(userId: string) {
    return this.db.query(
      `SELECT la.id, la.lead_id AS "leadId", la.product_id AS "productId", la.state, la.assigned_at AS "assignedAt",
              l.company_name AS "companyName", l.contact_name AS "contactName", l.contact_channel AS "contactChannel",
              l.location, l.score, p.title AS "productTitle"
       FROM lead_assignments la
       JOIN leads l ON l.id = la.lead_id
       JOIN products p ON p.id = la.product_id
       WHERE la.seller_id = $1
       ORDER BY la.assigned_at DESC`,
      [userId],
    );
  }

  async assign(userId: string, dto: AssignLeadDto) {
    const leadResult = await this.db.query<{ id: string; status: string }>(
      "SELECT id, status FROM leads WHERE id = $1",
      [dto.leadId],
    );
    if (!leadResult.rows[0]) throw new BadRequestException("Lead not found");

    const productResult = await this.db.query<{ id: string; is_active: boolean }>(
      "SELECT id, is_active FROM products WHERE id = $1",
      [dto.productId],
    );
    if (!productResult.rows[0] || !productResult.rows[0].is_active) {
      throw new BadRequestException("Product is not active");
    }

    const assignment = await this.db.query(
      `INSERT INTO lead_assignments (lead_id, seller_id, product_id, state)
       VALUES ($1, $2, $3, 'assigned')
       ON CONFLICT (lead_id, seller_id, product_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING id, lead_id AS "leadId", product_id AS "productId", seller_id AS "sellerId", state, assigned_at AS "assignedAt"`,
      [dto.leadId, userId, dto.productId],
    );

    await this.db.query("UPDATE leads SET status = 'assigned', updated_at = NOW() WHERE id = $1", [dto.leadId]);
    return assignment.rows[0];
  }
}

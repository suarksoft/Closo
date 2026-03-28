import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  listAll() {
    return this.db.query(
      `SELECT p.id, p.business_id AS "businessId", p.title, p.description, p.category, p.price, 
              p.commission_value AS "commissionValue", p.website, p.is_active AS "isActive",
              p.created_at AS "createdAt"
       FROM products p
       WHERE p.is_active = true
       ORDER BY p.created_at DESC`,
    );
  }

  listMine(userId: string) {
    return this.db.query(
      `SELECT id, title, description, category, price, commission_value AS "commissionValue", website, is_active AS "isActive"
       FROM products
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
  }

  async getById(id: string) {
    const product = await this.db.query(
      `SELECT p.id, p.business_id AS "businessId", p.title, p.description, p.category, p.price,
              p.commission_value AS "commissionValue", p.website, p.is_active AS "isActive",
              COALESCE(COUNT(s.id), 0)::int AS "salesCount"
       FROM products p
       LEFT JOIN sales s ON s.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id],
    );
    if (!product.rows[0]) throw new NotFoundException("Product not found");
    return product.rows[0];
  }

  async create(userId: string, dto: CreateProductDto) {
    const result = await this.db.query(
      `INSERT INTO products (business_id, title, description, category, price, commission_type, commission_value, website)
       VALUES ($1, $2, $3, $4, $5, 'percent', $6, $7)
       RETURNING id, business_id AS "businessId", title, description, category, price, commission_value AS "commissionValue", website, is_active AS "isActive"`,
      [userId, dto.title, dto.description, dto.category, dto.price, dto.commissionValue, dto.website ?? null],
    );
    return result.rows[0];
  }

  async selectForSeller(userId: string, productId: string) {
    const productResult = await this.db.query<{ id: string; is_active: boolean }>(
      "SELECT id, is_active FROM products WHERE id = $1",
      [productId],
    );
    if (!productResult.rows[0]) {
      throw new NotFoundException("Product not found");
    }
    if (!productResult.rows[0].is_active) {
      throw new BadRequestException("Product is not active");
    }

    const selection = await this.db.query<{ id: string; sellerId: string; productId: string }>(
      `INSERT INTO seller_product_selections (seller_id, product_id, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (seller_id, product_id)
       DO UPDATE SET is_active = true, updated_at = NOW()
       RETURNING id, seller_id AS "sellerId", product_id AS "productId"`,
      [userId, productId],
    );

    return selection.rows[0];
  }

  listSelectedBySeller(userId: string) {
    return this.db.query(
      `SELECT p.id, p.title, p.category, p.price::float AS price, p.commission_value AS "commissionValue",
              COUNT(s.id)::int AS sales,
              COALESCE(SUM(c.seller_amount), 0)::float AS earnings,
              MAX(sps.created_at) AS "selectedAt"
       FROM seller_product_selections sps
       JOIN products p ON p.id = sps.product_id
       LEFT JOIN sales s ON s.product_id = p.id AND s.seller_id = $1
       LEFT JOIN commissions c ON c.sale_id = s.id
       WHERE sps.seller_id = $1 AND sps.is_active = true AND p.is_active = true
       GROUP BY p.id
       ORDER BY "selectedAt" DESC`,
      [userId],
    );
  }
}

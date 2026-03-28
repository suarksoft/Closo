import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { CreditsService } from "../credits/credits.service";
import { DatabaseService } from "../database/database.service";
import { GeneratePackageDto } from "./dto/generate-package.dto";
import { ProspectSearchDto } from "./dto/prospect-search.dto";
import { RegenerateAssetDto } from "./dto/regenerate-asset.dto";

type WorkspaceRecord = {
  id: string;
  sellerId: string;
  productId: string;
  status: string;
};

@Injectable()
export class SalesWorkspacesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly creditsService: CreditsService,
  ) {}

  private async assertSellerHasProduct(sellerId: string, productId: string) {
    const selected = await this.db.query<{ product_id: string }>(
      `SELECT product_id
       FROM seller_product_selections
       WHERE seller_id = $1 AND product_id = $2 AND is_active = true
       LIMIT 1`,
      [sellerId, productId],
    );
    if (!selected.rows[0]) {
      throw new BadRequestException("Product must be added to dashboard first");
    }
  }

  private async findWorkspaceByProduct(sellerId: string, productId: string) {
    const result = await this.db.query<WorkspaceRecord>(
      `SELECT id, seller_id AS "sellerId", product_id AS "productId", status
       FROM sales_workspaces
       WHERE seller_id = $1 AND product_id = $2
       LIMIT 1`,
      [sellerId, productId],
    );
    return result.rows[0] ?? null;
  }

  private async assertWorkspaceOwner(sellerId: string, workspaceId: string) {
    const result = await this.db.query<WorkspaceRecord>(
      `SELECT id, seller_id AS "sellerId", product_id AS "productId", status
       FROM sales_workspaces
       WHERE id = $1
       LIMIT 1`,
      [workspaceId],
    );
    const workspace = result.rows[0];
    if (!workspace) throw new NotFoundException("Workspace not found");
    if (workspace.sellerId !== sellerId) throw new ForbiddenException("Not your workspace");
    return workspace;
  }

  private async getProductData(productId: string) {
    const product = await this.db.query<{
      id: string;
      title: string;
      description: string;
      category: string;
      commissionValue: number;
    }>(
      `SELECT id, title, description, category, commission_value AS "commissionValue"
       FROM products
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [productId],
    );
    if (!product.rows[0]) throw new NotFoundException("Product not found");
    return product.rows[0];
  }

  private async insertAssets(
    workspaceId: string,
    values: Array<{ assetType: string; content: string; persona?: string; tone?: string }>,
  ) {
    if (!values.length) return;
    await Promise.all(
      values.map((entry) =>
        this.db.query(
          `INSERT INTO workspace_assets (workspace_id, asset_type, content, persona, tone)
           VALUES ($1, $2, $3, $4, $5)`,
          [workspaceId, entry.assetType, entry.content, entry.persona ?? null, entry.tone ?? null],
        ),
      ),
    );
  }

  async bootstrap(sellerId: string, productId: string) {
    await this.assertSellerHasProduct(sellerId, productId);
    const existing = await this.findWorkspaceByProduct(sellerId, productId);
    if (existing) return existing;

    const inserted = await this.db.query<WorkspaceRecord>(
      `INSERT INTO sales_workspaces (seller_id, product_id, status)
       VALUES ($1, $2, 'active')
       RETURNING id, seller_id AS "sellerId", product_id AS "productId", status`,
      [sellerId, productId],
    );
    return inserted.rows[0];
  }

  async getWorkspaceByProduct(sellerId: string, productId: string) {
    const workspace = await this.findWorkspaceByProduct(sellerId, productId);
    if (!workspace) throw new NotFoundException("Workspace not found");

    const [product, prospects, assets, sequences] = await Promise.all([
      this.getProductData(workspace.productId),
      this.db.query(
        `SELECT id, source, company_name AS "companyName", contact_name AS "contactName",
                channel_hint AS "channelHint", location, website, score, notes
         FROM workspace_prospects
         WHERE workspace_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [workspace.id],
      ),
      this.db.query(
        `SELECT id, asset_type AS "assetType", content, persona, tone, version
         FROM workspace_assets
         WHERE workspace_id = $1
         ORDER BY created_at DESC`,
        [workspace.id],
      ),
      this.db.query(
        `SELECT id, channel, step_no AS "stepNo", delay_hours AS "delayHours", asset_id AS "assetId", goal
         FROM workspace_sequences
         WHERE workspace_id = $1
         ORDER BY channel ASC, step_no ASC`,
        [workspace.id],
      ),
    ]);

    return {
      workspace,
      product,
      prospects: prospects.rows,
      assets: assets.rows,
      sequences: sequences.rows,
      kpis: {
        prospectCount: prospects.rows.length,
        assetCount: assets.rows.length,
        sequenceStepCount: sequences.rows.length,
      },
    };
  }

  async generatePackage(sellerId: string, workspaceId: string, dto: GeneratePackageDto) {
    const workspace = await this.assertWorkspaceOwner(sellerId, workspaceId);
    const product = await this.getProductData(workspace.productId);

    const icpSpend = await this.creditsService.consume(sellerId, "workspace_icp", { workspaceId, step: "icp" });
    const icpBlock = await this.aiService.generateWorkspaceIcp({
      productName: product.title,
      productDescription: product.description,
      targetMarket: dto.targetMarket,
      commissionPercent: Number(product.commissionValue),
    });

    const scoringSpend = await this.creditsService.consume(sellerId, "workspace_scoring", {
      workspaceId,
      step: "scoring_rubric",
    });
    const scoringBlock = await this.aiService.generateWorkspaceScoringRubric({
      productName: product.title,
      category: product.category,
    });

    const scriptsSpend = await this.creditsService.consume(sellerId, "workspace_scripts", {
      workspaceId,
      step: "scripts",
    });
    const scriptBlock = await this.aiService.generateWorkspaceScripts({
      productName: product.title,
      productDescription: product.description,
      persona: dto.persona,
      tone: dto.tone,
    });

    const sequencesSpend = await this.creditsService.consume(sellerId, "workspace_sequences", {
      workspaceId,
      step: "sequence",
    });
    const sequenceBlock = await this.aiService.generateWorkspaceSequences({
      productName: product.title,
      persona: dto.persona,
    });

    await this.insertAssets(workspace.id, [
      { assetType: "email_subject", content: scriptBlock.emailSubject, persona: dto.persona, tone: dto.tone },
      { assetType: "email_body", content: scriptBlock.emailBody, persona: dto.persona, tone: dto.tone },
      { assetType: "wa_message", content: scriptBlock.whatsappMessage, persona: dto.persona, tone: dto.tone },
      { assetType: "ig_dm", content: scriptBlock.instagramDm, persona: dto.persona, tone: dto.tone },
      { assetType: "call_script", content: scriptBlock.callScript, persona: dto.persona, tone: dto.tone },
      { assetType: "objection_reply", content: scriptBlock.objectionReply, persona: dto.persona, tone: dto.tone },
      { assetType: "email_body", content: `ICP:\n${icpBlock.icpSummary}\n\nOffer Angle:\n${icpBlock.offerAngle}` },
      { assetType: "email_body", content: `Scoring Rubric:\n${scoringBlock.rubric}` },
    ]);

    await this.db.query("DELETE FROM workspace_sequences WHERE workspace_id = $1", [workspace.id]);

    type SequenceStep = {
      channel: string;
      stepNo: number;
      delayHours: number;
      goal: string;
    };

    const insertSequenceStep = async (step: SequenceStep) => {
      await this.db.query(
        `INSERT INTO workspace_sequences (workspace_id, channel, step_no, delay_hours, goal)
         VALUES ($1, $2, $3, $4, $5)`,
        [workspace.id, step.channel, step.stepNo, step.delayHours, step.goal],
      );
    };
    await Promise.all(sequenceBlock.steps.map((step) => insertSequenceStep(step as SequenceStep)));

    const creditsSpent = icpSpend.used + scoringSpend.used + scriptsSpend.used + sequencesSpend.used;

    await this.db.query(
      `INSERT INTO workspace_runs (workspace_id, input_json, output_json, credits_spent)
       VALUES ($1, $2::jsonb, $3::jsonb, $4)`,
      [
        workspace.id,
        JSON.stringify({ persona: dto.persona ?? null, tone: dto.tone ?? null, targetMarket: dto.targetMarket ?? null }),
        JSON.stringify({ icpBlock, scoringBlock, scriptBlock, sequenceBlock }),
        creditsSpent,
      ],
    );

    return this.getWorkspaceByProduct(sellerId, workspace.productId);
  }

  async searchProspects(sellerId: string, workspaceId: string, dto: ProspectSearchDto) {
    const workspace = await this.assertWorkspaceOwner(sellerId, workspaceId);
    const places = await this.aiService.searchPlaces({
      query: dto.query,
      location: dto.location,
      maxResults: dto.maxResults ?? 5,
    });
    await this.creditsService.consume(sellerId, "places_search", { workspaceId, query: dto.query });

    const rows = places.results ?? [];
    if (!rows.length) return { inserted: 0, prospects: [] };

    await Promise.all(
      rows.map((item) =>
        this.db.query(
          `INSERT INTO workspace_prospects (workspace_id, source, company_name, location, website, score)
           VALUES ($1, 'google_places', $2, $3, $4, $5)`,
          [
            workspace.id,
            item.name,
            item.formattedAddress ?? null,
            "websiteUri" in item ? (item.websiteUri as string | null) : null,
            70,
          ],
        ),
      ),
    );

    const prospects = await this.db.query(
      `SELECT id, source, company_name AS "companyName", location, website, score
       FROM workspace_prospects
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [workspace.id],
    );

    return {
      inserted: rows.length,
      prospects: prospects.rows,
    };
  }

  async regenerateAsset(sellerId: string, workspaceId: string, dto: RegenerateAssetDto) {
    const workspace = await this.assertWorkspaceOwner(sellerId, workspaceId);
    const product = await this.getProductData(workspace.productId);

    const channelMap: Record<string, "email" | "whatsapp" | "instagram"> = {
      email_subject: "email",
      email_body: "email",
      wa_message: "whatsapp",
      ig_dm: "instagram",
      call_script: "email",
      objection_reply: "email",
    };
    const channel = channelMap[dto.assetType] ?? "email";

    const generated = await this.aiService.generateSalesMessage({
      companyName: dto.companyName ?? "Prospect Company",
      productName: product.title,
      productDescription: product.description,
      channel,
    });

    const content =
      dto.assetType === "email_subject"
        ? generated.message.slice(0, 120)
        : dto.assetType === "objection_reply"
          ? `${generated.strategy}\n\n${generated.message}`
          : generated.message;

    await this.creditsService.consume(sellerId, "workspace_asset_regen", { workspaceId, assetType: dto.assetType });

    const inserted = await this.db.query(
      `INSERT INTO workspace_assets (workspace_id, asset_type, content, persona, tone, version)
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         COALESCE((SELECT MAX(version) + 1 FROM workspace_assets WHERE workspace_id = $1 AND asset_type = $2), 1)
       )
       RETURNING id, asset_type AS "assetType", content, persona, tone, version`,
      [workspace.id, dto.assetType, content, dto.persona ?? null, dto.tone ?? null],
    );

    return inserted.rows[0];
  }

  async exportWorkspace(sellerId: string, workspaceId: string) {
    const workspace = await this.assertWorkspaceOwner(sellerId, workspaceId);
    const product = await this.getProductData(workspace.productId);
    const [prospects, assets, sequences, runs] = await Promise.all([
      this.db.query(
        `SELECT company_name AS "companyName", contact_name AS "contactName", channel_hint AS "channelHint",
                location, website, score, notes
         FROM workspace_prospects
         WHERE workspace_id = $1
         ORDER BY created_at DESC`,
        [workspace.id],
      ),
      this.db.query(
        `SELECT asset_type AS "assetType", content, persona, tone, version
         FROM workspace_assets
         WHERE workspace_id = $1
         ORDER BY asset_type, version DESC`,
        [workspace.id],
      ),
      this.db.query(
        `SELECT channel, step_no AS "stepNo", delay_hours AS "delayHours", goal
         FROM workspace_sequences
         WHERE workspace_id = $1
         ORDER BY channel, step_no`,
        [workspace.id],
      ),
      this.db.query(
        `SELECT id, credits_spent AS "creditsSpent", created_at AS "createdAt"
         FROM workspace_runs
         WHERE workspace_id = $1
         ORDER BY created_at DESC`,
        [workspace.id],
      ),
    ]);

    return {
      workspace,
      product,
      prospects: prospects.rows,
      assets: assets.rows,
      sequences: sequences.rows,
      runs: runs.rows,
    };
  }

  async metricsForSeller(sellerId: string) {
    const [workspaceStats, runStats, salesStats] = await Promise.all([
      this.db.query<{ workspaceCount: number; prospectCount: number; assetCount: number; sequenceStepCount: number }>(
        `SELECT
           COUNT(DISTINCT sw.id)::int AS "workspaceCount",
           COUNT(DISTINCT wp.id)::int AS "prospectCount",
           COUNT(DISTINCT wa.id)::int AS "assetCount",
           COUNT(DISTINCT ws.id)::int AS "sequenceStepCount"
         FROM sales_workspaces sw
         LEFT JOIN workspace_prospects wp ON wp.workspace_id = sw.id
         LEFT JOIN workspace_assets wa ON wa.workspace_id = sw.id
         LEFT JOIN workspace_sequences ws ON ws.workspace_id = sw.id
         WHERE sw.seller_id = $1`,
        [sellerId],
      ),
      this.db.query<{ totalRuns: number; totalCreditsSpent: number }>(
        `SELECT
           COUNT(*)::int AS "totalRuns",
           COALESCE(SUM(wr.credits_spent), 0)::int AS "totalCreditsSpent"
         FROM workspace_runs wr
         JOIN sales_workspaces sw ON sw.id = wr.workspace_id
         WHERE sw.seller_id = $1`,
        [sellerId],
      ),
      this.db.query<{ verifiedSales: number }>(
        `SELECT COUNT(*)::int AS "verifiedSales"
         FROM sales
         WHERE seller_id = $1 AND status = 'verified'`,
        [sellerId],
      ),
    ]);

    const base = workspaceStats.rows[0];
    const runs = runStats.rows[0];
    const verifiedSales = Number(salesStats.rows[0]?.verifiedSales ?? 0);
    const totalCreditsSpent = Number(runs?.totalCreditsSpent ?? 0);

    return {
      ...base,
      totalRuns: Number(runs?.totalRuns ?? 0),
      totalCreditsSpent,
      verifiedSales,
      creditsPerVerifiedSale: verifiedSales > 0 ? Number((totalCreditsSpent / verifiedSales).toFixed(2)) : null,
    };
  }
}

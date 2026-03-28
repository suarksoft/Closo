import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { google, webmasters_v3 } from "googleapis";
import { PerformanceQueryDto } from "./dto/performance-query.dto";

@Injectable()
export class SearchConsoleService {
  private getSiteUrl() {
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) {
      throw new BadRequestException("GOOGLE_SEARCH_CONSOLE_SITE_URL is not configured");
    }
    return siteUrl;
  }

  private getClient() {
    const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
    if (!clientEmail || !privateKeyRaw) {
      throw new BadRequestException(
        "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL and GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY are required",
      );
    }
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    return google.webmasters({
      version: "v3",
      auth,
    });
  }

  async listSites() {
    try {
      const client = this.getClient();
      const response = await client.sites.list();
      return {
        sites: (response.data.siteEntry ?? []).map((site) => ({
          siteUrl: site.siteUrl,
          permissionLevel: site.permissionLevel,
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (
        typeof error === "object" &&
        error !== null &&
        "getStatus" in error &&
        typeof (error as { getStatus?: () => number }).getStatus === "function"
      ) {
        const status = (error as { getStatus: () => number }).getStatus();
        if (status >= 400 && status < 500) throw error;
      }
      throw new InternalServerErrorException(`Google Search Console list sites failed: ${String(error)}`);
    }
  }

  async queryPerformance(dto: PerformanceQueryDto) {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException("startDate cannot be greater than endDate");
    }
    try {
      const client = this.getClient();
      const siteUrl = this.getSiteUrl();
      const response = await client.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          dimensions: dto.dimensions ?? ["query"],
          searchType: dto.searchType ?? "web",
          rowLimit: dto.rowLimit ?? 100,
        },
      });

      const rows = response.data.rows ?? [];
      return {
        siteUrl,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalRows: rows.length,
        rows: rows.map((row: webmasters_v3.Schema$ApiDataRow) => ({
          keys: row.keys ?? [],
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: row.ctr ?? 0,
          position: row.position ?? 0,
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (
        typeof error === "object" &&
        error !== null &&
        "getStatus" in error &&
        typeof (error as { getStatus?: () => number }).getStatus === "function"
      ) {
        const status = (error as { getStatus: () => number }).getStatus();
        if (status >= 400 && status < 500) throw error;
      }
      throw new InternalServerErrorException(`Google Search Console performance query failed: ${String(error)}`);
    }
  }
}

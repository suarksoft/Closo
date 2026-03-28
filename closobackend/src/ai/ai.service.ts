import { Injectable } from "@nestjs/common";
import { LeadScoreDto } from "./dto/lead-score.dto";
import { SalesMessageDto } from "./dto/sales-message.dto";
import { StartupPlanDto } from "./dto/startup-plan.dto";
import { PlacesSearchDto } from "./dto/places-search.dto";

@Injectable()
export class AiService {
  private toNonEmptyString(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  private normalizeWorkspaceScriptResult(
    parsed: Partial<{
      emailSubject: string;
      emailBody: string;
      whatsappMessage: string;
      instagramDm: string;
      callScript: string;
      objectionReply: string;
    }>,
    productName: string,
  ) {
    return {
      emailSubject: this.toNonEmptyString(parsed.emailSubject, `${productName} ile satis surecinizi hizlandirin`),
      emailBody: this.toNonEmptyString(
        parsed.emailBody,
        `Merhaba,\n\n${productName} ile ekipler daha hizli karar alir ve daha cok anlasma kapatir. 15 dakikalik bir demo planlayalim mi?`,
      ),
      whatsappMessage: this.toNonEmptyString(
        parsed.whatsappMessage,
        `${productName} ile satis surecini sadeleştirip donusumu artiriyoruz. Kisa bir gorusme yapalim mi?`,
      ),
      instagramDm: this.toNonEmptyString(
        parsed.instagramDm,
        `${productName} ile outbound surecinizi hizlandirabilecek net bir akisimiz var. Kisa bir demo ister misiniz?`,
      ),
      callScript: this.toNonEmptyString(
        parsed.callScript,
        `Acilis: Merhaba, ${productName} ile nasil daha hizli satis kapanisi yaptirdigimizi paylasmak istiyorum.\nCTA: Bu hafta 15 dakikalik bir gorusme planlayabilir miyiz?`,
      ),
      objectionReply: this.toNonEmptyString(
        parsed.objectionReply,
        "Anliyorum. Kucuk bir pilot ile 1 hafta icinde net etkiyi birlikte olcebiliriz.",
      ),
    };
  }

  private normalizeWorkspaceSequenceSteps(
    steps: unknown,
    productName: string,
  ): Array<{ channel: string; stepNo: number; delayHours: number; goal: string }> {
    if (!Array.isArray(steps)) {
      return [
        { channel: "email", stepNo: 1, delayHours: 0, goal: `${productName} icin ilk temas` },
        { channel: "whatsapp", stepNo: 2, delayHours: 24, goal: "Kisa follow-up" },
      ];
    }

    const cleaned = steps
      .map((step, index) => {
        const record = (step ?? {}) as Record<string, unknown>;
        const channel = this.toNonEmptyString(record.channel, "email");
        const stepNoRaw = typeof record.stepNo === "number" ? record.stepNo : index + 1;
        const delayHoursRaw = typeof record.delayHours === "number" ? record.delayHours : 0;
        const goal = this.toNonEmptyString(record.goal, `${productName} outreach step ${index + 1}`);
        return {
          channel,
          stepNo: stepNoRaw > 0 ? Math.floor(stepNoRaw) : index + 1,
          delayHours: delayHoursRaw >= 0 ? Math.floor(delayHoursRaw) : 0,
          goal,
        };
      })
      .filter((step) => step.goal.length > 0);

    return cleaned.length
      ? cleaned
      : [{ channel: "email", stepNo: 1, delayHours: 0, goal: `${productName} icin ilk temas` }];
  }

  private hasApiKey() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async scoreLead(input: LeadScoreDto) {
    if (!this.hasApiKey()) {
      const heuristic =
        Math.min(95, 60 + input.companyName.length % 20 + (input.location ? 5 : 0) + input.category.length % 8);
      return {
        score: heuristic,
        reason: "Heuristic score (OPENAI_API_KEY not set).",
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Lead scoring request:
Company: ${input.companyName}
Category: ${input.category}
Location: ${input.location ?? "unknown"}
Return JSON with keys: score (0-100), reason (short).`,
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? '{"score":78,"reason":"No parsed output"}';
    try {
      return JSON.parse(text) as { score: number; reason: string };
    } catch {
      return { score: 78, reason: text };
    }
  }

  async generateSalesMessage(input: SalesMessageDto) {
    if (!this.hasApiKey()) {
      return {
        message: `Hi ${input.companyName}, we help teams using tools like ${input.productName} close more deals with less manual work. Would you be open to a quick intro this week?`,
        strategy: `Start with ${input.channel}, then follow up in 48 hours with a short ROI-based message.`,
        source: "fallback",
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Create outbound copy for:
Company: ${input.companyName}
Product: ${input.productName}
Description: ${input.productDescription}
Channel: ${input.channel}
Return JSON with keys: message, strategy.`,
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? '{"message":"Unable to generate","strategy":"Retry"}';
    try {
      return { ...JSON.parse(text), source: "openai" } as {
        message: string;
        strategy: string;
        source: string;
      };
    } catch {
      return { message: text, strategy: "Follow up with concise CTA.", source: "openai-raw" };
    }
  }

  async generateStartupPlan(input: StartupPlanDto) {
    if (!this.hasApiKey()) {
      return {
        summary: `Focus ${input.startupName} on high-intent outbound for ${input.productName}.`,
        icp: input.targetMarket ?? "B2B companies with visible growth and active sales hiring",
        playbook: [
          "Map top 3 industries with short sales cycles.",
          "Use Closo referral links per seller to attribute conversions.",
          "Run 2-channel outreach: email + LinkedIn with value-based hooks.",
          "Verify wins weekly and release seller commissions on Monad.",
        ],
        kpis: ["Response rate", "Qualified meetings", "Verified sales", "CAC payback window"],
        source: "fallback",
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Create a concise sales plan in JSON for:
Startup: ${input.startupName}
Product: ${input.productName}
Description: ${input.productDescription}
Target market: ${input.targetMarket ?? "not provided"}
Commission % for sellers: ${input.commissionPercent}
Return JSON keys: summary, icp, playbook(array), kpis(array).`,
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? "{}";
    try {
      return { ...JSON.parse(text), source: "openai" };
    } catch {
      return {
        summary: text,
        icp: "B2B buyers",
        playbook: ["Use outbound plus referral tracking."],
        kpis: ["Verified sales"],
        source: "openai-raw",
      };
    }
  }

  async searchPlaces(input: PlacesSearchDto) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        results: [
          {
            name: `${input.query} Prospect 1`,
            formattedAddress: input.location ?? "Unknown location",
            websiteUri: null,
          },
          {
            name: `${input.query} Prospect 2`,
            formattedAddress: input.location ?? "Unknown location",
            websiteUri: null,
          },
        ],
        source: "fallback",
      };
    }

    const query = input.location ? `${input.query} in ${input.location}` : input.query;
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.websiteUri,places.googleMapsUri,places.id",
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: input.maxResults ?? 5,
      }),
    });
    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        websiteUri?: string;
        googleMapsUri?: string;
      }>;
    };
    return {
      results: (data.places ?? []).map((place) => ({
        id: place.id,
        name: place.displayName?.text ?? "Unknown",
        formattedAddress: place.formattedAddress ?? "",
        websiteUri: place.websiteUri ?? null,
        googleMapsUri: place.googleMapsUri ?? null,
      })),
      source: "google_places",
    };
  }

  async generateWorkspaceIcp(input: {
    productName: string;
    productDescription: string;
    targetMarket?: string;
    commissionPercent?: number;
  }) {
    if (!this.hasApiKey()) {
      return {
        icpSummary: `${input.productName} icin ideal musteri profili: hizli karar veren KOBI operasyon ve satis ekipleri.`,
        offerAngle: `Komisyon (%${input.commissionPercent ?? 20}) odakli performans teklifi ve hizli ROI vurgusu.`,
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Build a concise ICP block in JSON.
Product: ${input.productName}
Description: ${input.productDescription}
Target market: ${input.targetMarket ?? "B2B SMB"}
Commission percent: ${input.commissionPercent ?? 20}
Return keys: icpSummary, offerAngle`,
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? "{}";
    try {
      return JSON.parse(text) as { icpSummary: string; offerAngle: string };
    } catch {
      return { icpSummary: text, offerAngle: "ROI ve hizli deger odakli teklif." };
    }
  }

  async generateWorkspaceScoringRubric(input: { productName: string; category: string }) {
    if (!this.hasApiKey()) {
      return {
        rubric:
          "Skor kriterleri: Satin alma niyeti (40), urun uyumu (25), ekip buyuklugu (20), ulasilabilir karar verici (15).",
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Create lead scoring rubric for affiliate sellers.
Product: ${input.productName}
Category: ${input.category}
Return JSON keys: rubric`,
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? "{}";
    try {
      return JSON.parse(text) as { rubric: string };
    } catch {
      return { rubric: text };
    }
  }

  async generateWorkspaceScripts(input: {
    productName: string;
    productDescription: string;
    persona?: string;
    tone?: string;
  }) {
    if (!this.hasApiKey()) {
      return this.normalizeWorkspaceScriptResult(
        {
          emailSubject: `${input.productName} ile satis performansinizi artis moduna alin`,
          emailBody: `Merhaba,\n\n${input.productName} ile ekibiniz daha kisa surede daha cok anlasma kapatabilir. 15 dakikalik demo ister misiniz?`,
          whatsappMessage: `${input.productName} ile satin alma karar suresini kisaltiyoruz. 10 dk goruselim mi?`,
          instagramDm: `${input.productName} ile satis surecini hizlandiran net bir modelimiz var. Kisa bir demo ister misiniz?`,
          callScript:
            `Acilis: Merhaba, ben Closo'dan ariyorum. 30 saniyede neden aradigimi paylasayim.\nDeger: ${input.productName} ekiplerin daha hizli kapanis yapmasina yardimci olur.\nCTA: Uygunsaniz bu hafta 15 dakikalik kisa bir gorusme planlayalim.`,
          objectionReply:
            "Anliyorum, zaman her ekipte kisitli. Bu nedenle pilotu kucuk baslatiyoruz ve ilk hafta icinde etkisini net olcebiliyoruz.",
        },
        input.productName,
      );
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Generate sales scripts as JSON for 4 channels plus objection handling.
Product: ${input.productName}
Description: ${input.productDescription}
Persona: ${input.persona ?? "operations manager"}
Tone: ${input.tone ?? "direct and consultative"}
Return keys: emailSubject, emailBody, whatsappMessage, instagramDm, callScript, objectionReply`,
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? "{}";
    try {
      return this.normalizeWorkspaceScriptResult(
        JSON.parse(text) as {
          emailSubject?: string;
          emailBody?: string;
          whatsappMessage?: string;
          instagramDm?: string;
          callScript?: string;
          objectionReply?: string;
        },
        input.productName,
      );
    } catch {
      return this.normalizeWorkspaceScriptResult(
        {
          emailSubject: `${input.productName} ile hizli buyume`,
          emailBody: text,
          whatsappMessage: text,
          instagramDm: text,
          callScript: text,
          objectionReply: text,
        },
        input.productName,
      );
    }
  }

  async generateWorkspaceSequences(input: { productName: string; persona?: string }) {
    if (!this.hasApiKey()) {
      return {
        steps: this.normalizeWorkspaceSequenceSteps(
          [
            { channel: "email", stepNo: 1, delayHours: 0, goal: `${input.productName} icin ilk temas` },
            { channel: "whatsapp", stepNo: 2, delayHours: 24, goal: "Kisa follow-up ve cevap tetikleme" },
            { channel: "instagram", stepNo: 3, delayHours: 48, goal: "DM ile gorusme teklifi" },
            { channel: "phone", stepNo: 4, delayHours: 72, goal: "Karar verici ile call ayarlama" },
          ],
          input.productName,
        ),
      };
    }

    const payload = {
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: `Create an outreach sequence in JSON.
Product: ${input.productName}
Persona: ${input.persona ?? "growth lead"}
Return key: steps (array of {channel,stepNo,delayHours,goal}) for channels email, whatsapp, instagram, phone.`,
    };
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text ?? "{}";
    try {
      const parsed = JSON.parse(text) as { steps?: Array<{ channel: string; stepNo: number; delayHours: number; goal: string }> };
      return {
        steps: this.normalizeWorkspaceSequenceSteps(parsed.steps ?? [], input.productName),
      };
    } catch {
      return {
        steps: this.normalizeWorkspaceSequenceSteps(
          [
            { channel: "email", stepNo: 1, delayHours: 0, goal: text.slice(0, 120) || "Initial contact" },
            { channel: "whatsapp", stepNo: 2, delayHours: 24, goal: "Follow-up" },
          ],
          input.productName,
        ),
      };
    }
  }
}

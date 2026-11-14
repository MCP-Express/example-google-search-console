import { defineTool } from "@mcpexpress/core";
import { z } from "zod";
import { getAccessToken } from "../google-auth.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format");

export const getSearchPerformance = defineTool({
  name: "get_search_performance",
  title: "Search Console performance",
  description:
    "Get Google Search Console performance totals for the configured site over a date range: clicks, impressions, " +
    "CTR and average position. Dates are in Pacific Time, inclusive; the latest 2-3 days are often incomplete. " +
    "Returns totals only, not per-query or per-page breakdowns.",
  input: z.object({
    startDate: isoDate.describe("First day of the range, inclusive, e.g. '2026-10-01'"),
    endDate: isoDate.describe("Last day of the range, inclusive, e.g. '2026-10-31'"),
    searchType: z
      .enum(["web", "image", "video", "news", "discover", "googleNews"])
      .default("web")
      .describe("Which search results to count, e.g. 'web' (default)"),
  }),
  output: z.object({
    siteUrl: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    searchType: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number().describe("Click-through rate as a fraction, e.g. 0.034 = 3.4%"),
    position: z.number().describe("Average position in results; lower is better"),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  env: ["GSC_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"],
  execute: async ({ startDate, endDate, searchType }, { signal }) => {
    const site = process.env.GSC_SITE_URL!;
    if (startDate > endDate) throw new Error(`startDate (${startDate}) is after endDate (${endDate}).`);

    const token = await getAccessToken(signal);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate, endDate, type: searchType, dataState: "all" }),
      signal,
    });

    if (res.status === 403 || res.status === 404) {
      throw new Error(
        `No access to "${site}". Check GSC_SITE_URL (domain properties look like 'sc-domain:example.com') ` +
          "and add the service account's email as a user on the property in Search Console.",
      );
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Search Console error: HTTP ${res.status} ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      rows?: { clicks: number; impressions: number; ctr: number; position: number }[];
    };
    const row = data.rows?.[0];
    return {
      siteUrl: site,
      startDate,
      endDate,
      searchType,
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: row?.ctr ?? 0,
      position: row?.position ?? 0,
    };
  },
});

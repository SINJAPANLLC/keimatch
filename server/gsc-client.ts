import { google } from "googleapis";
import { storage } from "./storage";

const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
];
export const SITE_URL = process.env.SITE_URL || "https://keimatch-sinjapan.com/";

function getOAuth2Client(redirectUri: string, refreshToken?: string) {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("OAuth credentials not configured (YOUTUBE_OAUTH_CLIENT_ID / YOUTUBE_OAUTH_CLIENT_SECRET)");
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
  return oauth2Client;
}

export function buildRedirectUri(baseUrl: string): string {
  return `${baseUrl}/api/admin/gsc/callback`;
}

export function getGscAuthUrl(baseUrl: string): string {
  const redirectUri = buildRedirectUri(baseUrl);
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GSC_SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCodeForToken(code: string, baseUrl: string): Promise<string> {
  const redirectUri = buildRedirectUri(baseUrl);
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("リフレッシュトークンが取得できませんでした。Google OAuthの設定でaccess_type=offlineが必要です。");
  }
  return tokens.refresh_token;
}

async function getRefreshToken(): Promise<string> {
  const token = await storage.getAdminSetting("gsc_refresh_token");
  if (!token) throw new Error("GSC未接続。管理画面からSearch Consoleを接続してください。");
  return token;
}

export async function isGscConnected(): Promise<boolean> {
  try {
    const token = await storage.getAdminSetting("gsc_refresh_token");
    return !!token;
  } catch {
    return false;
  }
}

async function getGscApi() {
  const token = await getRefreshToken();
  const dummyRedirectUri = buildRedirectUri(SITE_URL);
  const oauth2Client = getOAuth2Client(dummyRedirectUri, token);
  return google.webmasters({ version: "v3", auth: oauth2Client });
}

export interface GscKeyword {
  keyword: string;
  impressions: number;
  clicks: number;
  position: number;
  ctr: number;
  type?: "opportunity" | "top" | "lowctr";
}

export async function getOpportunityKeywords(limit = 50): Promise<GscKeyword[]> {
  const gsc = await getGscApi();
  const endDate = new Date();

  // 90日分取得（サイトが新しいため長めに）
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 90);

  const response = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["query"],
      rowLimit: 1000,
    },
  });

  const rows = response.data.rows || [];

  const toKw = (row: any): GscKeyword => ({
    keyword: (row.keys?.[0] || "").replace(/\+/g, " "),
    impressions: Math.round(row.impressions || 0),
    clicks: Math.round(row.clicks || 0),
    position: Math.round((row.position || 0) * 10) / 10,
    ctr: Math.round((row.ctr || 0) * 1000) / 10,
  });

  // 1) 機会キーワード: 表示があり順位6位以下（改善余地あり）
  const opportunityRows = rows
    .filter((r) => (r.impressions || 0) >= 1 && (r.position || 0) > 5)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, Math.ceil(limit * 0.5))
    .map((r) => ({ ...toKw(r), type: "opportunity" as const }));

  // 2) 上位表示キーワード: 1〜5位（既に上位）
  const topRows = rows
    .filter((r) => (r.impressions || 0) >= 1 && (r.position || 0) >= 1 && (r.position || 0) <= 5)
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .slice(0, Math.ceil(limit * 0.25))
    .map((r) => ({ ...toKw(r), type: "top" as const }));

  // 3) 低CTRキーワード: 表示はあるがクリックが少ない（タイトル改善余地）
  const lowCtrRows = rows
    .filter((r) => (r.impressions || 0) >= 2 && (r.clicks || 0) === 0 && (r.position || 0) <= 20)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, Math.ceil(limit * 0.25))
    .map((r) => ({ ...toKw(r), type: "lowctr" as const }));

  // 重複を除いてマージ
  const seen = new Set<string>();
  const merged: GscKeyword[] = [];
  for (const kw of [...opportunityRows, ...topRows, ...lowCtrRows]) {
    if (!seen.has(kw.keyword)) {
      seen.add(kw.keyword);
      merged.push(kw);
    }
  }

  return merged.slice(0, limit);
}

export interface GscPagePerformance {
  slug: string;
  position: number;
  ctr: number;
  impressions: number;
  clicks: number;
}

export async function getPagePerformance(): Promise<GscPagePerformance[]> {
  const gsc = await getGscApi();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);

  const response = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["page"],
      rowLimit: 1000,
    },
  });

  const rows = response.data.rows || [];
  return rows
    .filter((row) => {
      const url = row.keys?.[0] || "";
      return url.includes("/column/");
    })
    .map((row) => {
      const url = row.keys?.[0] || "";
      const slug = url.replace(SITE_URL, "").replace("/column/", "");
      return {
        slug,
        position: Math.round((row.position || 0) * 10) / 10,
        ctr: Math.round((row.ctr || 0) * 1000) / 10,
        impressions: Math.round(row.impressions || 0),
        clicks: Math.round(row.clicks || 0),
      };
    });
}

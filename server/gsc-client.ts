import { google } from "googleapis";
import { storage } from "./storage";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const SITE_URL = process.env.SITE_URL || "https://keimatch-sinjapan.com";

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
    scope: GSC_SCOPE,
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
}

export async function getOpportunityKeywords(limit = 20): Promise<GscKeyword[]> {
  const gsc = await getGscApi();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const response = await gsc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dimensions: ["query"],
      rowLimit: 200,
    },
  });

  const rows = response.data.rows || [];
  return rows
    .filter((row) => (row.impressions || 0) >= 5 && (row.position || 0) > 5)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, limit)
    .map((row) => ({
      keyword: (row.keys?.[0] || "").replace(/\+/g, " "),
      impressions: Math.round(row.impressions || 0),
      clicks: Math.round(row.clicks || 0),
      position: Math.round((row.position || 0) * 10) / 10,
      ctr: Math.round((row.ctr || 0) * 1000) / 10,
    }));
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

import { storage } from "./storage";
import { sendEmail } from "./notification-service";

const DAILY_SEND_LIMIT = 1000;
const SEND_INTERVAL_MS = 1200;
const CRAWL_BATCH_SIZE = 500;

const SEARCH_QUERIES = [
  "軽貨物 配送 会社概要",
  "軽貨物 運送会社 お問い合わせ",
  "貨物軽自動車運送事業 会社",
  "軽貨物 ドライバー 募集",
  "軽貨物 チャーター便",
  "軽貨物 配送 株式会社",
  "軽貨物 宅配 業務委託",
  "軽貨物 スポット便 配送",
  "軽貨物 ラストマイル 配送",
  "軽貨物 EC配送 株式会社",
  "軽貨物 個人事業主 配送",
  "軽バン 配送 会社概要",
  "軽貨物 案件 マッチング",
  "軽貨物 配送パートナー 募集",
  "軽貨物 フードデリバリー 配送",
  "軽貨物 冷蔵冷凍 配送",
  "軽貨物 緊急配送 即日",
  "軽貨物 運送 開業",
  "軽貨物 配送代行 会社",
  "軽貨物 企業配送 法人",
  "軽貨物 ルート配送 募集",
  "軽貨物 即日配送 会社概要",
  "軽貨物 物流 アウトソーシング",
  "軽貨物 配送委託 パートナー",
  "軽貨物 引越し 赤帽",
  "軽貨物 ネットスーパー 配送",
  "軽貨物 医薬品 配送",
  "バイク便 即日配送 会社",
  "軽貨物 定期便 契約",
  "軽貨物 夜間配送 会社",
  "軽貨物 長距離 チャーター",
  "軽貨物 共同配送 会社概要",
  "軽貨物 倉庫 配送 一貫",
  "軽貨物 ハンドキャリー 会社",
  "軽貨物 求人 ドライバー 配送",
  "軽貨物 運送 事業者 一覧",
  "軽貨物 配送 パートナー企業",
  "軽貨物 配送 業者 おすすめ",
  "軽貨物 配送 会社 評判",
  "軽貨物 開業 サポート 会社",
  "軽貨物 配送 委託 企業",
  "軽貨物 配送 マッチング 会社",
  "軽貨物 配送 業務提携",
  "軽貨物 運送 法人 配送",
  "軽貨物 宅配 事業 法人",
  "軽貨物 配送 下請け 募集",
  "軽貨物 傭車 募集",
  "軽貨物 協力会社 募集",
  "配送ドライバー 業務委託 軽貨物",
  "置き配 配送 軽貨物 会社",
  "通販 配送 軽貨物 業者",
  "出前 配送 軽貨物",
  "家具配送 軽貨物 設置",
  "家電配送 軽貨物 会社",
  "引越し 単身 軽貨物",
  "書類配送 軽貨物 即日",
  "検体輸送 軽貨物 医療",
  "花 配送 軽貨物",
  "ケータリング 配送 軽貨物",
  "ペット輸送 軽貨物",
  "カーゴ 軽貨物 会社概要",
  "PickGo 軽貨物",
  "ハコベル 軽貨物",
  "Amazon Flex 軽貨物 配送",
  "軽貨物 配送 地域密着",
  "軽貨物 個人事業 開業 配送",
  "軽貨物 黒ナンバー 配送 会社",
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/g;
const FAX_REGEX = /(?:FAX|fax|Fax|ファクス|ファックス)[：:\s]*([0-9\-\s]+)/g;

const EXCLUDED_EMAIL_DOMAINS = [
  "example.com", "test.com", "gmail.com", "yahoo.co.jp", "hotmail.com",
  "outlook.com", "icloud.com", "googlemail.com", "yahoo.com",
  "keimatch-sinjapan.com", "sinjapan.jp",
];

function isValidCompanyEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (EXCLUDED_EMAIL_DOMAINS.includes(domain)) return false;
  if (email.includes("noreply") || email.includes("no-reply") || email.includes("mailer-daemon")) return false;
  return true;
}

const STRONG_TRANSPORT_KEYWORDS = [
  "貨物軽自動車運送事業", "軽貨物運送", "軽貨物配送",
  "軽貨物ドライバー", "軽貨物業務委託", "軽貨物チャーター",
  "ラストマイル配送", "EC配送", "宅配業務委託",
  "国土交通省届出", "運輸支局届出",
  "スポット便", "即日配送", "軽貨物案件",
];

const TRANSPORT_KEYWORDS = [
  "軽貨物", "配送", "宅配", "デリバリー", "ラストマイル",
  "logistics", "delivery", "cargo",
  "軽バン", "軽トラ", "軽ワゴン", "バイク便",
  "個人事業主", "業務委託", "フリーランス",
  "EC物流", "通販配送", "ネット通販",
  "冷蔵配送", "冷凍配送", "チルド配送",
  "スポット", "定期便", "ルート配送", "配車",
];

const NON_TRANSPORT_KEYWORDS = [
  "不動産", "マンション", "賃貸", "分譲", "戸建", "ホテル", "旅館",
  "レストラン", "カフェ", "美容", "エステ", "クリニック", "病院",
  "学校", "塾", "予備校", "保険", "証券", "銀行",
  "セミナー", "イベント", "展示会", "内覧", "見学",
  "弁護士", "税理士", "行政書士事務所", "司法書士",
  "プログラミング", "IT企業", "ソフトウェア開発",
  "飲食店", "居酒屋", "寿司", "ラーメン",
];

const PORTAL_DOMAINS = [
  "imitsu.jp", "baseconnect.in", "biz.ne.jp", "houjin.jp",
  "clearworks.co.jp", "job-gear.jp", "townwork.net",
  "navit-j.com", "mapion.co.jp", "ekiten.jp", "itp.ne.jp",
  "ashita-office.com", "freee.co.jp", "minkabu.jp",
];

function isPortalSite(url: string): boolean {
  try {
    const domain = new URL(url).hostname;
    return PORTAL_DOMAINS.some(d => domain.includes(d));
  } catch { return false; }
}

function getTextContent(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .substring(0, 8000);
}

function isTransportCompany(html: string, url: string): boolean {
  if (isPortalSite(url)) return false;

  const textContent = getTextContent(html);
  const lowerText = textContent.toLowerCase();
  const lowerUrl = url.toLowerCase();

  let strongScore = 0;
  for (const kw of STRONG_TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase()) || lowerUrl.includes(kw.toLowerCase())) {
      strongScore++;
    }
  }
  if (strongScore >= 1) return true;

  let transportScore = 0;
  for (const kw of TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase()) || lowerUrl.includes(kw.toLowerCase())) {
      transportScore++;
    }
  }

  let nonTransportScore = 0;
  for (const kw of NON_TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase())) {
      nonTransportScore++;
    }
  }

  if (transportScore < 2) return false;
  if (nonTransportScore >= transportScore) return false;
  return true;
}

function detectIndustry(html: string): string {
  const text = getTextContent(html).toLowerCase();
  if (text.includes("軽貨物") && text.includes("配送")) return "軽貨物配送";
  if (text.includes("貨物軽自動車運送")) return "貨物軽自動車運送事業";
  if (text.includes("軽貨物")) return "軽貨物運送";
  if (text.includes("ラストマイル") || text.includes("宅配")) return "ラストマイル配送";
  if (text.includes("冷凍") || text.includes("冷蔵")) return "冷蔵冷凍配送";
  if (text.includes("ec") && text.includes("配送")) return "EC配送";
  if (text.includes("フードデリバリー") || text.includes("デリバリー")) return "フードデリバリー";
  if (text.includes("バイク便")) return "バイク便";
  if (text.includes("配送") || text.includes("運送")) return "軽貨物配送";
  return "配送関連";
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const text = await res.text();
    return text;
  } catch {
    return "";
  }
}

function extractContactInfo(html: string): { emails: string[]; phones: string[]; faxes: string[] } {
  const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  const emailSet = new Set((textContent.match(EMAIL_REGEX) || []).filter(isValidCompanyEmail));
  const emails = Array.from(emailSet);

  const phoneSet = new Set(textContent.match(PHONE_REGEX) || []);
  const phones = Array.from(phoneSet);

  const faxes: string[] = [];
  let faxMatch;
  const faxRegex = new RegExp(FAX_REGEX.source, "g");
  while ((faxMatch = faxRegex.exec(textContent)) !== null) {
    faxes.push(faxMatch[1].trim());
  }
  const faxSet = new Set(faxes);

  return { emails: emails.slice(0, 5), phones: phones.slice(0, 3), faxes: Array.from(faxSet).slice(0, 3) };
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  try {
    const origin = new URL(baseUrl).origin;
    const hrefPattern = /href=["']([^"'#]+)["']/gi;
    let match;
    while ((match = hrefPattern.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith("/")) href = origin + href;
      if (href.startsWith(origin) && !href.includes("javascript:") && !href.endsWith(".pdf") && !href.endsWith(".jpg") && !href.endsWith(".png")) {
        if (!links.includes(href) && href !== baseUrl) links.push(href);
      }
    }
  } catch {}
  return links.slice(0, 10);
}

function extractCompanyName(html: string, url: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1].replace(/\s*[|\-–—].*$/, "").trim();
    if (title && title.length > 2 && title.length < 50) return title;
  }
  const ogMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i);
  if (ogMatch) return ogMatch[1].trim();
  try { return new URL(url).hostname; } catch { return url; }
}

async function findEmailOnRelatedPages(baseUrl: string): Promise<{ emails: string[]; phones: string[]; faxes: string[] } | null> {
  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;
    const relatedPaths = [
      "/contact", "/contact/", "/company/", "/about/", "/access/", "/inquiry/",
      "/info", "/info/", "/corp/", "/corporate/", "/ask/", "/form/",
      "/contact.html", "/company.html", "/about.html", "/inquiry.html",
      "/toiawase/", "/otoiawase/", "/mail/", "/mail.html",
      "/profile/", "/gaiyou/", "/kaisyagaiyou/",
    ];
    for (const path of relatedPaths) {
      const relatedUrl = origin + path;
      if (relatedUrl === baseUrl) continue;
      const html = await fetchPageContent(relatedUrl);
      if (html && html.length > 500) {
        const info = extractContactInfo(html);
        if (info.emails.length > 0) {
          console.log(`[Lead Crawler] Found email on related page: ${relatedUrl}`);
          return info;
        }
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const mainHtml = await fetchPageContent(baseUrl);
    if (mainHtml) {
      const internalLinks = extractInternalLinks(mainHtml, baseUrl);
      const contactLinks = internalLinks.filter(link => {
        const lower = link.toLowerCase();
        return lower.includes("contact") || lower.includes("company") || lower.includes("about")
          || lower.includes("inquiry") || lower.includes("toiawase") || lower.includes("mail")
          || lower.includes("info") || lower.includes("gaiyou") || lower.includes("ask");
      });
      for (const link of contactLinks.slice(0, 5)) {
        const html = await fetchPageContent(link);
        if (html && html.length > 500) {
          const info = extractContactInfo(html);
          if (info.emails.length > 0) {
            console.log(`[Lead Crawler] Found email via internal link: ${link}`);
            return info;
          }
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function crawlLeadsFromUrl(url: string): Promise<number> {
  console.log(`[Lead Crawler] Crawling: ${url}`);
  const html = await fetchPageContent(url);
  if (!html) return 0;

  if (!isTransportCompany(html, url)) {
    console.log(`[Lead Crawler] Skipped (not transport): ${url}`);
    return 0;
  }

  let { emails, phones, faxes } = extractContactInfo(html);
  const companyName = extractCompanyName(html, url);

  try {
    const domain = new URL(url).hostname;
    const existingByDomain = await storage.getEmailLeadByDomain(domain);
    if (existingByDomain) {
      console.log(`[Lead Crawler] Skipped (domain already exists): ${domain}`);
      return 0;
    }
  } catch {}

  if (emails.length === 0) {
    const relatedInfo = await findEmailOnRelatedPages(url);
    if (relatedInfo) {
      emails = relatedInfo.emails;
      if (relatedInfo.phones.length > 0) phones = relatedInfo.phones;
      if (relatedInfo.faxes.length > 0) faxes = relatedInfo.faxes;
    }
    if (emails.length === 0) return 0;
  }

  let added = 0;

  for (const email of emails) {
    const existing = await storage.getEmailLeadByEmail(email);
    if (existing) continue;

    try {
      const industry = detectIndustry(html);
      await storage.createEmailLead({
        companyName,
        email,
        fax: faxes[0] || null,
        phone: phones[0] || null,
        website: url,
        address: null,
        industry,
        source: url,
        status: "new",
      });
      added++;
    } catch (err) {
      console.error(`[Lead Crawler] Failed to save lead ${email}:`, err);
    }
  }

  return added;
}

const DIRECTORY_SOURCES = [
  "https://www.jta.or.jp/member/",
  "https://www.logi-today.com/company-list",
  "https://transport-guide.jp/company/",
  "https://www.trabox.ne.jp/company/",
  "https://www.butsuryu.or.jp/member/",
  "https://lnews.jp/logistics-company/",
  "https://www.e-logit.com/companylist/",
  "https://www.logistics.jp/company/",
  "https://www.keikamotsu.com/",
  "https://driver-job.jp/",
  "https://www.k-kasha.com/",
  "https://cargo-navi.jp/",
  "https://www.haisou-navi.com/",
  "https://www.driverstand.com/",
  "https://www.kurumatch.com/",
  "https://pickgo.town/",
  "https://hacobell.com/",
  "https://www.keikamotsu-navi.com/",
];

const PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野",
  "岐阜", "静岡", "愛知", "三重",
  "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知",
  "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
];

function extractExternalUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkPattern = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  const baseDomain = new URL(baseUrl).hostname;

  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1];
    try {
      const domain = new URL(url).hostname;
      if (domain === baseDomain) continue;
      if (isExcludedDomain(domain)) continue;
      if (domain.endsWith(".co.jp") || domain.endsWith(".jp") || domain.endsWith(".com")) {
        if (!urls.some(u => { try { return new URL(u).hostname === domain; } catch { return false; } })) {
          urls.push(url);
        }
      }
    } catch {}
  }
  return urls;
}

const EXCLUDED_DOMAINS = [
  "duckduckgo", "google", "youtube", "wikipedia", "yahoo", "bing",
  "indeed", "recruit", "mynavi", "doda", "keikamotsu", "tramatch", "amazon", "facebook", "twitter",
  "instagram", "linkedin", "tiktok", "reddit", "naver", "rakuten", "goo.ne.jp",
  "baseconnect.in", "clearworks.co.jp", "wantedly", "en-gage", "hellowork",
  "mlit.go.jp", "freee.co.jp", "crowdworks", "lancers", "coconala",
  "imitsu.jp", "houjin.jp", "biz.ne.jp", "townwork.net", "ekiten.jp",
  "itp.ne.jp", "mapion.co.jp", "navit-j.com", "minkabu.jp",
  "gyouseisyosi", "job-gear.jp", "ashita-office.com",
];

function isExcludedDomain(domain: string): boolean {
  return EXCLUDED_DOMAINS.some(d => domain.includes(d));
}

function isJapaneseDomain(domain: string): boolean {
  if (domain.endsWith(".jp") || domain.endsWith(".co.jp") || domain.endsWith(".ne.jp") || domain.endsWith(".or.jp")) return true;
  return false;
}

function addUniqueUrl(urls: string[], newUrl: string, japanOnly = false): boolean {
  try {
    const domain = new URL(newUrl).hostname;
    if (isExcludedDomain(domain)) return false;
    if (japanOnly && !isJapaneseDomain(domain)) return false;
    if (urls.some(u => { try { return new URL(u).hostname === domain; } catch { return false; } })) return false;
    urls.push(newUrl);
    return true;
  } catch { return false; }
}

async function searchDuckDuckGoForUrls(query: string): Promise<string[]> {
  const urls: string[] = [];

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
  ];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=jp-jp`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Referer": "https://duckduckgo.com/",
        "DNT": "1",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      console.log(`[Lead Crawler] DuckDuckGo returned ${res.status} for "${query}"`);
    } else {
      const html = await res.text();

      let match;
      const uddgPattern = /uddg=(https?%3A%2F%2F[^&"']+)/gi;
      while ((match = uddgPattern.exec(html)) !== null) {
        try { addUniqueUrl(urls, decodeURIComponent(match[1]), true); } catch {}
      }

      const resultLinkPattern = /class="result__a"[^>]*href="([^"]+)"/gi;
      while ((match = resultLinkPattern.exec(html)) !== null) {
        try {
          let href = match[1];
          if (href.includes("uddg=")) {
            const u = new URL(href, "https://duckduckgo.com").searchParams.get("uddg");
            if (u) href = u;
          }
          addUniqueUrl(urls, href, true);
        } catch {}
      }

      const snippetUrlPattern = /class="result__url"[^>]*>([^<]+)</gi;
      while ((match = snippetUrlPattern.exec(html)) !== null) {
        try {
          let domain = match[1].trim().replace(/\s/g, "");
          if (!domain.startsWith("http")) domain = "https://" + domain;
          const cleanUrl = new URL(domain).origin;
          addUniqueUrl(urls, cleanUrl, true);
        } catch {}
      }

      const hrefPattern = /href="(https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.(?:co\.jp|ne\.jp|or\.jp|jp)[^"]*?)"/gi;
      while ((match = hrefPattern.exec(html)) !== null) {
        try { addUniqueUrl(urls, match[1], true); } catch {}
      }
    }
  } catch (err) {
    console.error(`[Lead Crawler] DuckDuckGo search failed:`, err);
  }

  if (urls.length < 5) {
    try {
      await new Promise(r => setTimeout(r, 1000));
      const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&cc=jp&setlang=ja`;
      const bingRes = await fetch(bingUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.5",
        },
      });
      if (bingRes.ok) {
        const bingHtml = await bingRes.text();
        let match;
        const bingLinkPattern = /<a[^>]*href="(https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.(?:co\.jp|ne\.jp|or\.jp|jp)[^"]*?)"[^>]*>/gi;
        while ((match = bingLinkPattern.exec(bingHtml)) !== null) {
          try { addUniqueUrl(urls, match[1], true); } catch {}
        }
        const citeLinkPattern = /<cite[^>]*>(https?:\/\/[^<]+)<\/cite>/gi;
        while ((match = citeLinkPattern.exec(bingHtml)) !== null) {
          try { addUniqueUrl(urls, match[1].replace(/<[^>]+>/g, "").trim(), true); } catch {}
        }
        if (urls.length > 0) console.log(`[Lead Crawler] Bing added URLs, total now: ${urls.length}`);
      }
    } catch {}
  }

  console.log(`[Lead Crawler] Search found ${urls.length} URLs for "${query}"`);
  return urls.slice(0, 20);
}

export async function crawlLeadsWithAI(maxCount?: number): Promise<{ searched: number; found: number }> {
  let totalFound = 0;
  let totalSearched = 0;
  const limit = maxCount || CRAWL_BATCH_SIZE;

  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
  const todaysQueries = shuffled.slice(0, 15);

  const shuffledPrefs = [...PREFECTURES].sort(() => Math.random() - 0.5);
  const todaysPrefectures = shuffledPrefs.slice(0, 20);

  for (const query of todaysQueries) {
    if (totalFound >= limit) break;
    for (const prefecture of todaysPrefectures) {
      if (totalFound >= limit) break;
      try {
        const fullQuery = `${prefecture} ${query}`;
        console.log(`[Lead Crawler] Searching: "${fullQuery}"`);
        const urls = await searchDuckDuckGoForUrls(fullQuery);

        if (urls.length === 0) {
          const simpleQuery = `"${prefecture}" 軽貨物 配送 連絡先`;
          console.log(`[Lead Crawler] Trying simple: "${simpleQuery}"`);
          const altUrls = await searchDuckDuckGoForUrls(simpleQuery);
          urls.push(...altUrls);
        }

        for (const url of urls) {
          if (totalFound >= limit) break;
          totalSearched++;
          const found = await crawlLeadsFromUrl(url);
          totalFound += found;
          if (found > 0) console.log(`[Lead Crawler] +${found} lead(s) from ${url}`);
          await new Promise(r => setTimeout(r, 1500));
        }

        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[Lead Crawler] Search failed for "${query}":`, err);
      }
    }
  }

  if (totalFound < limit) {
    const shuffledDirs = [...DIRECTORY_SOURCES].sort(() => Math.random() - 0.5);
    for (const dirUrl of shuffledDirs) {
      if (totalFound >= limit) break;
      try {
        console.log(`[Lead Crawler] Checking directory: ${dirUrl}`);
        const dirHtml = await fetchPageContent(dirUrl);
        if (!dirHtml) continue;
        const companyUrls = extractExternalUrls(dirHtml, dirUrl);
        console.log(`[Lead Crawler] Found ${companyUrls.length} company links from directory`);
        const shuffledCompanies = companyUrls.sort(() => Math.random() - 0.5).slice(0, 15);
        for (const compUrl of shuffledCompanies) {
          if (totalFound >= limit) break;
          totalSearched++;
          const found = await crawlLeadsFromUrl(compUrl);
          totalFound += found;
          if (found > 0) console.log(`[Lead Crawler] +${found} lead(s) from ${compUrl}`);
          await new Promise(r => setTimeout(r, 1500));
        }
      } catch (err) {
        console.error(`[Lead Crawler] Directory crawl failed:`, err);
      }
    }
  }

  console.log(`[Lead Crawler] Crawl complete: searched=${totalSearched}, found=${totalFound}`);
  return { searched: totalSearched, found: totalFound };
}

export async function sendDailyLeadEmails(): Promise<{ sent: number; failed: number }> {
  const todaySent = await storage.getTodaySentLeadCount();
  const remaining = DAILY_SEND_LIMIT - todaySent;
  if (remaining <= 0) {
    console.log(`[Lead Email] Daily limit reached (${todaySent}/${DAILY_SEND_LIMIT})`);
    return { sent: 0, failed: 0 };
  }

  const template = await storage.getAdminSetting("lead_email_subject");
  const bodyTemplate = await storage.getAdminSetting("lead_email_body");

  const subject = template || "軽貨物の案件獲得・空き車両活用でお困りではありませんか？｜ケイマッチ";
  const body = bodyTemplate || `{company}
ご担当者様

突然のご連絡、大変失礼いたします。
軽貨物案件マッチングサービス「ケイマッチ」を運営しております、合同会社SIN JAPANと申します。

貴社のホームページを拝見し、軽貨物配送事業を展開されていることを知り、ご連絡させていただきました。

━━━━━━━━━━━━━━━━━━━━
■ こんなお悩みはありませんか？
━━━━━━━━━━━━━━━━━━━━
☑ 帰り便・空き時間の案件が見つからない
☑ 荷主の新規開拓に時間とコストがかかる
☑ 繁忙期と閑散期の波が激しく収益が不安定
☑ 案件情報が電話・FAX中心で非効率

━━━━━━━━━━━━━━━━━━━━
■「ケイマッチ」でできること
━━━━━━━━━━━━━━━━━━━━
✅ AIが最適な案件を自動マッチング
　→ 空き車両情報を登録するだけで、条件に合う案件をAIが自動提案

✅ スポット便・チャーター便・定期便に対応
　→ 軽バン・軽トラ・冷蔵冷凍車など車種別に案件検索可能

✅ 全国の軽貨物事業者とつながる
　→ 帰り便の確保や、繁忙期の車両確保にも活用できます

✅ 完全無料でスタート可能
　→ 初期費用・月額費用なしで今すぐご利用いただけます

━━━━━━━━━━━━━━━━━━━━
■ 30秒で無料登録
━━━━━━━━━━━━━━━━━━━━
▼ サービス詳細・無料登録はこちら
https://keimatch-sinjapan.com/register

現在、サービス開始キャンペーンとして
全機能を無料でご利用いただけます。

━━━━━━━━━━━━━━━━━━━━

ご多忙のところ恐縮ですが、
貴社の配送事業の効率化にお役立ていただけましたら幸いです。

ご質問・ご不明な点がございましたら、
本メールへのご返信、またはお電話にてお気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ケイマッチ運営事務局
合同会社SIN JAPAN
〒243-0303 神奈川県愛甲郡愛川町中津7287
TEL: 046-212-2325
URL: https://keimatch-sinjapan.com
━━━━━━━━━━━━━━━━━━━━

※本メールは貴社ホームページに掲載されている
　連絡先情報をもとにお送りしております。
※今後のメール配信を希望されない場合は、
　本メールへその旨ご返信いただければ、
　速やかに配信を停止いたします。`;

  const leads = await storage.getNewEmailLeadsForSending(remaining);
  if (leads.length === 0) {
    console.log("[Lead Email] No new leads to send");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.email) continue;

    try {
      const personalizedBody = body.replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, subject, personalizedBody);

      if (result.success) {
        await storage.updateEmailLead(lead.id, {
          status: "sent",
          sentAt: new Date(),
          sentSubject: subject,
        });
        sent++;
      } else {
        await storage.updateEmailLead(lead.id, { status: "failed" });
        failed++;
        console.error(`[Lead Email] Failed: ${lead.email} - ${result.error}`);
      }
    } catch (err) {
      await storage.updateEmailLead(lead.id, { status: "failed" });
      failed++;
      console.error(`[Lead Email] Error: ${lead.email}`, err);
    }

    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead Email] Daily send complete: sent=${sent}, failed=${failed}`);
  return { sent, failed };
}

export async function retryFailedLeads(): Promise<{ sent: number; failed: number }> {
  const template = await storage.getAdminSetting("lead_email_subject");
  const bodyTemplate = await storage.getAdminSetting("lead_email_body");
  const subject = template || "軽貨物の案件獲得・空き車両活用でお困りではありませんか？｜ケイマッチ";
  const body = bodyTemplate || "";

  const failedLeads = await storage.getFailedEmailLeadsForRetry(50);
  if (failedLeads.length === 0) return { sent: 0, failed: 0 };

  console.log(`[Lead Retry] Retrying ${failedLeads.length} failed leads...`);
  let sent = 0;
  let failed = 0;

  for (const lead of failedLeads) {
    if (!lead.email) continue;
    try {
      const personalizedBody = (body || subject).replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, subject, personalizedBody);
      if (result.success) {
        await storage.updateEmailLead(lead.id, { status: "sent", sentAt: new Date(), sentSubject: subject });
        sent++;
      } else {
        await storage.updateEmailLead(lead.id, { status: "permanently_failed" });
        failed++;
      }
    } catch {
      await storage.updateEmailLead(lead.id, { status: "permanently_failed" });
      failed++;
    }
    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead Retry] Complete: sent=${sent}, failed=${failed}`);
  return { sent, failed };
}

export async function sendFollowUpEmails(): Promise<{ sent: number }> {
  const followUpSubject = "【再送】軽貨物の案件・空き車両活用をお手伝いします｜ケイマッチ";
  const followUpBody = await storage.getAdminSetting("lead_followup_body");
  const defaultFollowUp = `{company}
ご担当者様

先日は突然のご連絡、失礼いたしました。
軽貨物案件マッチングサービス「ケイマッチ」の運営事務局でございます。

その後、軽貨物の案件獲得や空き車両の活用について、
お困りごとはございませんでしょうか？

ケイマッチでは現在、全機能を無料でご利用いただけます。

▼ 30秒で無料登録
https://keimatch-sinjapan.com/register

ご不明な点がございましたら、
本メールへのご返信にてお気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ケイマッチ運営事務局
合同会社SIN JAPAN
〒243-0303 神奈川県愛甲郡愛川町中津7287
TEL: 046-212-2325
URL: https://keimatch-sinjapan.com
━━━━━━━━━━━━━━━━━━━━

※配信停止をご希望の場合は本メールへご返信ください。`;

  const body = followUpBody || defaultFollowUp;

  const sentLeads = await storage.getSentLeadsForFollowUp(100, 3);
  if (sentLeads.length === 0) {
    console.log("[Lead FollowUp] No leads ready for follow-up");
    return { sent: 0 };
  }

  let sent = 0;
  for (const lead of sentLeads) {
    if (!lead.email) continue;
    try {
      const personalizedBody = body.replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, followUpSubject, personalizedBody);
      if (result.success) {
        await storage.updateEmailLead(lead.id, { status: "followed_up", sentAt: new Date() });
        sent++;
      }
    } catch {
    }
    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead FollowUp] Complete: sent=${sent}`);
  return { sent };
}

export function scheduleLeadCrawler() {
  const CRAWL_HOURS = [5, 8, 12, 16, 21];
  const SEND_HOURS = [9, 11, 14, 17];
  const RETRY_HOURS = [10];
  const FOLLOWUP_HOURS = [13];

  setInterval(async () => {
    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24;
    const minute = now.getMinutes();

    if (CRAWL_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Crawler] Starting crawl (${jstHour}:00 JST)...`);
      try {
        await crawlLeadsWithAI();
      } catch (err) {
        console.error("[Lead Crawler] Crawl failed:", err);
      }
    }

    if (SEND_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Email] Starting send (${jstHour}:00 JST)...`);
      try {
        await sendDailyLeadEmails();
      } catch (err) {
        console.error("[Lead Email] Send failed:", err);
      }
    }

    if (RETRY_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Retry] Starting retry (${jstHour}:00 JST)...`);
      try {
        await retryFailedLeads();
      } catch (err) {
        console.error("[Lead Retry] Retry failed:", err);
      }
    }

    if (FOLLOWUP_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead FollowUp] Starting follow-up (${jstHour}:00 JST)...`);
      try {
        await sendFollowUpEmails();
      } catch (err) {
        console.error("[Lead FollowUp] Follow-up failed:", err);
      }
    }
  }, 60000);

  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  console.log(`[Lead Crawler] Scheduled: crawl=${CRAWL_HOURS.join(",")}時, send=${SEND_HOURS.join(",")}時, retry=${RETRY_HOURS.join(",")}時, followup=${FOLLOWUP_HOURS.join(",")}時 JST (now: ${jstHour}時)`);
}

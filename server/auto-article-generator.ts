import OpenAI from "openai";
import { storage } from "./storage";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({
    apiKey,
    ...(process.env.OPENAI_API_KEY ? {} : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ? { baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL } : {}),
  });
}

const SEO_TOPICS = [
  { topic: "軽貨物案件マッチングサービスの活用方法", keywords: "軽貨物, マッチング, 案件, 配送", category: "kyukakyusha" },
  { topic: "空き車両を活用して売上を伸ばす方法", keywords: "空き車両, 軽貨物, 配車, ドライバー", category: "carrier-sales" },
  { topic: "荷主が軽貨物ドライバーを選ぶときのポイント", keywords: "荷主, 軽貨物ドライバー, 選び方, 配送", category: "truck-order" },
  { topic: "軽貨物マッチングで配送コストを削減する方法", keywords: "軽貨物, コスト削減, 配送効率化", category: "kyukakyusha" },
  { topic: "軽貨物業界のDX化とマッチングプラットフォーム", keywords: "軽貨物DX, デジタル化, マッチング, テクノロジー", category: "kyukakyusha" },
  { topic: "2024年問題と軽貨物配送業界の対策", keywords: "2024年問題, ドライバー不足, 働き方改革, 軽貨物", category: "carrier-sales" },
  { topic: "ラストマイル配送の効率化テクニック", keywords: "ラストマイル, 配送効率, 軽貨物, EC物流", category: "truck-order" },
  { topic: "スポット便と定期便の使い分け", keywords: "スポット便, 定期便, 軽貨物, 配送", category: "truck-order" },
  { topic: "配車計画を効率化するAI技術の活用", keywords: "配車, AI, 効率化, 軽貨物", category: "kyukakyusha" },
  { topic: "軽貨物運送業の開業に必要な届出と手続き", keywords: "軽貨物, 開業, 届出, 貨物軽自動車運送事業", category: "carrier-sales" },
  { topic: "軽貨物配送業界の最新トレンドと今後の展望", keywords: "軽貨物, トレンド, EC配送, ギグワーク", category: "kyukakyusha" },
  { topic: "燃料費高騰時代の軽貨物ドライバーのコスト管理術", keywords: "燃料費, コスト管理, 運賃, 軽貨物", category: "carrier-sales" },
  { topic: "軽貨物配送の安全管理と事故防止対策", keywords: "安全管理, 事故防止, 軽貨物, 運行管理", category: "carrier-sales" },
  { topic: "個人事業主として軽貨物で稼ぐためのコツ", keywords: "個人事業主, 軽貨物, 収入, フリーランス", category: "kyukakyusha" },
  { topic: "軽貨物ドライバーが案件を安定的に獲得する方法", keywords: "軽貨物, 案件獲得, 営業, ドライバー", category: "carrier-sales" },
  { topic: "EC物流における軽貨物配送の役割", keywords: "EC, 軽貨物, ラストマイル, 宅配", category: "truck-order" },
  { topic: "軽貨物マッチングサイトの選び方と比較ポイント", keywords: "軽貨物, サイト比較, マッチング, 選び方", category: "kyukakyusha" },
  { topic: "軽貨物の業務委託契約の基礎知識と注意点", keywords: "業務委託, 契約書, 運賃, 軽貨物", category: "truck-order" },
  { topic: "軽貨物配送における環境配慮とEV化の動向", keywords: "EV, 環境, CO2削減, 軽貨物", category: "carrier-sales" },
  { topic: "食品配送における温度管理のポイント", keywords: "食品配送, 温度管理, 冷蔵, 軽貨物", category: "truck-order" },
  { topic: "宅配便と軽貨物チャーター便の違い", keywords: "宅配便, チャーター便, 軽貨物, 比較", category: "carrier-sales" },
  { topic: "軽貨物ドライバーの1日のスケジュールと収入例", keywords: "軽貨物, 収入, スケジュール, 働き方", category: "kyukakyusha" },
  { topic: "軽貨物配送の貨物保険と車両保険の選び方", keywords: "貨物保険, 車両保険, 軽貨物, 補償", category: "truck-order" },
  { topic: "軽貨物業界での人材確保と定着率向上策", keywords: "人材確保, ドライバー, 採用, 軽貨物", category: "carrier-sales" },
  { topic: "AIを活用した軽貨物配送の最適ルート検索", keywords: "AI, ルート検索, 最適化, 軽貨物", category: "kyukakyusha" },
  { topic: "軽貨物で独立開業するステップガイド", keywords: "軽貨物, 独立, 開業, フリーランス", category: "carrier-sales" },
  { topic: "フードデリバリーと軽貨物配送の違いと選び方", keywords: "フードデリバリー, 軽貨物, ギグワーク, 配送", category: "truck-order" },
  { topic: "軽貨物配送のコンプライアンスと法令遵守", keywords: "コンプライアンス, 法令遵守, 貨物軽自動車運送事業, 届出", category: "carrier-sales" },
  { topic: "ECサイト運営者のための軽貨物配送パートナー選び", keywords: "EC, 軽貨物, フルフィルメント, 配送パートナー", category: "truck-order" },
  { topic: "軽貨物ドライバーのための確定申告と節税対策", keywords: "確定申告, 節税, 個人事業主, 軽貨物", category: "carrier-sales" },
  { topic: "軽貨物配送と青色申告の活用術", keywords: "青色申告, 軽貨物, 経費, 節税", category: "carrier-sales" },
  { topic: "軽バンと軽トラックの違いと用途別選び方", keywords: "軽バン, 軽トラック, 車種選び, 軽貨物", category: "truck-order" },
  { topic: "軽貨物配送で使える経費と節税ポイント一覧", keywords: "経費, 節税, 軽貨物, 個人事業主", category: "carrier-sales" },
  { topic: "軽貨物ドライバーの月収・年収はいくら？", keywords: "軽貨物, 年収, 月収, 収入", category: "kyukakyusha" },
  { topic: "軽貨物配送における損害賠償リスクと対策", keywords: "損害賠償, 保険, リスク, 軽貨物", category: "truck-order" },
  { topic: "Amazon配送委託と軽貨物フリーランスの比較", keywords: "Amazon, デリバリープロバイダ, 軽貨物, フリーランス", category: "carrier-sales" },
  { topic: "軽貨物配送の繁忙期と閑散期を乗り越えるコツ", keywords: "繁忙期, 閑散期, 軽貨物, 売上管理", category: "carrier-sales" },
  { topic: "軽貨物ドライバーが知っておくべき道路交通法の基礎", keywords: "道路交通法, 軽貨物, 交通違反, ドライバー", category: "carrier-sales" },
  { topic: "荷主企業が抱える配送コスト削減の課題と解決策", keywords: "荷主, 配送コスト, 物流改善, 軽貨物", category: "truck-order" },
  { topic: "軽貨物配送でのクレーム対応と品質管理", keywords: "クレーム, 品質管理, 軽貨物, 顧客対応", category: "truck-order" },
  { topic: "軽貨物ドライバーのためのスマートフォン活用術", keywords: "スマートフォン, アプリ, ナビ, 軽貨物", category: "kyukakyusha" },
  { topic: "軽貨物配送業界の将来性と成長市場", keywords: "将来性, 市場規模, EC物流, 軽貨物", category: "kyukakyusha" },
  { topic: "冷凍・冷蔵軽貨物配送の特徴と需要", keywords: "冷凍, 冷蔵, 温度管理, 軽貨物配送", category: "truck-order" },
  { topic: "医療・医薬品の軽貨物配送における注意点", keywords: "医療, 医薬品, 軽貨物, 特殊配送", category: "truck-order" },
  { topic: "軽貨物事業者の社会保険と保障制度", keywords: "社会保険, 国民健康保険, 軽貨物, 個人事業主", category: "carrier-sales" },
  { topic: "求貨求車プラットフォームで荷物を増やす方法", keywords: "求貨求車, プラットフォーム, 案件, 軽貨物", category: "kyukakyusha" },
  { topic: "軽貨物配送のルート最適化で収益を上げる方法", keywords: "ルート最適化, 効率化, 燃費, 軽貨物", category: "carrier-sales" },
  { topic: "2025年最新・軽貨物配送の単価相場", keywords: "単価, 運賃相場, 軽貨物, 料金", category: "kyukakyusha" },
  { topic: "軽貨物配送の受発注デジタル化と業務効率化", keywords: "デジタル化, 受発注, 業務効率, 軽貨物", category: "kyukakyusha" },
  { topic: "夜間・早朝配送の需要と軽貨物ドライバーへの影響", keywords: "夜間配送, 早朝, 時間外, 軽貨物", category: "carrier-sales" },
  { topic: "建設現場への小口配送と軽貨物の活用", keywords: "建設, 小口配送, 資材, 軽貨物", category: "truck-order" },
  { topic: "軽貨物事業者のための請求書・領収書の作り方", keywords: "請求書, 領収書, 軽貨物, 個人事業主", category: "carrier-sales" },
  { topic: "引越し繁忙期の軽貨物スポット案件活用法", keywords: "引越し, スポット, 軽貨物, 繁忙期", category: "kyukakyusha" },
  { topic: "軽貨物ドライバーに必要な資格と免許まとめ", keywords: "資格, 免許, 軽貨物, ドライバー", category: "carrier-sales" },
  { topic: "軽貨物配送における積載効率の上げ方", keywords: "積載効率, 積み方, 軽貨物, 配送最適化", category: "truck-order" },
];

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60);
  const dateStr = new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${dateStr}-${rand}-${base || "article"}`;
}

const DAILY_ARTICLE_COUNT = 5;

async function generateSingleArticle(selectedTopic: { topic: string; keywords: string; category: string }, articleIndex: number) {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはSEOに強い軽貨物配送業界専門のコラムライターです。「KEI MATCH」という軽貨物案件マッチングプラットフォームのコラム記事を作成してください。

記事の要件：
1. SEOに最適化されたタイトル（# 見出し）- 検索されやすいキーワードを自然に含める
2. 読者を引き込む導入文（200〜300文字）
3. 本文（## と ### の見出しで構造化、合計3000〜4000文字）
   - 具体的なデータや数字を含める（例：「月収30〜50万円」「配送単価800〜1,200円」など）
   - 実践的なノウハウや手順を含める
   - 読者の悩みに答える内容にする
   - 自然にキーワードを含める（キーワード密度2〜3%）
   - KEI MATCHのサービスを自然に1〜2箇所で紹介
   - 見出しは5〜7個程度
4. まとめ・結論（200文字程度）

重要な出力ルール：
- マークダウン形式で出力してください
- 見出しは ## や ### のマークダウン記法のみを使い、「H2:」「H3:」のようなプレフィックスは絶対に付けないでください
- HTMLタグは使わないでください（<h2>、<h3>、<p>などは不可）
- 正しい例: ## 軽貨物配送とは
- 間違った例: ## H2: 軽貨物配送とは

本文の最後に必ず以下の形式でメタ情報を出力してください：
---META---
{"metaDescription": "120〜160文字のSEO用ディスクリプション（検索ユーザーがクリックしたくなる説明文）", "faq": [{"question": "よくある質問1", "answer": "詳細な回答1（100文字以上）"}, {"question": "よくある質問2", "answer": "詳細な回答2（100文字以上）"}, {"question": "よくある質問3", "answer": "詳細な回答3（100文字以上）"}]}`
        },
        {
          role: "user",
          content: `テーマ: ${selectedTopic.topic}\nキーワード: ${selectedTopic.keywords}\n備考: 実践的で読者の役に立つ情報を充実させてください。KEI MATCHのサービスも自然に紹介してください。`
        }
      ],
      max_tokens: 5000,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    let content = rawContent;
    let metaDescription = "";
    let faq: string | null = null;

    const metaIndex = rawContent.lastIndexOf("---META---");
    if (metaIndex !== -1) {
      content = rawContent.substring(0, metaIndex).trim();
      const metaStr = rawContent.substring(metaIndex + "---META---".length).trim();
      try {
        const jsonStart = metaStr.indexOf("{");
        const jsonEnd = metaStr.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const meta = JSON.parse(metaStr.substring(jsonStart, jsonEnd + 1));
          metaDescription = meta.metaDescription || "";
          if (meta.faq && Array.isArray(meta.faq) && meta.faq.length > 0) {
            faq = JSON.stringify(meta.faq);
          }
        }
      } catch (parseErr) {
        console.error(`[Auto Article] Meta parse error:`, parseErr);
      }
    }

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : selectedTopic.topic;
    const slug = generateSlug(title);
    const wordCount = content.replace(/[#*\-\n\s]/g, "").length;

    if (!metaDescription) {
      metaDescription = `${selectedTopic.topic}について詳しく解説。${selectedTopic.keywords.split(",")[0].trim()}の基礎知識から実践的なノウハウまで、軽貨物事業者に役立つ情報をまとめました。`;
    }

    await storage.createSeoArticle({
      topic: selectedTopic.topic,
      keywords: selectedTopic.keywords,
      title,
      slug,
      metaDescription: metaDescription.substring(0, 160),
      content,
      status: "published",
      autoGenerated: true,
      category: selectedTopic.category,
      wordCount,
      faq,
    });

    console.log(`[Auto Article] [${articleIndex + 1}] Generated: "${title}" (${wordCount}字, meta:${metaDescription.length}字, faq:${faq ? "あり" : "なし"})`);
  } catch (error) {
    console.error(`[Auto Article] [${articleIndex + 1}] Failed to generate article:`, error);
  }
}

export async function runDailyArticleGeneration() {
  try {
    const todayCount = await storage.getTodayAutoArticleCount();
    if (todayCount >= DAILY_ARTICLE_COUNT) {
      console.log(`[Auto Article] Today's ${DAILY_ARTICLE_COUNT} articles already generated, skipping.`);
      return;
    }

    const remaining = DAILY_ARTICLE_COUNT - todayCount;
    console.log(`[Auto Article] Generating ${remaining} articles today (${todayCount} already done)...`);

    const existingArticles = await storage.getSeoArticles();
    const usedTopics = new Set(existingArticles.map(a => a.topic));

    const availableTopics = SEO_TOPICS.filter(t => !usedTopics.has(t.topic));

    for (let i = 0; i < remaining; i++) {
      let selectedTopic: { topic: string; keywords: string; category: string };
      if (availableTopics.length > 0) {
        const idx = Math.floor(Math.random() * availableTopics.length);
        selectedTopic = availableTopics.splice(idx, 1)[0];
      } else {
        const idx = Math.floor(Math.random() * SEO_TOPICS.length);
        selectedTopic = SEO_TOPICS[idx];
      }

      console.log(`[Auto Article] [${todayCount + i + 1}/${DAILY_ARTICLE_COUNT}] Generating: ${selectedTopic.topic}`);
      await generateSingleArticle(selectedTopic, todayCount + i);

      if (i < remaining - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    pingGoogleSitemap();
    console.log(`[Auto Article] Daily generation complete. Total today: ${DAILY_ARTICLE_COUNT}`);
  } catch (error) {
    console.error("[Auto Article] Failed during daily generation:", error);
  }
}

export async function pingGoogleSitemap() {
  try {
    const baseUrl = process.env.SITE_URL || "https://keimatch-sinjapan.com";
    const sitemapUrl = encodeURIComponent(`${baseUrl}/sitemap.xml`);
    const pingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;
    const response = await fetch(pingUrl);
    if (response.ok) {
      console.log("[Sitemap Ping] Successfully pinged Google with sitemap update");
    } else {
      console.log(`[Sitemap Ping] Google responded with status ${response.status}`);
    }
  } catch (error) {
    console.log("[Sitemap Ping] Failed to ping Google (non-critical):", error);
  }
}

export function scheduleAutoArticleGeneration() {
  runDailyArticleGeneration();

  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 6 && now.getMinutes() === 0) {
      runDailyArticleGeneration();
    }
  }, 60 * 1000);
}

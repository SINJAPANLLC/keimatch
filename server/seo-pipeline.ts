import OpenAI from "openai";
import { storage } from "./storage";
import { getOpportunityKeywords, getPagePerformance, isGscConnected } from "./gsc-client";
import { pingGoogleSitemap } from "./auto-article-generator";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");
  return new OpenAI({ apiKey });
}

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

interface ArticleIntent {
  intent: "informational" | "transactional" | "navigational" | "commercial";
  targetAudience: string;
  contentType: string;
  keyPoints: string[];
}

interface ArticleStructure {
  h2s: string[];
  introduction: string;
  conclusion: string;
}

async function analyzeSearchIntent(keyword: string): Promise<ArticleIntent> {
  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `あなたはSEO専門家です。軽貨物配送業界のキーワードの検索意図を分析してください。
JSON形式で出力してください：
{"intent": "informational|transactional|navigational|commercial", "targetAudience": "対象読者（例：軽貨物ドライバー、荷主企業）", "contentType": "コンテンツ種類（例：ハウツー記事、比較記事、体験談）", "keyPoints": ["盛り込むべきポイント1", "ポイント2", "ポイント3", "ポイント4", "ポイント5"]}`,
      },
      { role: "user", content: `キーワード: ${keyword}` },
    ],
    max_tokens: 500,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(res.choices[0]?.message?.content || "{}") as ArticleIntent;
  } catch {
    return {
      intent: "informational",
      targetAudience: "軽貨物ドライバー・荷主",
      contentType: "ハウツー記事",
      keyPoints: ["基礎知識", "メリット・デメリット", "具体的な方法", "注意点", "まとめ"],
    };
  }
}

async function designArticleStructure(keyword: string, intent: ArticleIntent): Promise<ArticleStructure> {
  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `あなたはSEOライティング専門家です。軽貨物配送業界の記事構成を設計してください。
JSON形式で出力：
{"h2s": ["H2見出し1", "H2見出し2", "H2見出し3", "H2見出し4", "H2見出し5", "H2見出し6"], "introduction": "導入文の方向性（100字程度）", "conclusion": "まとめの方向性（100字程度）"}
※ H2は5〜7個、各H2の下に2〜3個のH3を想定してください`,
      },
      {
        role: "user",
        content: `キーワード: ${keyword}
検索意図: ${intent.intent}（${intent.contentType}）
対象読者: ${intent.targetAudience}
盛り込むポイント: ${intent.keyPoints.join("、")}`,
      },
    ],
    max_tokens: 800,
    response_format: { type: "json_object" },
  });
  try {
    return JSON.parse(res.choices[0]?.message?.content || "{}") as ArticleStructure;
  } catch {
    return {
      h2s: ["概要", "メリット", "具体的な方法", "注意点", "活用事例", "まとめ"],
      introduction: "読者の悩みに共感し、記事で解決できることを伝える",
      conclusion: "記事の要点を整理し、KEI MATCHを紹介する",
    };
  }
}

async function generateArticleFromPipeline(
  keyword: string,
  intent: ArticleIntent,
  structure: ArticleStructure,
  gscKeyword?: string
): Promise<{ title: string; content: string; metaDescription: string; faq: string | null; wordCount: number }> {
  const h2List = structure.h2s.map((h, i) => `${i + 1}. ${h}`).join("\n");

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `あなたはSEOに強い軽貨物配送業界専門のコラムライターです。「KEI MATCH」という軽貨物案件マッチングプラットフォームのコラム記事を作成してください。

記事の要件：
1. SEOに最適化されたタイトル（# 見出し）- 検索キーワード「${keyword}」を自然に含める
2. 読者を引き込む導入文（200〜300文字）- "${structure.introduction}"の方向性で
3. 本文（## と ### の見出しで構造化、合計4000〜5000文字）
   - 以下のH2構成に従う：\n${h2List}
   - 対象読者「${intent.targetAudience}」に合わせた内容
   - 具体的なデータや数字（月収30〜50万円、配送単価800〜1200円等）
   - 実践的なノウハウや手順
   - 自然にキーワードを含める（密度2〜3%）
   - KEI MATCHのサービスを自然に1〜2箇所で紹介
4. まとめ（200文字）- "${structure.conclusion}"の方向性で

重要な出力ルール：
- マークダウン形式のみ（HTMLタグ不可）
- 見出しは ## や ### のみ（「H2:」等のプレフィックス不可）

本文の最後に必ず以下を出力：
---META---
{"metaDescription": "120〜160文字のSEO用ディスクリプション", "faq": [{"question": "Q1", "answer": "A1（100文字以上）"}, {"question": "Q2", "answer": "A2"}, {"question": "Q3", "answer": "A3"}]}`,
      },
      {
        role: "user",
        content: `メインキーワード: ${keyword}
コンテンツタイプ: ${intent.contentType}
含めるポイント: ${intent.keyPoints.join("、")}`,
      },
    ],
    max_tokens: 6000,
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
        if (meta.faq && Array.isArray(meta.faq)) {
          faq = JSON.stringify(meta.faq);
        }
      }
    } catch {}
  }

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : keyword;
  const wordCount = content.replace(/[#*\-\n\s]/g, "").length;

  if (!metaDescription) {
    metaDescription = `${keyword}について詳しく解説。${intent.targetAudience}向けに実践的なノウハウをまとめました。`;
  }

  return { title, content, metaDescription: metaDescription.substring(0, 160), faq, wordCount };
}

function inferCategory(keyword: string): string {
  if (/ドライバー|収入|開業|独立|節税|確定申告|資格|免許|案件|副業/.test(keyword)) return "carrier-sales";
  if (/荷主|依頼|発注|コスト削減|物流|配送委託/.test(keyword)) return "truck-order";
  return "kyukakyusha";
}

export async function runGscPoweredGeneration(dailyLimit = 5): Promise<void> {
  const connected = await isGscConnected();
  if (!connected) {
    console.log("[SEO Pipeline] GSC未接続のため固定トピックで生成します");
    const { runDailyArticleGeneration } = await import("./auto-article-generator");
    await runDailyArticleGeneration();
    return;
  }

  console.log("[SEO Pipeline] GSCキーワードで記事生成開始...");

  const todayCount = await storage.getTodayAutoArticleCount();
  if (todayCount >= dailyLimit) {
    console.log(`[SEO Pipeline] 本日の生成済み記事数 ${dailyLimit} に達しています`);
    return;
  }

  const remaining = dailyLimit - todayCount;

  let keywords = await getOpportunityKeywords(remaining * 3);

  // 既存記事のキーワードを除外
  const existingArticles = await storage.getSeoArticles();
  const usedKeywords = new Set(existingArticles.map((a) => a.keywords?.split(",")[0]?.trim().toLowerCase()));
  keywords = keywords.filter((k) => !usedKeywords.has(k.keyword.toLowerCase()));

  if (keywords.length === 0) {
    console.log("[SEO Pipeline] GSCで新規キーワードなし → 固定トピックで生成");
    const { runDailyArticleGeneration } = await import("./auto-article-generator");
    await runDailyArticleGeneration();
    return;
  }

  const selected = keywords.slice(0, remaining);

  for (let i = 0; i < selected.length; i++) {
    const kw = selected[i];
    console.log(`[SEO Pipeline] [${i + 1}/${selected.length}] キーワード分析中: "${kw.keyword}" (表示${kw.impressions}回, ${kw.position}位)`);

    try {
      console.log(`[SEO Pipeline] ② 検索意図分析中...`);
      const intent = await analyzeSearchIntent(kw.keyword);

      console.log(`[SEO Pipeline] ③ 記事構成設計中...`);
      const structure = await designArticleStructure(kw.keyword, intent);

      console.log(`[SEO Pipeline] ④ 本文生成中...`);
      const article = await generateArticleFromPipeline(kw.keyword, intent, structure, kw.keyword);

      await storage.createSeoArticle({
        topic: kw.keyword,
        keywords: kw.keyword,
        title: article.title,
        slug: generateSlug(article.title),
        metaDescription: article.metaDescription,
        content: article.content,
        status: "published",
        autoGenerated: true,
        category: inferCategory(kw.keyword),
        wordCount: article.wordCount,
        faq: article.faq,
      });

      console.log(`[SEO Pipeline] ✓ 記事公開: "${article.title}" (${article.wordCount}字)`);

      if (i < selected.length - 1) await new Promise((r) => setTimeout(r, 5000));
    } catch (err) {
      console.error(`[SEO Pipeline] キーワード "${kw.keyword}" の記事生成失敗:`, err);
    }
  }

  pingGoogleSitemap();
  console.log("[SEO Pipeline] 本日の生成完了");
}

export async function runWeeklyRewrite(): Promise<void> {
  const connected = await isGscConnected();
  if (!connected) {
    console.log("[SEO Rewrite] GSC未接続のためリライトをスキップします");
    return;
  }

  console.log("[SEO Rewrite] 週次リライト開始...");

  const pagePerformance = await getPagePerformance();
  const articles = await storage.getSeoArticles();
  const publishedArticles = articles.filter((a) => a.status === "published");

  // GSCデータをslugでマップ
  const perfMap = new Map(pagePerformance.map((p) => [p.slug, p]));

  // パフォーマンス更新
  for (const article of publishedArticles) {
    const perf = perfMap.get(article.slug);
    if (perf) {
      await storage.updateSeoArticle(article.id, {
        gscPosition: perf.position,
        gscCtr: perf.ctr,
        gscImpressions: perf.impressions,
        gscClicks: perf.clicks,
        gscLastUpdated: new Date(),
      } as any);
    }
  }

  // リライト候補: 表示回数50以上 かつ (15位以下 または CTR2%未満)
  const rewriteCandidates = publishedArticles.filter((a) => {
    const perf = perfMap.get(a.slug);
    if (!perf) return false;
    if (perf.impressions < 50) return false;
    return perf.position > 15 || perf.ctr < 2.0;
  });

  console.log(`[SEO Rewrite] リライト候補: ${rewriteCandidates.length}記事`);

  const rewriteLimit = 3;
  const targets = rewriteCandidates.slice(0, rewriteLimit);

  for (let i = 0; i < targets.length; i++) {
    const article = targets[i];
    const perf = perfMap.get(article.slug)!;

    console.log(`[SEO Rewrite] [${i + 1}/${targets.length}] リライト中: "${article.title}" (${perf.position}位, CTR${perf.ctr}%)`);

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `あなたはSEOリライトの専門家です。以下の軽貨物配送業界の記事をSEO改善のためにリライトしてください。

改善指示：
- 現在の検索順位: ${perf.position}位（目標: 10位以内）
- 現在のCTR: ${perf.ctr}%（目標: 5%以上）
- 表示回数: ${perf.impressions}回

リライト要件：
1. タイトルをより魅力的・クリックされやすいものに変更
2. 導入文を読者の悩みに直接答える形に改善
3. 各H2セクションを具体的なデータ・事例で充実させる
4. メタディスクリプションをCTR向上に最適化
5. 文字数を現在の${article.wordCount || 0}字から増加（目標4000〜5000字）
6. FAQ を検索意図に合わせて更新

マークダウン形式で出力し、最後に以下を追加：
---META---
{"metaDescription": "120〜160文字の改善されたディスクリプション", "faq": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}, {"question": "Q3", "answer": "A3"}]}`,
          },
          {
            role: "user",
            content: `元の記事:\n\n${article.content.substring(0, 3000)}...（以下省略）\n\nキーワード: ${article.keywords || article.topic}`,
          },
        ],
        max_tokens: 6000,
      });

      const rawContent = completion.choices[0]?.message?.content || "";
      let newContent = rawContent;
      let newMeta = article.metaDescription || "";
      let newFaq = article.faq;

      const metaIndex = rawContent.lastIndexOf("---META---");
      if (metaIndex !== -1) {
        newContent = rawContent.substring(0, metaIndex).trim();
        const metaStr = rawContent.substring(metaIndex + "---META---".length).trim();
        try {
          const jsonStart = metaStr.indexOf("{");
          const jsonEnd = metaStr.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const meta = JSON.parse(metaStr.substring(jsonStart, jsonEnd + 1));
            newMeta = meta.metaDescription || newMeta;
            if (meta.faq) newFaq = JSON.stringify(meta.faq);
          }
        } catch {}
      }

      const titleMatch = newContent.match(/^#\s+(.+)$/m);
      const newTitle = titleMatch ? titleMatch[1].trim() : article.title;
      const newWordCount = newContent.replace(/[#*\-\n\s]/g, "").length;

      await storage.updateSeoArticle(article.id, {
        title: newTitle,
        content: newContent,
        metaDescription: newMeta.substring(0, 160),
        faq: newFaq,
        wordCount: newWordCount,
        rewriteCount: ((article as any).rewriteCount || 0) + 1,
        lastRewrittenAt: new Date(),
      } as any);

      console.log(`[SEO Rewrite] ✓ リライト完了: "${newTitle}" (${newWordCount}字)`);

      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 5000));
    } catch (err) {
      console.error(`[SEO Rewrite] "${article.title}" のリライト失敗:`, err);
    }
  }

  console.log("[SEO Rewrite] 週次リライト完了");
}

export function scheduleWeeklyRewrite(): void {
  setInterval(() => {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 7 && now.getMinutes() === 0) {
      runWeeklyRewrite().catch((e) => console.error("[SEO Rewrite] 週次リライトエラー:", e));
    }
  }, 60 * 1000);
}

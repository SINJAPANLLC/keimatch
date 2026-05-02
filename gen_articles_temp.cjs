const OpenAI = require("/home/runner/workspace/node_modules/openai");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });
const openai = new (OpenAI.default || OpenAI)({ apiKey: process.env.OPENAI_API_KEY });

const TARGETS = [
  {
    topic: "軽貨物マッチングサービスおすすめ比較ランキング【2025年最新】",
    keywords: "軽貨物 マッチング, 軽貨物マッチングサービス, 軽貨物 案件マッチング, 軽貨物 プラットフォーム",
    category: "kyukakyusha",
    instruction: "「軽貨物 マッチング」「軽貨物マッチングサービス」で上位表示を狙う記事。KEI MATCHを含む業界の主要マッチングサービスを比較し、ドライバー目線・荷主目線でそれぞれのメリットを解説。具体的な特徴・料金・使いやすさを比較表形式で。4000字以上。"
  },
  {
    topic: "軽貨物マッチングの口コミ・評判まとめ【ドライバー・荷主のリアルな声2025】",
    keywords: "軽貨物 口コミ, 軽貨物 マッチング 口コミ, 軽貨物 評判, 軽貨物マッチング 評判",
    category: "kyukakyusha",
    instruction: "「軽貨物 口コミ」「軽貨物 マッチング 口コミ」で上位表示を狙う記事。軽貨物マッチングサービス全般の口コミ・評判をドライバー・荷主それぞれの立場から紹介。良い口コミ・悪い口コミ両方を掲載してリアルに。KEI MATCHの口コミも自然に含める。4000字以上。"
  },
  {
    topic: "KEI MATCHの口コミ・評判【2025年最新レビュー】実際に使ってみた感想",
    keywords: "ケイマッチ 口コミ, KEI MATCH 口コミ, ケイマッチ 評判, KEI MATCH 評判",
    category: "kyukakyusha",
    instruction: "「ケイマッチ 口コミ」「ケイマッチ 評判」で上位表示を狙う記事。KEI MATCH（ケイマッチ）のサービス内容を詳しく紹介し、ドライバー・荷主それぞれのリアルな口コミ・評判を掲載。メリット・デメリットも正直に。登録方法や使い方も解説。4000字以上。"
  },
  {
    topic: "軽貨物マッチングサービスの選び方【初心者向け完全ガイド2025】",
    keywords: "軽貨物 マッチングサイト, 軽貨物マッチング 比較, 軽貨物 案件 探し方, 軽貨物 サービス 選び方",
    category: "kyukakyusha",
    instruction: "「軽貨物 マッチングサイト」「軽貨物マッチング 比較」で上位表示を狙う記事。軽貨物マッチングサービスを初めて使う人向けに、選ぶべきポイントを徹底解説。手数料・案件数・使いやすさ・対応エリアなど比較すべき項目を具体的に。KEI MATCHも選択肢として自然に紹介。4000字以上。"
  },
  {
    topic: "軽貨物ドライバーの口コミ・体験談まとめ【稼げる？きつい？リアルな声2025】",
    keywords: "軽貨物 ドライバー 口コミ, 軽貨物 体験談, 軽貨物 きつい, 軽貨物 稼げる 口コミ",
    category: "carrier-sales",
    instruction: "「軽貨物 ドライバー 口コミ」「軽貨物 体験談」で上位表示を狙う記事。軽貨物ドライバーのリアルな口コミ・体験談を年収・勤務時間・きつさ・やりがい別に紹介。ポジティブな意見もネガティブな意見も両方掲載してリアル感を出す。KEI MATCHで案件を見つけたドライバーの声も含める。4000字以上。"
  }
];

function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, "").replace(/\s+/g, "-").substring(0, 60);
  const dateStr = new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${dateStr}-${rand}-${base || "article"}`;
}

async function generateArticle(target, index) {
  console.log(`\n[${index+1}/${TARGETS.length}] 生成中: ${target.topic}`);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `あなたはSEOに強い軽貨物配送業界専門のコラムライターです。「KEI MATCH（ケイマッチ）」という軽貨物案件マッチングプラットフォームのコラム記事を作成してください。

記事の要件：
1. SEOに最適化されたタイトル（# 見出し）- 検索されやすいキーワードを自然に含める
2. 読者を引き込む導入文（200〜300文字）
3. 本文（## と ### の見出しで構造化、合計4000文字以上）
   - 具体的なデータや数字を含める
   - 実践的なノウハウや手順を含める
   - 読者の悩みに答える内容にする
   - 自然にキーワードを含める
   - KEI MATCHのサービスを自然に1〜2箇所で紹介
   - 見出しは6〜8個程度
4. まとめ・結論（200文字程度）

重要な出力ルール：
- マークダウン形式で出力してください
- 見出しは ## や ### のマークダウン記法のみを使い、「H2:」「H3:」のようなプレフィックスは絶対に付けないでください
- HTMLタグは使わないでください

本文の最後に必ず以下の形式でメタ情報を出力してください：
---META---
{"metaDescription": "120〜160文字のSEO用ディスクリプション", "faq": [{"question": "よくある質問1", "answer": "詳細な回答1（100文字以上）"}, {"question": "よくある質問2", "answer": "詳細な回答2（100文字以上）"}, {"question": "よくある質問3", "answer": "詳細な回答3（100文字以上）"}]}`
      },
      {
        role: "user",
        content: `テーマ: ${target.topic}\nキーワード: ${target.keywords}\n特別指示: ${target.instruction}`
      }
    ],
    max_tokens: 6000,
  });

  const rawContent = completion.choices[0]?.message?.content || "";
  let content = rawContent;
  let metaDescription = "";
  let faq = null;

  const metaIndex = rawContent.lastIndexOf("---META---");
  if (metaIndex !== -1) {
    content = rawContent.substring(0, metaIndex).trim();
    const metaStr = rawContent.substring(metaIndex + 10).trim();
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
    } catch (e) { console.error("Meta parse error:", e.message); }
  }

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : target.topic;
  const slug = generateSlug(title);
  const wordCount = content.replace(/[#*\-\n\s]/g, "").length;

  if (!metaDescription) {
    metaDescription = `${target.keywords.split(",")[0].trim()}について詳しく解説。軽貨物マッチングサービスの最新情報と実践的なノウハウをまとめました。`;
  }

  await pool.query(
    `INSERT INTO seo_articles (id, topic, keywords, title, slug, meta_description, content, status, auto_generated, category, word_count, faq, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'published', true, $7, $8, $9, NOW())`,
    [target.topic, target.keywords, title, slug, metaDescription.substring(0, 160), content, target.category, wordCount, faq]
  );

  console.log(`✅ 完了: "${title}" (${wordCount}字, FAQ:${faq ? "あり" : "なし"})`);
}

async function main() {
  for (let i = 0; i < TARGETS.length; i++) {
    await generateArticle(TARGETS[i], i);
    if (i < TARGETS.length - 1) await new Promise(r => setTimeout(r, 3000));
  }
  const total = await pool.query("SELECT COUNT(*) FROM seo_articles");
  console.log(`\n🎉 全記事合計: ${total.rows[0].count}件`);
  pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });

import { db } from "./db";
import { users, notificationTemplates } from "@shared/schema";
import { sql, eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(existingUsers[0].count) === 0) {
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminPassword2 = await bcrypt.hash("Kazuya8008", 10);
    await db.insert(users).values([
      {
        username: "admin",
        password: adminPassword,
        companyName: "軽貨物マッチ運営",
        phone: "03-0000-0000",
        email: "admin@keikamotsu-match.com",
        userType: "admin",
        role: "admin",
        approved: true,
      },
      {
        username: "sinjapan",
        password: adminPassword2,
        companyName: "SIN JAPAN",
        phone: "03-0000-0001",
        email: "info@sinjapan.jp",
        userType: "admin",
        role: "admin",
        approved: true,
      },
    ]);
    console.log("Admin users created");
  } else {
    console.log("Database already has users, skipping seed.");
  }

  await seedEmailTemplates();
}

const defaultEmailTemplates = [
  {
    category: "auto_reply",
    channel: "email",
    name: "パスワードリセット",
    subject: "【軽貨物マッチ】パスワードリセットのご案内",
    body: `{{companyName}} 様

以下のリンクからパスワードをリセットしてください。
このリンクは1時間有効です。

{{resetUrl}}

※このメールに心当たりがない場合は無視してください。

軽貨物マッチ運営事務局`,
    triggerEvent: "password_reset",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "取引先招待",
    subject: "【軽貨物マッチ】取引先招待のご案内",
    body: `{{companyName}}様より軽貨物マッチへの招待が届いています。

{{companyName}}様があなたを取引先として招待しました。
以下のリンクから軽貨物マッチに登録して、取引を開始しましょう。

{{registerUrl}}

軽貨物マッチ - 軽貨物案件マッチングプラットフォーム
{{appBaseUrl}}`,
    triggerEvent: "partner_invite",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "配車依頼書（荷主向け）",
    subject: "【軽貨物マッチ】{{senderName}}より配車依頼書が届きました",
    body: `{{senderName}} 様より配車依頼書が届きました。

以下の内容をご確認ください。

※配車依頼書の詳細データはシステムより自動挿入されます。`,
    triggerEvent: "dispatch_request_shipper",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "配車依頼書（ドライバー向け）",
    subject: "【軽貨物マッチ】{{senderName}}より配車依頼書が届きました",
    body: `{{senderName}} 様より配車依頼書が届きました。

以下の内容をご確認ください。

※配車依頼書の詳細データはシステムより自動挿入されます。`,
    triggerEvent: "dispatch_request_transport",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "新着案件通知",
    subject: "【軽貨物マッチ】新しい案件が登録されました",
    body: `新しい案件が登録されました。

出発地: {{departureArea}}
到着地: {{arrivalArea}}
荷物種類: {{cargoType}}
重量: {{weight}}
登録会社: {{companyName}}

軽貨物マッチにログインして詳細をご確認ください。
{{appBaseUrl}}

軽貨物マッチ運営事務局`,
    triggerEvent: "cargo_new",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "新着空き車両通知",
    subject: "【軽貨物マッチ】新しい空き車両が登録されました",
    body: `新しい空き車両情報が登録されました。

現在地: {{currentArea}}
行先: {{destinationArea}}
車両タイプ: {{vehicleType}}
積載量: {{maxWeight}}
登録会社: {{companyName}}

軽貨物マッチにログインして詳細をご確認ください。
{{appBaseUrl}}

軽貨物マッチ運営事務局`,
    triggerEvent: "truck_new",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "アカウント承認通知",
    subject: "【軽貨物マッチ】アカウントが承認されました",
    body: `{{companyName}} 様

ご登録ありがとうございます。

アカウントが承認されましたので、以下のリンクからログインしてサービスをご利用いただけます。

{{appBaseUrl}}/login

軽貨物マッチでは、案件の登録・検索、空き車両情報の登録・検索など、軽貨物マッチングに必要な機能をすべてご利用いただけます。

ご不明な点がございましたら、お気軽にお問い合わせください。

軽貨物マッチ運営事務局
合同会社SIN JAPAN`,
    triggerEvent: "user_approved",
  },
  {
    category: "auto_notification",
    channel: "email",
    name: "請求書送信",
    subject: "【軽貨物マッチ】請求書 {{invoiceNumber}}（{{billingMonth}}）",
    body: `{{companyName}} 御中

いつも軽貨物マッチをご利用いただきありがとうございます。
請求書をお送りいたします。

請求書番号: {{invoiceNumber}}
請求月: {{billingMonth}}
合計金額（税込）: ¥{{totalAmount}}
お支払い期限: {{dueDate}}

※請求書の詳細データはシステムより自動挿入されます。

合同会社SIN JAPAN
軽貨物マッチ運営事務局`,
    triggerEvent: "invoice_send",
  },
];

async function seedEmailTemplates() {
  for (const tmpl of defaultEmailTemplates) {
    const existing = await db.select().from(notificationTemplates)
      .where(and(
        eq(notificationTemplates.channel, tmpl.channel),
        eq(notificationTemplates.triggerEvent, tmpl.triggerEvent)
      ));

    if (existing.length === 0) {
      await db.insert(notificationTemplates).values(tmpl);
      console.log(`Email template seeded: ${tmpl.name}`);
    }
  }
}

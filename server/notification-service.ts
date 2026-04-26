import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function wrapInEmailTemplate(subject: string, bodyText: string): string {
  const bodyHtml = bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1a2f6e;text-decoration:underline;word-break:break-all;">$1</a>')
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${subject}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:24px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<tr>
<td style="background-color:#1a2f6e;padding:20px 24px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;text-align:center;">
KEI MATCH
</td>
</tr>
<tr>
<td style="color:rgba(255,255,255,0.85);font-size:11px;text-align:center;padding-top:2px;">
KEIKAMOTSU MATCH
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:32px 24px 24px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="color:#18181b;font-size:15px;line-height:1.8;word-break:break-word;">
${bodyHtml}
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 24px 24px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4e4e7;">
<tr>
<td style="padding-top:20px;color:#71717a;font-size:11px;line-height:1.6;text-align:center;">
本メールはKEI MATCHから自動送信されています。<br>
心当たりのない場合はお手数ですが本メールを破棄してください。<br><br>
合同会社SIN JAPAN<br>
<a href="https://keimatch-sinjapan.com" style="color:#1a2f6e;text-decoration:none;">keimatch-sinjapan.com</a>
</td>
</tr>
</table>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  const transport = getEmailTransporter();
  if (!transport) {
    return { success: false, error: "メール設定が未構成です" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@keimatch-sinjapan.com";
  const isAlreadyHtml = /<\/?(?:div|table|tr|td|h[1-6]|p|br|a|span|img)\b/i.test(body);

  try {
    if (isAlreadyHtml) {
      await transport.sendMail({
        from,
        to,
        subject,
        text: body.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        html: body,
      });
    } else {
      await transport.sendMail({
        from,
        to,
        subject,
        text: body,
        html: wrapInEmailTemplate(subject, body),
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendLineMessage(
  lineUserId: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: "LINE設定が未構成です" };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("LINE API error:", res.status, errorBody);
      return { success: false, error: `LINE API error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("LINE send error:", err);
    return { success: false, error: err.message };
  }
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function isLineConfigured(): boolean {
  return !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

export function buildCargoNewEmailHtml(vars: {
  departureArea: string;
  arrivalArea: string;
  cargoType: string;
  weight: string;
  price: string;
  desiredDate: string;
  vehicleType: string;
  companyName: string;
  appBaseUrl: string;
}): string {
  const subject = "【KEI MATCH】新しい案件が登録されました";
  const rows = [
    { label: "出発地 → 到着地", value: `${vars.departureArea} → ${vars.arrivalArea}` },
    { label: "荷物種類", value: vars.cargoType || "未設定" },
    { label: "重量", value: vars.weight || "未設定" },
    { label: "希望車種", value: vars.vehicleType || "未設定" },
    { label: "希望日", value: vars.desiredDate || "未設定" },
    { label: "運賃", value: vars.price ? `${vars.price}` : "要相談" },
    { label: "登録会社", value: vars.companyName || "匿名" },
  ];
  const tableRows = rows.map((r, i) => `
    <tr style="background-color:${i % 2 === 0 ? "#f8faff" : "#ffffff"};">
      <td style="padding:10px 14px;font-size:12px;color:#71717a;white-space:nowrap;width:120px;border-bottom:1px solid #e4e4e7;">${r.label}</td>
      <td style="padding:10px 14px;font-size:13px;color:#18181b;font-weight:600;border-bottom:1px solid #e4e4e7;">${r.value}</td>
    </tr>`).join("");

  return wrapInEmailTemplate(subject, `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding-bottom:20px;">
  <div style="display:inline-block;background-color:#e8f0ff;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;color:#1a2f6e;letter-spacing:0.5px;">📦 新着案件</div>
  <h2 style="margin:10px 0 4px;font-size:18px;color:#18181b;font-weight:700;">新しい軽貨物案件が登録されました</h2>
  <p style="margin:0;font-size:13px;color:#71717a;">以下の案件がKEI MATCHに登録されました。</p>
</td></tr>
<tr><td style="padding-bottom:8px;">
  <div style="background:linear-gradient(135deg,#1a2f6e 0%,#2d4a9e 100%);border-radius:8px;padding:16px 20px;text-align:center;">
    <span style="color:rgba(255,255,255,0.8);font-size:12px;">配送区間</span><br>
    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;">${vars.departureArea}&nbsp;→&nbsp;${vars.arrivalArea}</span>
  </div>
</td></tr>
<tr><td style="padding-bottom:20px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
    ${tableRows}
  </table>
</td></tr>
<tr><td style="text-align:center;padding-bottom:8px;">
  <a href="${vars.appBaseUrl}/cargo" style="display:inline-block;background-color:#1a2f6e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">案件の詳細を確認する →</a>
</td></tr>
</table>`);
}

export function buildTruckNewEmailHtml(vars: {
  currentArea: string;
  destinationArea: string;
  vehicleType: string;
  maxWeight: string;
  price: string;
  availableDate: string;
  companyName: string;
  appBaseUrl: string;
}): string {
  const subject = "【KEI MATCH】新しい空き車両が登録されました";
  const rows = [
    { label: "現在地 → 行先", value: `${vars.currentArea} → ${vars.destinationArea || "相談可"}` },
    { label: "車両タイプ", value: vars.vehicleType || "未設定" },
    { label: "積載量", value: vars.maxWeight || "未設定" },
    { label: "空き日", value: vars.availableDate || "未設定" },
    { label: "希望運賃", value: vars.price ? `${vars.price}` : "要相談" },
    { label: "登録会社", value: vars.companyName || "匿名" },
  ];
  const tableRows = rows.map((r, i) => `
    <tr style="background-color:${i % 2 === 0 ? "#f8faff" : "#ffffff"};">
      <td style="padding:10px 14px;font-size:12px;color:#71717a;white-space:nowrap;width:120px;border-bottom:1px solid #e4e4e7;">${r.label}</td>
      <td style="padding:10px 14px;font-size:13px;color:#18181b;font-weight:600;border-bottom:1px solid #e4e4e7;">${r.value}</td>
    </tr>`).join("");

  return wrapInEmailTemplate(subject, `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding-bottom:20px;">
  <div style="display:inline-block;background-color:#e8fff3;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;color:#166534;letter-spacing:0.5px;">🚐 新着空き車両</div>
  <h2 style="margin:10px 0 4px;font-size:18px;color:#18181b;font-weight:700;">新しい空き車両が登録されました</h2>
  <p style="margin:0;font-size:13px;color:#71717a;">以下の空き車両がKEI MATCHに登録されました。</p>
</td></tr>
<tr><td style="padding-bottom:8px;">
  <div style="background:linear-gradient(135deg,#166534 0%,#16a34a 100%);border-radius:8px;padding:16px 20px;text-align:center;">
    <span style="color:rgba(255,255,255,0.8);font-size:12px;">エリア</span><br>
    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;">${vars.currentArea}&nbsp;→&nbsp;${vars.destinationArea || "相談可"}</span>
  </div>
</td></tr>
<tr><td style="padding-bottom:20px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
    ${tableRows}
  </table>
</td></tr>
<tr><td style="text-align:center;padding-bottom:8px;">
  <a href="${vars.appBaseUrl}/trucks" style="display:inline-block;background-color:#166534;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">空き車両の詳細を確認する →</a>
</td></tr>
</table>`);
}

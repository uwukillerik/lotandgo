import nodemailer from "nodemailer";

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST ?? "mail.hosting.reg.ru";
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER ?? "info@lotandgo.ru";
  const pass = process.env.SMTP_PASS ?? "jekamixtop666";

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
  });
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "info@lotandgo.ru";
  const transport = getTransport();
  await transport.sendMail({
    from: `Lot&Go <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

export function buildWelcomeEmailHtml(params: {
  userName: string;
  ctaUrl?: string;
}): string {
  const cta = params.ctaUrl ?? "http://77.50.193.34:7080";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lot&Go</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Manrope,Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#f59e0b 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Lot&amp;Go</div>
              <div style="margin-top:8px;font-size:14px;color:rgba(255,255,255,0.9);">Аукционы частной собственности</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Здравствуйте, ${params.userName}!</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">
                Добро пожаловать на Lot&amp;Go — платформу живых торгов. Создавайте лоты, делайте ставки в реальном времени и выигрывайте уникальные вещи.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#fff7ed;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b45309;">Как начать</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#78350f;">1. Откройте каталог аукционов<br/>2. Сделайте первую ставку<br/>3. Получите контакты продавца после победы</p>
                  </td>
                </tr>
              </table>
              <a href="${cta}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;box-shadow:0 8px 24px rgba(245,158,11,0.35);">
                Перейти на Lot&amp;Go
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Lot&amp;Go · info@lotandgo.ru</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTestEmailHtml(): string {
  return buildWelcomeEmailHtml({ userName: "Тестовый пользователь" });
}

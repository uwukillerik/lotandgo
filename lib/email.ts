import nodemailer from "nodemailer";
import { SITE_URL, SUPPORT_EMAIL } from "@shared/site-url";

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  const host = process.env.SMTP_HOST ?? "mail.hosting.reg.ru";
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP не настроен: задайте SMTP_USER и SMTP_PASS в .env");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  });
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? SUPPORT_EMAIL;
  const transport = getTransport();
  try {
    await transport.sendMail({
      from: `Lot&Go <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/ETIMEDOUT|timeout|ESOCKET/i.test(msg)) {
      throw new Error(
        "Не удалось подключиться к SMTP (таймаут). Проверьте SMTP_HOST/PORT и доступность порта 587 с этого сервера.",
      );
    }
    if (/Invalid login|535|authentication failed/i.test(msg)) {
      throw new Error("SMTP: неверный логин или пароль (SMTP_USER / SMTP_PASS)");
    }
    throw err instanceof Error ? err : new Error(msg);
  }
}

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Manrope,Segoe UI,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
<tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb 50%,#f59e0b);padding:28px;text-align:center;">
<div style="font-size:26px;font-weight:800;color:#fff;">Lot&amp;Go</div>
<div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.9);">${title}</div>
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;text-align:center;">
<p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Lot&amp;Go · ${SUPPORT_EMAIL}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export function buildWelcomeEmailHtml(params: {
  userName: string;
  ctaUrl?: string;
}): string {
  const cta = params.ctaUrl ?? SITE_URL;
  return emailShell(
    "Добро пожаловать",
    `<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Здравствуйте, ${params.userName}!</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">Добро пожаловать на Lot&amp;Go — платформу живых торгов.</p>
<a href="${cta}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;">Перейти на Lot&amp;Go</a>`,
  );
}

export function buildOutbidEmailHtml(params: {
  userName: string;
  auctionTitle: string;
  newPrice: number;
  auctionUrl: string;
}): string {
  return emailShell(
    "Ставку перебили",
    `<p style="color:#475569;">${params.userName}, вашу ставку на «${params.auctionTitle}» перебили.</p>
<p style="font-size:22px;font-weight:800;color:#b45309;">${params.newPrice.toLocaleString("ru-RU")} ₽</p>
<a href="${params.auctionUrl}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;">Вернуться к торгам</a>`,
  );
}

export function buildWonEmailHtml(params: {
  userName: string;
  auctionTitle: string;
  auctionUrl: string;
}): string {
  return emailShell(
    "Вы победили!",
    `<p style="color:#475569;">Поздравляем, ${params.userName}! Вы победили в аукционе «${params.auctionTitle}».</p>
<a href="${params.auctionUrl}" style="display:inline-block;margin-top:16px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;">Открыть лот и чат</a>`,
  );
}

export function buildTestEmailHtml(): string {
  return buildWelcomeEmailHtml({ userName: "Тестовый пользователь" });
}

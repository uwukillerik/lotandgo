import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { sendMail, buildTestEmailHtml, buildWelcomeEmailHtml } from "@/lib/email";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  to: z.string().email(),
  template: z.enum(["test", "welcome"]).default("test"),
  userName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const user = process.env.SMTP_USER ?? "info@lotandgo.ru";
    const host = process.env.SMTP_HOST ?? "mail.hosting.reg.ru";
    const port = process.env.SMTP_PORT ?? "587";
    return Response.json({ ok: true, host, port, user, from: process.env.SMTP_FROM ?? user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { to, template, userName } = parsed.data;
    const html =
      template === "welcome"
        ? buildWelcomeEmailHtml({ userName: userName ?? "Участник Lot&Go" })
        : buildTestEmailHtml();

    await sendMail({
      to,
      subject:
        template === "welcome"
          ? "Добро пожаловать в Lot&Go"
          : "Тестовое письмо Lot&Go",
      html,
      text: "Lot&Go — аукционы частной собственности. Откройте письмо в HTML-клиенте.",
    });

    return Response.json({ ok: true, sentTo: to });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Отправить welcome-письмо пользователю по id */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const userId = z.string().uuid().parse(body.userId);

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    await sendMail({
      to: user.email,
      subject: "Добро пожаловать в Lot&Go",
      html: buildWelcomeEmailHtml({ userName: user.name }),
    });

    return Response.json({ ok: true, sentTo: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}

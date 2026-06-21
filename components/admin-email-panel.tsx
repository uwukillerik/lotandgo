"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail, Loader2, Send, AlertCircle } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { AdminBtn, AdminCard, AdminSectionTitle } from "@/components/admin-ui";
import { toast } from "sonner";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const EMAIL_STORAGE_KEY = "lotgo_admin_test_email";

export function AdminEmailPanel() {
  const [to, setTo] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(EMAIL_STORAGE_KEY) ?? "";
  });

  const handleEmailChange = (value: string) => {
    setTo(value);
    if (value.trim()) {
      localStorage.setItem(EMAIL_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(EMAIL_STORAGE_KEY);
    }
  };

  const { data: smtp, isError: smtpError } = useQuery({
    queryKey: ["admin-email-smtp"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email/send", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не удалось загрузить настройки SMTP");
      return res.json() as Promise<{
        host: string;
        port: string;
        user: string;
        configured: boolean;
      }>;
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const email = to.trim();
      if (!email) throw new Error("Укажите email получателя");
      if (!isValidEmail(email)) throw new Error("Некорректный email");

      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ to: email, template: "test" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка отправки");
      return json;
    },
    onSuccess: (data) => {
      toast.success(`Письмо отправлено: ${data.sentTo}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSend = Boolean(smtp?.configured) && isValidEmail(to) && !sendTest.isPending;

  return (
    <AdminCard className="space-y-4">
      <AdminSectionTitle>Почта Lot&Go</AdminSectionTitle>

      {smtpError && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Не удалось загрузить настройки SMTP
        </p>
      )}

      {smtp && !smtp.configured && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          SMTP не настроен — задайте SMTP_USER и SMTP_PASS в .env и перезапустите сервер
        </p>
      )}

      <p className="text-sm text-slate-500">
        {smtp
          ? `SMTP: ${smtp.host}:${smtp.port} · ${smtp.user}${smtp.configured ? "" : " · пароль не задан"}`
          : "Загрузка настроек SMTP…"}
      </p>
      <p className="text-xs text-slate-400">
        Введите любой email получателя — письмо уйдёт на указанный адрес, не на ваш аккаунт.
      </p>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Кому</span>
        <input
          type="email"
          value={to}
          onChange={(e) => handleEmailChange(e.target.value)}
          className="input-field"
          placeholder="test@gmail.com — любой адрес"
          autoComplete="email"
        />
        {to && !isValidEmail(to) && (
          <span className="mt-1 block text-xs text-red-600">Введите корректный email</span>
        )}
      </label>

      <AdminBtn onClick={() => sendTest.mutate()} disabled={!canSend}>
        {sendTest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Отправить тестовое HTML-письмо
      </AdminBtn>
    </AdminCard>
  );
}

export function AdminSendWelcomeButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const send = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/email/send", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json;
    },
    onSuccess: (data) => toast.success(`Welcome отправлен: ${data.sentTo}`),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminBtn variant="ghost" onClick={() => send.mutate()} disabled={send.isPending}>
      {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      Письмо {userName}
    </AdminBtn>
  );
}

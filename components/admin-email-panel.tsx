"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mail, Loader2, Send } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { AdminBtn, AdminCard, AdminSectionTitle } from "@/components/admin-ui";
import { toast } from "sonner";

export function AdminEmailPanel() {
  const [to, setTo] = useState("jekamix6666@gmail.com");

  const { data: smtp } = useQuery({
    queryKey: ["admin-email-smtp"],
    queryFn: async () => {
      const res = await fetch("/api/admin/email/send", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не удалось загрузить настройки SMTP");
      return res.json() as Promise<{ host: string; port: string; user: string }>;
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ to, template: "test" }),
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

  return (
    <AdminCard className="space-y-4">
      <AdminSectionTitle>Почта Lot&Go</AdminSectionTitle>
      <p className="text-sm text-slate-500">
        {smtp
          ? `SMTP: ${smtp.host}:${smtp.port} · ${smtp.user}`
          : "Загрузка настроек SMTP…"}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Кому</span>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="input-field"
          placeholder="email@example.com"
        />
      </label>
      <AdminBtn onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
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

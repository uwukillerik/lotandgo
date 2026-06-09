"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InnerHeader } from "@/components/site-header";
import { legalDocumentList } from "@/lib/legal-content";
import { getAuthHeaders } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Пароль изменён");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.push("/profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border-0 bg-slate-100 px-4 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500/40";

  return (
    <div className="min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Настройки" right={null} />
      <main className="page-shell mx-auto max-w-md">
        <form onSubmit={submit} className="surface-card space-y-4 p-5">
          <h2 className="font-bold text-slate-900">Смена пароля</h2>
          <input
            type="password"
            placeholder="Текущий пароль"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Новый пароль (мин. 8)"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className={inputClass}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className={inputClass}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary h-12 w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Сохранить"}
          </button>
        </form>

        <section className="mt-10 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Документы</h2>
          <p className="mt-1 text-sm text-slate-500">Юридические материалы платформы</p>
          <ul className="mt-4 space-y-2">
            {legalDocumentList.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/legal/${doc.slug}`}
                  className="text-sm font-semibold text-amber-700 hover:underline"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

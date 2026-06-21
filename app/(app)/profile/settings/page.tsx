"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InnerHeader } from "@/components/site-header";
import { InstallAppButton } from "@/components/install-app-button";
import { CategorySubscriptionsPanel } from "@/components/category-subscriptions";
import { PushSubscribeButton } from "@/components/push-subscribe-button";
import { legalDocumentList } from "@/lib/legal-content";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { Loader2, Bell, Lock, FileText, Smartphone, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (user) setEmailNotifications(user.emailNotifications);
  }, [user]);

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

  const toggleEmailNotifications = async () => {
    const next = !emailNotifications;
    setSavingEmail(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ emailNotifications: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailNotifications(next);
      await refresh();
      toast.success(next ? "Email-уведомления включены" : "Email-уведомления отключены");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Настройки" />

      <main className="page-shell settings-page">
        <div className="settings-hero">
          <p className="section-eyebrow">Аккаунт</p>
          <h2 className="display-heading mt-1 text-2xl">Настройки профиля</h2>
          <p className="mt-2 text-sm text-slate-600">
            Уведомления, безопасность и документы платформы
          </p>
        </div>

        <div className="settings-grid">
          <section className="settings-panel">
            <div className="settings-panel-head">
              <span className="settings-panel-icon">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">Уведомления</h3>
                <p className="text-sm text-slate-500">Email при перебитой ставке и победе</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailNotifications}
                disabled={savingEmail}
                onClick={toggleEmailNotifications}
                className={`settings-toggle ${emailNotifications ? "settings-toggle-on" : ""}`}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
          </section>

          <section className="settings-panel">
            <div className="settings-panel-head settings-panel-head-static">
              <span className="settings-panel-icon">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">Приложение на телефоне</h3>
                <p className="text-sm text-slate-500">PWA или APK для Android</p>
              </div>
            </div>
            <div className="settings-panel-body">
              <InstallAppButton variant="secondary" layout="row" showHints={false} />
              <div className="mt-3">
                <PushSubscribeButton />
              </div>
            </div>
          </section>

          <CategorySubscriptionsPanel />

          <section className="settings-panel lg:col-span-2">
            <div className="settings-panel-head settings-panel-head-static">
              <span className="settings-panel-icon">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">Смена пароля</h3>
                <p className="text-sm text-slate-500">Минимум 8 символов</p>
              </div>
            </div>
            <form onSubmit={submit} className="settings-panel-body space-y-3">
              <input
                type="password"
                placeholder="Текущий пароль"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="input-field"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="input-field"
                  required
                  minLength={8}
                />
                <input
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary h-11 px-8">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Сохранить пароль"}
              </button>
            </form>
          </section>

          <section className="settings-panel lg:col-span-2">
            <div className="settings-panel-head settings-panel-head-static">
              <span className="settings-panel-icon">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">Документы</h3>
                <p className="text-sm text-slate-500">Юридические материалы Lot&Go</p>
              </div>
            </div>
            <ul className="settings-panel-body divide-y divide-slate-100">
              {legalDocumentList.map((doc) => (
                <li key={doc.slug}>
                  <Link href={`/legal/${doc.slug}`} className="settings-doc-link">
                    <span>{doc.title}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

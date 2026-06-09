"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  Gavel,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const features = [
  { icon: Gavel, text: "Живые торги в реальном времени" },
  { icon: Shield, text: "Безопасная сделка и чат с продавцом" },
  { icon: Zap, text: "Кошелёк и мгновенная оплата лота" },
];

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error("Пароли не совпадают");
      }
      if (!isLogin && (!formData.acceptTerms || !formData.acceptPrivacy)) {
        throw new Error("Примите пользовательское соглашение и согласие на обработку персональных данных");
      }

      const url = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            name: formData.name,
            phone: formData.phone || undefined,
            acceptTerms: true as const,
            acceptPrivacy: true as const,
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        const details = data.details as Record<string, string[] | undefined> | undefined;
        const firstFieldError = details
          ? Object.values(details).flat().find(Boolean)
          : undefined;
        throw new Error(firstFieldError ?? data.error ?? "Ошибка");
      }

      if (data.accessToken) {
        localStorage.setItem("lotgo_token", data.accessToken);
        await refresh();
      }

      setSuccess(true);
      const dest =
        data.user?.role === "admin"
          ? "/admin"
          : new URLSearchParams(window.location.search).get("next") ?? "/catalog";
      setTimeout(() => router.push(dest), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "input-field h-12 pl-12 bg-white/90 backdrop-blur-sm transition focus:bg-white";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f8f6f1]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-[360px] w-[360px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-violet-100/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(251,191,36,0.12),transparent)]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_480px] lg:items-center lg:gap-12 lg:px-8 lg:py-12">
        {/* Left — brand */}
        <div className="mb-8 lg:mb-0">
          <Link href="/" className="inline-flex items-center gap-3">
            <span
              aria-hidden
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-visible sm:h-11 sm:w-11"
            >
              <Image
                src="/logo.png"
                alt=""
                width={96}
                height={96}
                className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 scale-[1.5] object-contain sm:h-20 sm:w-20 sm:scale-[1.6]"
              />
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              Lot&<span className="text-amber-500">Go</span>
            </span>
          </Link>

          <div className="mt-8 lg:mt-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Аукционы нового поколения
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
              Покупайте и продавайте
              <br />
              <span className="gradient-text">на честных торгах</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-600 sm:text-lg">
              Ставки в реальном времени, встроенный кошелёк и прямой чат с продавцом — всё в одном приложении.
            </p>
          </div>

          <ul className="mt-8 hidden space-y-4 sm:block">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <Icon className="h-5 w-5 text-amber-500" />
                </span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form card */}
        <div className="w-full">
          <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {isLogin ? "С возвращением!" : "Создайте аккаунт"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLogin ? "Войдите, чтобы делать ставки и управлять лотами" : "Регистрация займёт меньше минуты"}
            </p>

            {success && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">Готово! Переходим…</span>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/80 p-1">
              {(["login", "register"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setIsLogin(mode === "login");
                    setError("");
                  }}
                  className={cn(
                    "rounded-xl py-2.5 text-sm font-bold transition-all duration-200",
                    (mode === "login") === isLogin
                      ? "bg-white text-slate-900 shadow-md shadow-slate-900/5"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {mode === "login" ? "Вход" : "Регистрация"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              {!isLogin && (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Телефон (необязательно)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Пароль (мин. 8 символов)"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputClass}
                  required
                  minLength={8}
                />
              </div>
              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={inputClass}
                    required={!isLogin}
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      required
                    />
                    <span>
                      Я принимаю{" "}
                      <Link href="/legal/terms" target="_blank" className="font-semibold text-amber-700 hover:underline">
                        пользовательское соглашение
                      </Link>{" "}
                      и{" "}
                      <Link href="/legal/offer" target="_blank" className="font-semibold text-amber-700 hover:underline">
                        публичную оферту
                      </Link>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.acceptPrivacy}
                      onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      required
                    />
                    <span>
                      Я даю{" "}
                      <Link href="/legal/personal-data" target="_blank" className="font-semibold text-amber-700 hover:underline">
                        согласие на обработку персональных данных
                      </Link>{" "}
                      и ознакомлен(а) с{" "}
                      <Link href="/legal/privacy" target="_blank" className="font-semibold text-amber-700 hover:underline">
                        политикой конфиденциальности
                      </Link>
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="btn-primary mt-2 h-12 w-full text-base shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Подождите…
                  </>
                ) : isLogin ? (
                  "Войти"
                ) : (
                  "Зарегистрироваться"
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              {isLogin ? (
                <>
                  Входя в аккаунт, вы подтверждаете ознакомление с{" "}
                  <Link href="/legal/terms" className="font-semibold text-amber-700 hover:underline">
                    соглашением
                  </Link>{" "}
                  и{" "}
                  <Link href="/legal/privacy" className="font-semibold text-amber-700 hover:underline">
                    политикой конфиденциальности
                  </Link>
                </>
              ) : (
                "Регистрация доступна после принятия обязательных документов выше"
              )}
            </p>

            {isLogin && (
              <div className="mt-6 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Демо-аккаунты</p>
                <p className="mt-1 text-xs text-slate-500">Пароль: <span className="font-mono font-semibold text-slate-700">Demo123456</span></p>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {[
                    ["admin@lotgo.ru", "Админ"],
                    ["seller@lotgo.ru", "Продавец"],
                    ["bidder1@lotgo.ru", "Покупатель"],
                    ["bidder2@lotgo.ru", "Покупатель"],
                  ].map(([email, role]) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, email, password: "Demo123456" }))}
                      className="rounded-xl bg-white px-3 py-2 text-left text-xs ring-1 ring-slate-200/80 transition hover:ring-amber-400/50"
                    >
                      <span className="block font-mono text-slate-700">{email}</span>
                      <span className="text-slate-400">{role}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/" className="font-semibold text-slate-600 hover:text-amber-600">
              ← На главную
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

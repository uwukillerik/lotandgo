import { InstallAppButton } from "@/components/install-app-button";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageMeta } from "@/components/page-meta";
import { SiteFooter } from "@/components/site-footer";
import {
  HomePublicStats,
  HomeLiveAuctions,
  HomeCategoryChips,
  HomeHeroFeatured,
} from "@/components/home-live-sections";
import {
  Gavel,
  Shield,
  Zap,
  Bell,
  ArrowRight,
  Sparkles,
  Search,
  Trophy,
  HandCoins,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Ставки live",
    desc: "Цена меняется в реальном времени — без задержек и перезагрузок.",
  },
  {
    icon: Gavel,
    title: "Честные торги",
    desc: "Таймер, шаг и anti-snipe — торги продлеваются при ставке в последние минуты.",
  },
  {
    icon: Bell,
    title: "Уведомления",
    desc: "Push в приложении и email при перебитой ставке и победе.",
  },
  {
    icon: Shield,
    title: "Безопасность",
    desc: "Контакты продавца — только победителю после окончания торгов.",
  },
];

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Найдите лот",
    desc: "Каталог с фильтрами по категориям — от антиквариата до коллекций.",
  },
  {
    icon: HandCoins,
    step: "02",
    title: "Сделайте ставку",
    desc: "Live-торги с прозрачным шагом. Перебейте соперника в один клик.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Победите",
    desc: "Выиграйте аукцион — контакты продавца откроются автоматически.",
  },
];

export default function HomePage() {
  return (
    <div className="page-bg flex min-h-dvh flex-col">
      <PageMeta title="Lot&Go — Аукционы частной собственности" />
      <SiteHeader active="home" />

      <main className="flex-1">
        <section className="hero-section">
          <div className="hero-section-bg" aria-hidden />
          <div className="page-shell relative !pb-12 !pt-8 sm:!pb-16 sm:!pt-10 lg:!pt-12">
            <div className="hero-grid">
              <div className="hero-copy space-y-6 sm:space-y-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Аукционы частной собственности
                </div>

                <div>
                  <h1 className="display-heading text-[1.85rem] leading-[1.08] sm:text-4xl lg:text-[2.75rem]">
                    Покупайте редкие вещи на{" "}
                    <span className="gradient-text">живых торгах</span>
                  </h1>
                  <div className="gold-line mt-4" />
                </div>

                <p className="max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
                  Антиквариат, коллекции, украшения — выставляйте лоты и побеждайте честно на Lot&Go.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/catalog"
                    className="btn-primary w-full justify-center py-3.5 text-base sm:w-auto"
                  >
                    Смотреть аукционы
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/auth"
                    className="btn-ghost w-full justify-center py-3.5 text-base sm:w-auto"
                  >
                    Создать аккаунт
                  </Link>
                </div>

                <div className="hero-trust-row">
                  {["Live-ставки", "Anti-snipe", "Прозрачный шаг"].map((tag) => (
                    <span key={tag} className="hero-trust-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="surface-card !rounded-2xl p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="icon-ring !rounded-lg !p-2">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-bold text-slate-900">Lot&Go на телефоне</p>
                  </div>
                  <InstallAppButton variant="secondary" layout="row" showHints={false} />
                </div>

                <HomeCategoryChips />
              </div>

              <div className="hero-showcase-col">
                <HomeHeroFeatured />
              </div>
            </div>

            <div className="mt-8 lg:mt-10">
              <HomePublicStats />
            </div>
          </div>
        </section>

        <HomeLiveAuctions />

        <section className="py-14 sm:py-20">
          <div className="page-shell !py-0">
            <div className="mb-10 text-center sm:mb-12">
              <p className="section-eyebrow">Как это работает</p>
              <h2 className="display-heading mt-2 text-2xl sm:text-3xl">Три шага до победы</h2>
            </div>

            <div className="steps-grid">
              {steps.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="step-card">
                  <div className="step-card-top">
                    <span className="icon-ring">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="step-card-number">{step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="page-shell !py-0">
            <div className="mb-10 text-center sm:mb-12">
              <h2 className="display-heading text-2xl sm:text-3xl">Всё для удобных торгов</h2>
              <p className="mt-2 text-slate-500 sm:text-lg">Простой процесс от лота до победы</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="surface-card-interactive p-5 sm:p-6">
                  <span className="icon-ring mb-4">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="page-shell !py-0">
            <div className="cta-warm">
              <div className="relative">
                <p className="section-eyebrow">Начните сейчас</p>
                <h2 className="display-heading mt-2 text-2xl sm:text-3xl">
                  Готовы к первой ставке?
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 sm:text-base">
                  Бесплатная регистрация за минуту — без скрытых комиссий
                </p>
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href="/catalog"
                      className="btn-primary w-full justify-center px-10 py-3.5 text-base sm:w-auto"
                    >
                      Открыть каталог
                    </Link>
                    <Link
                      href="/auth"
                      className="btn-ghost w-full justify-center px-8 py-3.5 text-base sm:w-auto"
                    >
                      Регистрация
                    </Link>
                  </div>
                  <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/50 p-4 backdrop-blur">
                    <InstallAppButton variant="secondary" layout="stack" showHints={false} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

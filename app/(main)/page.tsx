import { InstallAppButton } from "@/components/install-app-button";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroLotPreview } from "@/components/hero-lot-preview";
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
  Clock,
  Percent,
  Layers,
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
    desc: "Таймер, шаг и стартовая цена — всё прозрачно с первой секунды.",
  },
  {
    icon: Bell,
    title: "Уведомления",
    desc: "Узнайте о перебитой ставке и завершении аукциона вовремя.",
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

const stats = [
  { icon: Layers, value: "500+", label: "категорий лотов" },
  { icon: Clock, value: "Live", label: "торги 24/7" },
  { icon: Percent, value: "0%", label: "скрытых комиссий" },
];

export default function HomePage() {
  return (
    <div className="page-bg min-h-dvh">
      <SiteHeader active="home" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_40%,rgba(251,191,36,0.09),transparent)]" />

          <div className="page-shell relative !pb-12 !pt-10 sm:!pb-16 sm:!pt-14 lg:!pt-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Аукционы частной собственности
                </div>

                <div>
                  <h1 className="display-heading text-[1.85rem] leading-[1.1] sm:text-4xl lg:text-5xl">
                    Покупайте редкие вещи на{" "}
                    <span className="gradient-text">живых торгах</span>
                  </h1>
                  <div className="gold-line mt-4" />
                </div>

                <p className="max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                  Антиквариат, коллекции, украшения — выставляйте лоты и побеждайте честно на Lot&Go.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Link href="/catalog" className="btn-primary w-full justify-center py-3.5 text-base sm:w-auto">
                    Смотреть аукционы
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <InstallAppButton variant="ghost" className="w-full sm:w-auto" />
                  <Link href="/auth" className="btn-ghost w-full justify-center py-3.5 text-base sm:w-auto">
                    Создать аккаунт
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Мебель", "Украшения", "Живопись", "Антиквариат", "Коллекции"].map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-amber-200 hover:bg-amber-50/50"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <HeroLotPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Статистика */}
        <section className="relative z-10 -mt-4 sm:-mt-6">
          <div className="page-shell !py-0">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="surface-card flex flex-col items-center gap-2 p-4 text-center sm:p-5"
                >
                  <span className="icon-ring !rounded-xl !p-2.5">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section className="py-14 sm:py-20">
          <div className="page-shell !py-0">
            <div className="mb-10 text-center sm:mb-12">
              <p className="section-eyebrow">Как это работает</p>
              <h2 className="display-heading mt-2 text-2xl sm:text-3xl">Три шага до победы</h2>
            </div>

            <div className="relative grid gap-4 sm:grid-cols-3 sm:gap-5">
              <div className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent sm:block" />

              {steps.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="surface-card-interactive relative p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="icon-ring">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="text-3xl font-black text-slate-100">{step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Преимущества */}
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

        {/* CTA */}
        <section className="pb-14 sm:pb-20">
          <div className="page-shell !py-0">
            <div className="cta-warm">
              <div className="relative">
                <p className="section-eyebrow">Начните сейчас</p>
                <h2 className="display-heading mt-2 text-2xl sm:text-3xl">
                  Готовы к первой ставке?
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm text-slate-600 sm:text-base">
                  Бесплатная регистрация за минуту — без скрытых комиссий
                </p>
                <div className="mt-8 flex flex-col items-center gap-4">
                  <InstallAppButton variant="primary" className="items-center justify-center" />
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link href="/catalog" className="btn-primary w-full px-10 py-3.5 text-base sm:w-auto">
                    Открыть каталог
                  </Link>
                  <Link href="/auth" className="btn-ghost w-full px-8 py-3.5 text-base sm:w-auto">
                    Регистрация
                  </Link>
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

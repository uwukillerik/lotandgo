import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid,
  Download,
  Mail,
  Shield,
  FileText,
  Cookie,
  Scale,
  Smartphone,
} from "lucide-react";
import { legalDocumentList } from "@/lib/legal-content";
import { InstallAppButton } from "@/components/install-app-button";
import { APK_DOWNLOAD_PATH, SUPPORT_EMAIL } from "@shared/site-url";

const legalIcons: Record<string, typeof Shield> = {
  privacy: Shield,
  terms: FileText,
  "personal-data": FileText,
  cookie: Cookie,
  offer: Scale,
};

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="border-t border-slate-200/60 bg-white/70 py-6 text-center backdrop-blur">
        <p className="text-xs text-slate-500">© 2026 Lot&Go</p>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-gradient-to-b from-white/80 to-slate-50/90 backdrop-blur-xl">
      <div className="page-shell !pb-10 !pt-12 sm:!pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
          {/* Бренд */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25">
                <Image src="/logo.png" alt="" width={44} height={44} className="object-contain p-1" />
              </span>
              <span>
                <span className="block text-lg font-extrabold text-slate-900">
                  Lot&<span className="text-amber-500">Go</span>
                </span>
                <span className="text-xs font-medium text-slate-500">Аукционы в реальном времени</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-600">
              Покупайте и продавайте редкие вещи на честных live-торгах — с телефона, браузера или APK.
            </p>
          </div>

          {/* Разделы */}
          <div>
            <h3 className="footer-col-title">Разделы</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/catalog" className="footer-link">
                  <LayoutGrid className="h-4 w-4 shrink-0 text-amber-500" />
                  Каталог аукционов
                </Link>
              </li>
              <li>
                <Link href="/auth" className="footer-link">
                  <Shield className="h-4 w-4 shrink-0 text-amber-500" />
                  Войти / регистрация
                </Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="footer-link">
                  <Mail className="h-4 w-4 shrink-0 text-amber-500" />
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>

          {/* Приложение */}
          <div>
            <h3 className="footer-col-title">Мобильное приложение</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Добавьте Lot&Go на главный экран — ставки и уведомления в один тап.
            </p>
            <div className="mt-4">
              <InstallAppButton variant="footer" layout="stack" showHints={false} />
            </div>
            <a href={APK_DOWNLOAD_PATH} download className="footer-apk-note mt-3 inline-flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Android · WebView APK</span>
            </a>
          </div>

          {/* Документы */}
          <div>
            <h3 className="footer-col-title">Документы</h3>
            <ul className="mt-4 space-y-2">
              {legalDocumentList.map((doc) => {
                const Icon = legalIcons[doc.slug] ?? FileText;
                return (
                  <li key={doc.slug}>
                    <Link href={`/legal/${doc.slug}`} className="footer-link text-sm">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {doc.shortTitle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">© 2026 Lot&Go. Все права защищены.</p>
          <a href={APK_DOWNLOAD_PATH} download className="footer-link !text-amber-700">
            <Download className="h-4 w-4" />
            Скачать APK для Android
          </a>
        </div>
      </div>
    </footer>
  );
}

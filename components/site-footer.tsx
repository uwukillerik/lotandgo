import Link from "next/link";
import { legalDocumentList } from "@/lib/legal-content";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 py-8 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        {!compact && (
          <nav className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            {legalDocumentList.map((doc) => (
              <Link
                key={doc.slug}
                href={`/legal/${doc.slug}`}
                className="font-semibold text-slate-600 transition hover:text-amber-700"
              >
                {doc.shortTitle}
              </Link>
            ))}
          </nav>
        )}
        <p className="text-xs text-slate-500 sm:text-sm">© 2026 Lot&Go</p>
      </div>
    </footer>
  );
}

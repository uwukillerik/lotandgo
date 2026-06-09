import Link from "next/link";
import { LEGAL_DISCLAIMER, type LegalDocument } from "@/lib/legal-content";
import { legalDocumentList } from "@/lib/legal-content";
import { FileText, AlertCircle } from "lucide-react";

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p>{LEGAL_DISCLAIMER}</p>
      </div>

      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          <FileText className="h-3.5 w-3.5" />
          Юридический документ
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {doc.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Редакция от {new Date(doc.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {doc.description && (
          <p className="mt-3 text-slate-600">{doc.description}</p>
        )}
      </header>

      <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:text-amber-700">
        {doc.sections.map((section, i) => (
          <section key={i} className="mb-8">
            {section.heading && <h2 className="text-lg">{section.heading}</h2>}
            {section.paragraphs?.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
            {section.list && (
              <ul>
                {section.list.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <nav className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-900">Другие документы</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {legalDocumentList
            .filter((d) => d.slug !== doc.slug)
            .map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/legal/${d.slug}`}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  {d.title}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </article>
  );
}

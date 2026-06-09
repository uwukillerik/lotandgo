"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLegalDocument } from "@/lib/legal-content";
import { LegalDocumentView } from "@/components/legal-document-view";
import { SiteFooter } from "@/components/site-footer";

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getLegalDocument(slug) : undefined;

  if (!doc) {
    return (
      <div className="page-bg min-h-dvh px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-bold text-slate-900">Документ не найден</h1>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-amber-700">
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg flex min-h-dvh flex-col">
      <div className="border-b border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </div>
      </div>
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <LegalDocumentView doc={doc} />
      </main>
      <SiteFooter compact />
    </div>
  );
}

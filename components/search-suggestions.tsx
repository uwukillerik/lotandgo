"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatPrice, cn } from "@/lib/utils";

export function SearchWithSuggestions({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const q = value.trim();

  const { data } = useQuery({
    queryKey: ["search-suggest", q],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/suggest?q=${encodeURIComponent(q)}`);
      return (await res.json()).suggestions as Array<{
        id: string;
        title: string;
        category: string;
        currentPrice: number;
      }>;
    },
    enabled: q.length >= 2 && open,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = data ?? [];

  return (
    <div ref={wrapRef} className={cn("relative min-w-0 flex-1", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        placeholder="Поиск по названию…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="input-field pl-11"
        autoComplete="off"
      />
      {open && q.length >= 2 && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl">
          {suggestions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/auction/${s.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-amber-50"
                onClick={() => setOpen(false)}
              >
                <span className="min-w-0 truncate font-semibold text-slate-800">{s.title}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {s.category} · {formatPrice(s.currentPrice)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

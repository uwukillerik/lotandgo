"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  Tag,
  ArrowUpDown,
  Radio,
  Banknote,
  Sparkles,
  Search,
} from "lucide-react";
import { LOT_CATEGORIES } from "@shared/categories";
import {
  CATALOG_SORT_OPTIONS,
  CATALOG_STATUS_OPTIONS,
  DEFAULT_CATALOG_FILTERS,
  countActiveCatalogFilters,
  type CatalogFilters,
} from "@shared/catalog-filters";
import { cn } from "@/lib/utils";
import { SearchWithSuggestions } from "@/components/search-suggestions";

function FilterSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="filter-section-title">
        <Icon className="h-3.5 w-3.5 text-amber-500" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function FilterOptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ul className="filter-option-list">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn("filter-option", active && "filter-option-active")}
            >
              <span>{opt.label}</span>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CatalogFiltersModal({
  open,
  draft,
  onDraftChange,
  onApply,
  onReset,
  onClose,
}: {
  open: boolean;
  draft: CatalogFilters;
  onDraftChange: (next: CatalogFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const patch = useCallback(
    (partial: Partial<CatalogFilters>) => onDraftChange({ ...draft, ...partial }),
    [draft, onDraftChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.body.classList.add("filter-modal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("filter-modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const categories = ["Все", ...LOT_CATEGORIES];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-filters-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[6px]"
        aria-label="Закрыть"
        onClick={onClose}
      />

      <div className="filter-modal-panel relative z-[1] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:zoom-in-95">
        <div className="flex items-center justify-between border-b border-amber-100/80 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="icon-ring !rounded-xl !p-2">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <h2 id="catalog-filters-title" className="text-base font-extrabold text-slate-900">
                Фильтры и сортировка
              </h2>
              <p className="text-xs text-slate-500">Настройте каталог под себя</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="header-icon-btn !h-9 !w-9"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="filter-modal-body">
          <FilterSection icon={Search} title="Поиск">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Название лота…"
                value={draft.search}
                onChange={(e) => patch({ search: e.target.value })}
                className="input-field pl-11"
              />
            </div>
          </FilterSection>

          <FilterSection icon={Tag} title="Категория">
            <div className="filter-category-grid">
              {categories.map((cat) => {
                const active = draft.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => patch({ category: cat })}
                    className={cn(
                      "filter-category-chip",
                      active && "filter-category-chip-active",
                    )}
                  >
                    {cat === "Все" ? "Все" : cat}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection icon={ArrowUpDown} title="Сортировка">
            <FilterOptionList
              options={CATALOG_SORT_OPTIONS}
              value={draft.sort}
              onChange={(sort) => patch({ sort })}
            />
          </FilterSection>

          <FilterSection icon={Radio} title="Статус торгов">
            <FilterOptionList
              options={CATALOG_STATUS_OPTIONS}
              value={draft.status}
              onChange={(status) => patch({ status })}
            />
          </FilterSection>

          <FilterSection icon={Banknote} title="Диапазон цены">
            <div className="filter-price-row">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="От"
                value={draft.minPrice}
                onChange={(e) => patch({ minPrice: e.target.value })}
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-center text-sm font-bold tabular-nums text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
              />
              <span className="text-slate-300">—</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="До"
                value={draft.maxPrice}
                onChange={(e) => patch({ maxPrice: e.target.value })}
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-center text-sm font-bold tabular-nums text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400"
              />
              <span className="pr-2 text-xs font-bold text-slate-400">₽</span>
            </div>
          </FilterSection>
        </div>

        <div className="filter-modal-footer">
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost flex-1 !py-3"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onApply}
            className="btn-primary flex-[1.4] !py-3"
          >
            <Sparkles className="h-4 w-4" />
            Показать
          </button>
        </div>
      </div>
    </div>
  );
}

export function CatalogFiltersPanel({
  filters,
  onChange,
}: {
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogFilters>(filters);
  const activeCount = countActiveCatalogFilters(filters);

  const openModal = () => {
    setDraft(filters);
    setOpen(true);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const reset = () => {
    setDraft(DEFAULT_CATALOG_FILTERS);
  };

  return (
    <>
      <div className="surface-card mb-5 p-3 sm:p-4">
        <div className="flex gap-2">
          <SearchWithSuggestions
            value={filters.search}
            onChange={(search) => onChange({ ...filters, search })}
          />
          <button
            type="button"
            onClick={openModal}
            className={cn(
              "filter-open-btn",
              activeCount > 0 && "filter-open-btn-active",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Фильтры</span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {activeCount > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {filters.category !== "Все" && (
              <span className="chip-inactive !py-1 !text-[11px]">{filters.category}</span>
            )}
            {filters.status !== "all" && (
              <span className="chip-inactive !py-1 !text-[11px]">
                {CATALOG_STATUS_OPTIONS.find((o) => o.value === filters.status)?.label}
              </span>
            )}
            {filters.sort !== "newest" && (
              <span className="chip-inactive !py-1 !text-[11px]">
                {CATALOG_SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="chip-inactive !py-1 !text-[11px]">
                {filters.minPrice || "0"} — {filters.maxPrice || "∞"} ₽
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(DEFAULT_CATALOG_FILTERS)}
              className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-amber-700 hover:underline"
            >
              Сбросить всё
            </button>
          </div>
        )}
      </div>

      <CatalogFiltersModal
        open={open}
        draft={draft}
        onDraftChange={setDraft}
        onApply={apply}
        onReset={reset}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

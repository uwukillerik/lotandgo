export const CATALOG_SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Цена: по возрастанию" },
  { value: "price_desc", label: "Цена: по убыванию" },
  { value: "ending_soon", label: "Скоро закончатся" },
  { value: "bids_desc", label: "Больше ставок" },
] as const;

export type CatalogSort = (typeof CATALOG_SORT_OPTIONS)[number]["value"];

export const CATALOG_STATUS_OPTIONS = [
  { value: "all", label: "Все статусы" },
  { value: "active", label: "Идут торги (Live)" },
  { value: "scheduled", label: "Скоро начнутся" },
  { value: "ended", label: "Завершённые" },
] as const;

export type CatalogStatusFilter = (typeof CATALOG_STATUS_OPTIONS)[number]["value"];

export type CatalogFilters = {
  search: string;
  category: string;
  status: CatalogStatusFilter;
  sort: CatalogSort;
  minPrice: string;
  maxPrice: string;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  search: "",
  category: "Все",
  status: "all",
  sort: "newest",
  minPrice: "",
  maxPrice: "",
};

export function hasActiveCatalogFilters(f: CatalogFilters): boolean {
  return countActiveCatalogFilters(f) > 0;
}

export function countActiveCatalogFilters(f: CatalogFilters): number {
  let n = 0;
  if (f.search !== "") n++;
  if (f.category !== "Все") n++;
  if (f.status !== "all") n++;
  if (f.sort !== "newest") n++;
  if (f.minPrice !== "") n++;
  if (f.maxPrice !== "") n++;
  return n;
}

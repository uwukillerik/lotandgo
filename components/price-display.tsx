import { cn } from "@/lib/utils";

export function formatPriceAmount(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** Цена: число и ₽ всегда видны, без обрезки */
export function PriceDisplay({
  value,
  className,
  amountClassName,
  currencyClassName,
}: {
  value: number;
  className?: string;
  amountClassName?: string;
  currencyClassName?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-0.5 leading-tight", className)}>
      <span className={cn("tabular-nums font-bold text-slate-900", amountClassName)}>
        {formatPriceAmount(value)}
      </span>
      <span className={cn("shrink-0 font-bold text-slate-800", currencyClassName)}>₽</span>
    </span>
  );
}

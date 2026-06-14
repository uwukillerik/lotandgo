import { cn } from "@/lib/utils";

export function formatPriceAmount(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** Цена без переноса символа ₽ на новую строку */
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
    <span
      className={cn(
        "inline-flex max-w-full items-baseline whitespace-nowrap leading-none",
        className,
      )}
    >
      <span className={cn("min-w-0 truncate tabular-nums", amountClassName)}>
        {formatPriceAmount(value)}
      </span>
      <span className={cn("ml-0.5 shrink-0 font-bold", currencyClassName)}>₽</span>
    </span>
  );
}

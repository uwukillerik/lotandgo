import { Crown, Sparkles, TrendingUp } from "lucide-react";
import type { PromotionTier } from "@shared/api";
import { PROMOTION_LABELS } from "@/lib/promotion-config";
import { cn } from "@/lib/utils";

const tierStyles: Record<
  PromotionTier,
  { className: string; icon: typeof Crown }
> = {
  premium: {
    className: "bg-gradient-to-r from-violet-600 to-amber-500 text-white shadow-violet-500/30",
    icon: Crown,
  },
  featured: {
    className: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30",
    icon: Sparkles,
  },
  boost: {
    className: "bg-sky-600 text-white shadow-sky-500/25",
    icon: TrendingUp,
  },
};

export function PromotionBadge({
  tier,
  className,
  size = "sm",
}: {
  tier: PromotionTier;
  className?: string;
  size?: "sm" | "md";
}) {
  const style = tierStyles[tier];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-bold uppercase tracking-wide shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        style.className,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {PROMOTION_LABELS[tier]}
    </span>
  );
}

export function promotionCardClass(tier?: PromotionTier | null): string {
  if (tier === "premium") {
    return "promo-card-premium border-violet-300/80 shadow-[0_8px_32px_-8px_rgba(139,92,246,0.35)]";
  }
  if (tier === "featured") {
    return "promo-card-featured border-amber-300/90 shadow-[0_8px_28px_-8px_rgba(245,158,11,0.35)]";
  }
  if (tier === "boost") {
    return "promo-card-boost border-sky-200/90 ring-1 ring-sky-100";
  }
  return "";
}

export type PromotionTier = "boost" | "featured" | "premium";

export type PromotionPlan = {
  tier: PromotionTier;
  name: string;
  tagline: string;
  priceRubles: number;
  days: number;
  perks: string[];
};

export const PROMOTION_PLANS: PromotionPlan[] = [
  {
    tier: "boost",
    name: "Поднять",
    tagline: "Лот выше в каталоге",
    priceRubles: 199,
    days: 3,
    perks: ["Бейдж «Поднят»", "Приоритет в списке", "Лёгкая подсветка карточки"],
  },
  {
    tier: "featured",
    name: "В топе",
    tagline: "Золотая карточка в каталоге",
    priceRubles: 499,
    days: 7,
    perks: ["Бейдж «В топе»", "Золотая рамка", "Показ в блоке «Рекомендуем»", "Выше обычных лотов"],
  },
  {
    tier: "premium",
    name: "Премиум",
    tagline: "Максимальная видимость",
    priceRubles: 999,
    days: 14,
    perks: [
      "Бейдж «Premium»",
      "Анимированная рамка",
      "Крупная карточка в витрине",
      "Первые позиции каталога",
      "Выделение на странице лота",
    ],
  },
];

export const PROMOTION_TIER_ORDER: Record<PromotionTier, number> = {
  premium: 0,
  featured: 1,
  boost: 2,
};

export function getPromotionPlan(tier: PromotionTier): PromotionPlan {
  const plan = PROMOTION_PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error("Неизвестный тариф");
  return plan;
}

export const PROMOTION_LABELS: Record<PromotionTier, string> = {
  boost: "Поднят",
  featured: "В топе",
  premium: "Premium",
};

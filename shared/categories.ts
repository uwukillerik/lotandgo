export const LOT_CATEGORIES = [
  "Мебель",
  "Украшения",
  "Живопись",
  "Книги",
  "Антиквариат",
  "Коллекционирование",
  "Электроника",
  "Прочее",
] as const;

export type LotCategory = (typeof LOT_CATEGORIES)[number];

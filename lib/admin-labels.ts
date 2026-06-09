export const lotStatusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "Активный",
  ended: "Завершён",
  sold: "Продан",
};

export const auctionStatusLabels: Record<string, string> = {
  scheduled: "Запланирован",
  active: "Идут торги",
  ended: "Завершён",
  cancelled: "Отменён",
};

export const dealStatusLabels: Record<string, string> = {
  none: "Нет сделки",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачено",
  shipped: "Отправлено",
  completed: "Завершено",
  disputed: "Спор",
};

export const roleLabels: Record<string, string> = {
  user: "Пользователь",
  admin: "Администратор",
};

export const walletTxLabels: Record<string, string> = {
  deposit: "Пополнение",
  withdraw: "Вывод",
  bid_hold: "Резерв ставки",
  bid_release: "Возврат ставки",
  auction_payment: "Оплата лота",
  seller_payout: "Выплата продавцу",
  platform_fee: "Комиссия платформы",
};

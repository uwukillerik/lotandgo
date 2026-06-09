"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gavel,
  Loader2,
  TrendingUp,
  User,
  Trophy,
  Radio,
  Wallet,
  History,
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";
import { PromotionBadge } from "@/components/promotion-badge";
import { InnerHeader } from "@/components/site-header";
import { Countdown } from "@/components/countdown";
import { Skeleton } from "@/components/skeleton";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { useAuctionSocket } from "@/hooks/use-auction-socket";
import type { AuctionDetail } from "@shared/api";
import type { SellerContact } from "@shared/api";
import { formatPrice, cn } from "@/lib/utils";
import { AuctionChat } from "@/components/auction-chat";
import { AuctionDealPanel } from "@/components/auction-deal-panel";

function BidPanel({
  minBid,
  bidStep,
  bidAmount,
  setBidAmount,
  quickBids,
  error,
  isPending,
  onBid,
  variant = "desktop",
  currentPrice,
  endsAt,
}: {
  minBid: number;
  bidStep: number;
  bidAmount: string;
  setBidAmount: (v: string) => void;
  quickBids: number[];
  error: string;
  isPending: boolean;
  onBid: () => void;
  variant?: "desktop" | "mobile";
  currentPrice?: number;
  endsAt?: string;
}) {
  const chips = (
    <div className={cn("flex flex-wrap gap-1.5", variant === "desktop" && "mt-3")}>
      {quickBids.map((amount) => {
        const active = bidAmount === String(amount);
        return (
          <button
            key={amount}
            type="button"
            onClick={() => setBidAmount(String(amount))}
            className={active ? "bid-quick-chip-active" : "bid-quick-chip"}
          >
            {formatPrice(amount)}
          </button>
        );
      })}
    </div>
  );

  const inputBlock = (
    <div className={cn(variant === "desktop" ? "mt-3" : "mt-2.5")}>
      <div className="bid-input-fused">
        <input
          type="number"
          inputMode="numeric"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder={minBid.toLocaleString("ru-RU")}
          aria-label="Сумма ставки"
          className="bid-input-field"
        />
        <span className="hidden pr-1 text-sm font-bold text-slate-400 sm:inline">₽</span>
        <button
          type="button"
          disabled={isPending}
          onClick={onBid}
          aria-label="Сделать ставку"
          className="bid-submit-btn"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Gavel className="h-5 w-5" strokeWidth={2.25} />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-center text-xs font-semibold text-rose-600">{error}</p>
      )}
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="bid-dock-wrap">
        <div className="bid-dock">
          <div className="bid-dock-shine" aria-hidden />
          <div className="bid-dock-meta">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Текущая цена
              </p>
              <p className="bid-dock-price">{formatPrice(currentPrice ?? minBid)}</p>
            </div>
            {endsAt && (
              <div className="bid-dock-timer">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  До конца
                </p>
                <Countdown
                  endsAt={endsAt}
                  className="text-sm font-bold text-slate-800"
                  urgentClassName="text-sm font-bold text-rose-500 animate-pulse"
                />
              </div>
            )}
          </div>
          <div className="relative z-[1] mt-2.5">{chips}</div>
          {inputBlock}
          <p className="relative z-[1] mt-2 text-center text-[10px] font-medium text-slate-500">
            Мин. {formatPrice(minBid)} · шаг {formatPrice(bidStep)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-elevated p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <TrendingUp className="h-4 w-4 text-amber-500" />
        Сделать ставку
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Минимум {formatPrice(minBid)} · шаг {formatPrice(bidStep)}
      </p>
      {chips}
      {inputBlock}
    </div>
  );
}

export default function AuctionPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useAuctionSocket(id, user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не найден");
      return (await res.json()).auction as AuctionDetail;
    },
    refetchInterval: 60_000,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const res = await fetch("/api/payments/status", { headers: getAuthHeaders() });
      return res.json() as Promise<{
        verified: boolean;
        configured: boolean;
        provider: string;
      }>;
    },
    enabled: !!user,
  });

  const { data: sellerContact } = useQuery({
    queryKey: ["seller-contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${id}/seller-contact`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return (await res.json()).contact as SellerContact;
    },
    enabled: !!data?.isWinner && data?.status === "ended",
  });

  const bidMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`/api/auctions/${id}/bids`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      setBidAmount("");
      setError("");
      qc.invalidateQueries({ queryKey: ["auction", id] });
      qc.invalidateQueries({ queryKey: ["auctions"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  useEffect(() => setActiveImage(0), [id]);

  const handleBid = () => {
    if (!data) return;
    const bids = data.bids ?? [];
    const minBid =
      bids.length === 0 ? data.startPrice : data.currentPrice + data.bidStep;
    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount < minBid) {
      setError(`Минимум ${formatPrice(minBid)}`);
      return;
    }
    setError("");
    bidMutation.mutate(amount);
  };

  if (isLoading || !data) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/catalog" backLabel="Каталог" title="Загрузка…" />
        <div className="page-shell space-y-4">
          <Skeleton className="mx-auto aspect-[4/3] max-h-56 w-full max-w-md rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const bids = data.bids ?? [];
  const imagesList = data.images ?? [];
  const minBid =
    bids.length === 0 ? data.startPrice : data.currentPrice + data.bidStep;
  const quickBids = [minBid, minBid + data.bidStep, minBid + data.bidStep * 2];
  const paymentOk =
    paymentStatus?.provider === "none" || paymentStatus?.verified === true;
  const canBid =
    data.status === "active" && !data.isSeller && !!user && paymentOk;
  const showBidUi = data.status === "active" && !data.isSeller;
  const needsPayment = !!user && showBidUi && paymentStatus?.configured && !paymentOk;
  const isLive = data.status === "active";
  const leadingBid = bids[0];

  const images =
    imagesList.length > 0
      ? imagesList
      : data.imageUrl
        ? [{ id: "0", url: data.imageUrl, sortOrder: 0 }]
        : [];

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader
        backHref="/catalog"
        backLabel="Каталог"
        title={
          (data.title ?? "Лот").length > 28
            ? `${(data.title ?? "Лот").slice(0, 28)}…`
            : (data.title ?? "Лот")
        }
      />

      <main
        className={cn(
          "page-shell-tight",
          showBidUi && canBid &&
            "!pb-[calc(16rem+env(safe-area-inset-bottom,0px))] lg:!pb-8",
        )}
      >
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Галерея */}
          <div className="lg:col-span-2">
            <div
              className={cn(
                "surface-card relative mx-auto aspect-[4/3] max-h-60 w-full overflow-hidden p-1 sm:max-h-72 lg:max-h-none lg:mx-0",
                data.promotion?.tier === "premium" && "ring-2 ring-violet-300/60 promo-card-premium",
                data.promotion?.tier === "featured" && "ring-2 ring-amber-300/70 promo-card-featured",
              )}
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100">
              {images.length > 0 ? (
                <Image
                  src={images[activeImage]?.url ?? images[0].url}
                  alt={data.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width:1024px) 100vw, 40vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Gavel className="h-12 w-12 text-slate-300" />
                </div>
              )}

              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                {isLive && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30">
                    <span className="live-pulse" />
                    Live
                  </span>
                )}
                {data.promotion && <PromotionBadge tier={data.promotion.tier} size="md" />}
              </div>

              {images.length > 1 && (
                <>
                  <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <Images className="h-3.5 w-3.5" />
                    {activeImage + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i > 0 ? i - 1 : images.length - 1))}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur hover:bg-white"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-800" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i < images.length - 1 ? i + 1 : 0))}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur hover:bg-white"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-800" />
                  </button>
                </>
              )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-14 sm:w-14",
                      activeImage === i ? "border-amber-500" : "border-slate-200 opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Основная информация */}
          <div className="space-y-4 lg:col-span-3">
            <div>
              <p className="auction-lot-no">Лот #{data.id.slice(0, 8)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-amber-600">
                {data.category}
              </p>
              <h1 className="display-heading mt-1.5 text-xl sm:text-2xl lg:text-3xl">
                {data.title}
              </h1>
            </div>

            <div className="price-panel">
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Текущая цена</p>
                  <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-600 sm:text-4xl">
                    {formatPrice(data.currentPrice)}
                  </p>
                  {leadingBid && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <Radio className="h-3.5 w-3.5 text-emerald-500" />
                      Лидер: <span className="font-semibold text-slate-900">{leadingBid.userName}</span>
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-amber-100 bg-white/80 px-4 py-2.5 text-right shadow-sm backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">До конца</p>
                  <Countdown
                    endsAt={data.endsAt}
                    className="text-lg font-bold text-slate-900"
                    urgentClassName="text-lg font-bold text-rose-500 animate-pulse"
                  />
                </div>
              </div>
              <div className="price-panel-meta relative mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-slate-200/70 pt-4">
                <span>
                  <span className="price-panel-meta-label">Старт</span>{" "}
                  <span className="price-panel-meta-value">{formatPrice(data.startPrice)}</span>
                </span>
                <span>
                  <span className="price-panel-meta-label">Шаг</span>{" "}
                  <span className="price-panel-meta-value">{formatPrice(data.bidStep)}</span>
                </span>
                <span>
                  <span className="price-panel-meta-value">{data.bidsCount} ставок</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                  <span className="price-panel-meta-value">{data.sellerName}</span>
                </span>
              </div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Описание</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{data.description}</p>
            </div>

            {needsPayment && (
              <Link href="/profile/payments" className="surface-card flex items-center gap-3 border-amber-200 p-4">
                <Wallet className="h-6 w-6 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Подтвердите депозит</p>
                  <p className="text-xs text-slate-500">
                    Нужно один раз на аккаунт (тестовая оплата до ЮKassa)
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-600">→</span>
              </Link>
            )}

            {canBid && (
              <div className="hidden lg:block">
                <BidPanel
                  minBid={minBid}
                  bidStep={data.bidStep}
                  bidAmount={bidAmount}
                  setBidAmount={setBidAmount}
                  quickBids={quickBids}
                  error={error}
                  isPending={bidMutation.isPending}
                  onBid={handleBid}
                />
              </div>
            )}

            {!user && showBidUi && (
              <div className="surface-card p-5 text-center">
                <p className="text-sm font-semibold text-slate-900">Войдите, чтобы участвовать в торгах</p>
                <Link href="/auth" className="btn-primary mt-3 inline-flex px-6">
                  Войти в аккаунт
                </Link>
              </div>
            )}

            {data.status === "ended" && data.isWinner && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Trophy className="h-4 w-4" />
                  Вы победили! Оплатите лот и договоритесь о передаче в чате ниже.
                </p>
                {sellerContact ? (
                  <div className="mt-2 space-y-0.5 text-sm text-emerald-700">
                    <p>
                      <span className="font-medium">Продавец:</span> {sellerContact.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      <a href={`mailto:${sellerContact.email}`} className="underline">
                        {sellerContact.email}
                      </a>
                    </p>
                    {sellerContact.phone && (
                      <p>
                        <span className="font-medium">Телефон:</span>{" "}
                        <a href={`tel:${sellerContact.phone}`} className="underline">
                          {sellerContact.phone}
                        </a>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-emerald-600">Загрузка контактов…</p>
                )}
              </div>
            )}

            {data.status === "ended" && data.isSeller && data.winnerId && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Аукцион завершён — есть победитель. Свяжитесь в чате для передачи лота.
                </p>
              </div>
            )}

            {data.canChat && data.dealStatus !== "none" && (
              <AuctionDealPanel
                auctionId={data.id}
                dealStatus={data.dealStatus}
                isWinner={data.isWinner}
                isSeller={data.isSeller}
              />
            )}

            {data.canChat && (
              <>
                <AuctionChat auctionId={data.id} />
                <Link
                  href={`/messages/${data.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-200 hover:text-amber-700"
                >
                  Открыть в разделе «Сообщения»
                </Link>
              </>
            )}
          </div>
        </div>

        {/* История ставок */}
        <div className="mt-6 surface-card p-4 sm:p-5 lg:sticky lg:top-20">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="icon-ring !rounded-lg !p-2">
              <History className="h-4 w-4" />
            </span>
            История ставок
          </h2>
          {bids.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Торги открыты — будьте первым участником</p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-0 overflow-y-auto scrollbar-none">
              {bids.map((bid, i) => (
                <li
                  key={bid.id}
                  className={cn(
                    "flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0",
                    bid.userId === user?.id && "rounded-lg bg-amber-50/80 -mx-2 px-2",
                  )}
                >
                  <span className="flex items-center gap-2 text-slate-600">
                    {i === 0 && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                        лидер
                      </span>
                    )}
                    <span className={bid.userId === user?.id ? "font-medium text-amber-800" : ""}>
                      {bid.userName}
                      {bid.userId === user?.id && " (вы)"}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatPrice(bid.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {showBidUi && canBid && (
        <BidPanel
          variant="mobile"
          minBid={minBid}
          bidStep={data.bidStep}
          bidAmount={bidAmount}
          setBidAmount={setBidAmount}
          quickBids={quickBids.slice(0, 2)}
          error={error}
          isPending={bidMutation.isPending}
          onBid={handleBid}
          currentPrice={data.currentPrice}
          endsAt={data.endsAt}
        />
      )}
    </div>
  );
}

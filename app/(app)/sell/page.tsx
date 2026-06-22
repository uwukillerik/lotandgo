"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { InnerHeader } from "@/components/site-header";
import { ImageUploader } from "@/components/sell/image-uploader";
import { DurationPicker, computeEndsAtFromDuration } from "@/components/duration-picker";
import { getAuthHeaders, getAuthUploadHeaders, useAuth } from "@/components/auth-provider";
import { LOT_CATEGORIES } from "@shared/categories";
import { AUCTION_TYPE_OPTIONS, type AuctionType } from "@shared/auction-types";
import { cn } from "@/lib/utils";

export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lotId, setLotId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(LOT_CATEGORIES[0]);
  const [images, setImages] = useState<File[]>([]);

  const [startPrice, setStartPrice] = useState("");
  const [bidStep, setBidStep] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [auctionType, setAuctionType] = useState<AuctionType>("anti_snipe");
  const [holdHours, setHoldHours] = useState("1");
  const [holdMinutes, setHoldMinutes] = useState("0");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth?next=/sell");
  }, [authLoading, user, router]);

  const inputClass = "input-field h-12";

  const submitStep1 = async () => {
    setError("");
    if (images.length === 0) {
      setError("Добавьте хотя бы одно фото");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      for (const img of images) formData.append("images", img);

      const res = await fetch("/api/lots", {
        method: "POST",
        headers: getAuthUploadHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      setLotId(data.lot.id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async () => {
    if (!lotId) return;
    setError("");
    setLoading(true);
    try {
      const now = new Date();
      const endsAt = computeEndsAtFromDuration(
        now,
        durationHours,
        durationMinutes,
        durationSeconds,
      );
      if (endsAt.getTime() <= now.getTime()) {
        throw new Error("Укажите длительность аукциона");
      }
      const holdDurationSeconds =
        auctionType === "soft_close"
          ? (parseInt(holdHours, 10) || 0) * 3600 + (parseInt(holdMinutes, 10) || 0) * 60
          : undefined;

      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          lotId,
          startPrice: parseInt(startPrice, 10),
          bidStep: parseInt(bidStep, 10),
          startsAt: now.toISOString(),
          endsAt: endsAt.toISOString(),
          auctionType,
          ...(holdDurationSeconds ? { holdDurationSeconds } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      router.push(`/auction/${data.auction.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/catalog" backLabel="Каталог" title="Выставить лот" right={null} />

      <main className="page-shell mx-auto max-w-lg">
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                step >= s ? "bg-amber-500" : "bg-slate-200",
              )}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Название</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Например: Карманные часы 1920 года"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={cn(inputClass, "h-auto py-3")}
                placeholder="Состояние, происхождение, детали…"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Категория</label>
              <div className="flex flex-wrap gap-2">
                {LOT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                      category === cat
                        ? "bg-slate-900 text-amber-400"
                        : "bg-white text-slate-600 ring-1 ring-slate-200",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Фото</label>
              <ImageUploader files={images} onChange={setImages} />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={submitStep1}
              className="btn-primary h-12 w-full"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Далее <ArrowRight className="h-5 w-5" /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Шаг 2: параметры торгов</p>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Стартовая цена (₽)</label>
              <input
                type="number"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                className={inputClass}
                placeholder="10000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Шаг ставки (₽)</label>
              <input
                type="number"
                value={bidStep}
                onChange={(e) => setBidStep(e.target.value)}
                className={inputClass}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Длительность торгов
              </label>
              <DurationPicker
                hours={durationHours}
                minutes={durationMinutes}
                seconds={durationSeconds}
                onHoursChange={setDurationHours}
                onMinutesChange={setDurationMinutes}
                onSecondsChange={setDurationSeconds}
              />
              <p className="mt-1 text-xs text-slate-500">
                Завершится:{" "}
                {computeEndsAtFromDuration(
                  new Date(),
                  durationHours,
                  durationMinutes,
                  durationSeconds,
                ).toLocaleString("ru-RU")}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Тип аукциона
              </label>
              <div className="space-y-2">
                {AUCTION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAuctionType(opt.value)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition",
                      auctionType === opt.value
                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {auctionType === "soft_close" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Лидер должен удержаться
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-center text-xs text-slate-500">Часы</label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={holdHours}
                      onChange={(e) => setHoldHours(e.target.value)}
                      className="input-field h-12 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-center text-xs text-slate-500">Минуты</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={holdMinutes}
                      onChange={(e) => setHoldMinutes(e.target.value)}
                      className="input-field h-12 text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost h-12 flex-1">
                <ArrowLeft className="h-4 w-4" /> Назад
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={submitStep2}
                className="btn-primary h-12 flex-[2]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Запустить аукцион"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === "md" ? "h-4 w-4" : "h-3.5 w-3.5",
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-200",
          )}
        />
      ))}
    </span>
  );
}

export function SellerReviews({
  sellerId,
  canReview,
  auctionId,
}: {
  sellerId: string;
  canReview?: boolean;
  auctionId?: string;
}) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["seller-reviews", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?sellerId=${sellerId}`);
      if (!res.ok) throw new Error("Ошибка");
      return res.json() as Promise<{
        reviews: Array<{
          id: string;
          rating: number;
          comment: string | null;
          reviewerName: string;
          createdAt: string;
        }>;
        averageRating: number;
        totalReviews: number;
      }>;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ auctionId, rating, comment: comment || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json;
    },
    onSuccess: () => {
      toast.success("Отзыв отправлен");
      setComment("");
      qc.invalidateQueries({ queryKey: ["seller-reviews", sellerId] });
      qc.invalidateQueries({ queryKey: ["auction", auctionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;

  return (
    <div className="surface-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Отзывы о продавце</h2>
        {data && data.totalReviews > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={data.averageRating} size="md" />
            <span className="font-bold text-slate-900">{data.averageRating.toFixed(1)}</span>
            <span className="text-slate-500">({data.totalReviews})</span>
          </div>
        )}
      </div>

      {canReview && auctionId && (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <p className="text-xs font-semibold text-slate-700">Оцените сделку</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
                aria-label={`${n} звёзд`}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Комментарий (необязательно)"
            className="input-field mt-2 min-h-[4rem] resize-y"
            maxLength={1000}
          />
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="btn-primary mt-2 !py-2 !text-sm"
          >
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отправить отзыв"}
          </button>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {data?.reviews.length === 0 && (
          <p className="text-sm text-slate-500">Пока нет отзывов</p>
        )}
        {data?.reviews.map((r) => (
          <li key={r.id} className="border-b border-slate-100 pb-3 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">{r.reviewerName}</span>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ru })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

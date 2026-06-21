"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FavoriteButton({
  auctionId,
  className,
  size = "md",
}: {
  auctionId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["favorite", auctionId],
    queryFn: async () => {
      const res = await fetch(`/api/favorites?auctionId=${auctionId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return { favorited: false };
      return res.json() as Promise<{ favorited: boolean }>;
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async (favorited: boolean) => {
      const res = await fetch(
        favorited ? `/api/favorites?auctionId=${auctionId}` : "/api/favorites",
        {
          method: favorited ? "DELETE" : "POST",
          headers: getAuthHeaders(),
          body: favorited ? undefined : JSON.stringify({ auctionId }),
        },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка");
      }
    },
    onSuccess: (_, wasFavorited) => {
      qc.invalidateQueries({ queryKey: ["favorite", auctionId] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(
        wasFavorited ? "Убрано из избранного" : "Добавлено в избранное",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  const favorited = data?.favorited ?? false;
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      aria-label={favorited ? "Убрать из избранного" : "В избранное"}
      disabled={toggle.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate(favorited);
      }}
      className={cn(
        "flex items-center justify-center rounded-xl border border-white/80 bg-white/90 shadow-sm transition active:scale-95",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        favorited && "border-rose-200 bg-rose-50 text-rose-500",
        className,
      )}
    >
      <Heart className={cn(iconSize, favorited && "fill-current")} strokeWidth={2.25} />
    </button>
  );
}

"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { AuctionImage } from "@/components/auction-image";
import { cn } from "@/lib/utils";

export function ImageLightbox({
  images,
  index,
  open,
  title,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  open: boolean;
  title?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const prev = useCallback(() => {
    onIndexChange(index > 0 ? index - 1 : images.length - 1);
  }, [index, images.length, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange(index < images.length - 1 ? index + 1 : 0);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, prev, next]);

  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
    >
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <p className="min-w-0 truncate text-sm font-semibold text-white/90">
          {title ?? "Фото"} · {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
        {images.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:left-4"
            aria-label="Предыдущее"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="relative h-full w-full max-h-[calc(100dvh-8rem)] max-w-5xl">
          <AuctionImage
            src={images[index]}
            alt={title ?? "Фото лота"}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:right-4"
            aria-label="Следующее"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] scrollbar-none">
          {images.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => onIndexChange(i)}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === index ? "border-amber-400 opacity-100" : "border-white/20 opacity-60",
              )}
            >
              <AuctionImage src={url} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

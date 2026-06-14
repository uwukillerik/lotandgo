"use client";

import { useState } from "react";
import Image from "next/image";
import { Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

function resolveSrc(src: string): string {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `/uploads/${src.replace(/^\/?uploads\//, "")}`;
}

export function AuctionImage({
  src,
  alt,
  className,
  fill,
  priority,
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? resolveSrc(src) : "";

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-amber-50/40",
          fill && "absolute inset-0",
          className,
        )}
      >
        <Gavel className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

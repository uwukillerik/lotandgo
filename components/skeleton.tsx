import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer rounded-xl", className)} />
  );
}

export function AuctionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      <Skeleton className="h-36 w-full rounded-none sm:h-40" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-5 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

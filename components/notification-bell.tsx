"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

export function NotificationBell({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return (await res.json()).notifications as Array<{ read: boolean }>;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  if (!user) return null;

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <Link
      href="/notifications"
      className={cn(
        "header-icon-btn",
        variant === "light" && "header-icon-btn-dark",
      )}
      aria-label={unread ? `Уведомления: ${unread} непрочитанных` : "Уведомления"}
    >
      <Bell className="h-[18px] w-[18px]" strokeWidth={2.1} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

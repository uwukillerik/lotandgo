"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CategorySubscriptionsPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["category-subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/category-subscriptions", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return res.json() as Promise<{
        categories: string[];
        subscriptions: Array<{ category: string; emailNotify: boolean; pushNotify: boolean }>;
      }>;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ category, enabled }: { category: string; enabled: boolean }) => {
      const res = await fetch("/api/category-subscriptions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ category, enabled }),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["category-subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return null;

  const subscribed = new Set(data.subscriptions.map((s) => s.category));

  return (
    <section className="settings-panel">
      <div className="settings-panel-head settings-panel-head-static">
        <span className="settings-panel-icon">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold text-slate-900">Подписки на категории</h3>
          <p className="text-sm text-slate-500">Уведомление при новом лоте в категории</p>
        </div>
      </div>
      <ul className="settings-panel-body divide-y divide-slate-100">
        {data.categories.map((cat) => {
          const on = subscribed.has(cat);
          return (
            <li key={cat} className="flex items-center justify-between py-3">
              <span className="text-sm font-semibold text-slate-700">{cat}</span>
              <button
                type="button"
                onClick={() => toggle.mutate({ category: cat, enabled: !on })}
                className={cn("settings-toggle", on && "settings-toggle-on")}
                aria-pressed={on}
              >
                <span className="settings-toggle-knob" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

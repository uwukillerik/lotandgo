"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { upsertChatMessage, type ChatMessage } from "@/lib/chat-cache";

export type { ChatMessage };

export function AuctionChat({
  auctionId,
  className,
}: {
  auctionId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["auction-messages", auctionId],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${auctionId}/messages`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Чат недоступен");
      return (await res.json()).messages as ChatMessage[];
    },
  });

  const send = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/auctions/${auctionId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка отправки");
      return json.message as ChatMessage;
    },
    onSuccess: (message) => {
      setText("");
      upsertChatMessage(qc, auctionId, message, user?.id);
      qc.invalidateQueries({ queryKey: ["message-conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.length]);

  return (
    <div className={cn("surface-card flex flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <MessageCircle className="h-5 w-5 text-amber-500" />
        <div>
          <p className="text-sm font-bold text-slate-900">Чат с продавцом</p>
          <p className="text-xs text-slate-500">Согласуйте оплату и доставку</p>
        </div>
      </div>

      <div className="flex min-h-48 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 scrollbar-none">
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <p className="py-8 text-center text-sm text-slate-500">
            Напишите первое сообщение — договоритесь об оплате и передаче лота
          </p>
        )}
        {data?.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
              m.isMine
                ? "ml-auto bg-amber-500 text-white"
                : "mr-auto bg-slate-100 text-slate-800",
            )}
          >
            {!m.isMine && (
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide opacity-70">
                {m.senderName}
              </p>
            )}
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p
              className={cn(
                "mt-1 text-[10px]",
                m.isMine ? "text-amber-100" : "text-slate-400",
              )}
            >
              {new Date(m.createdAt).toLocaleString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-slate-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const body = text.trim();
          if (!body || send.isPending) return;
          send.mutate(body);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение…"
          maxLength={2000}
          className="input-field h-10 min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          className="btn-primary h-10 shrink-0 px-4"
        >
          {send.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
      {send.isError && (
        <p className="px-4 pb-3 text-xs font-semibold text-rose-600">
          {(send.error as Error).message}
        </p>
      )}
    </div>
  );
}

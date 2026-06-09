import type { QueryClient } from "@tanstack/react-query";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  isMine?: boolean;
};

export function upsertChatMessage(
  qc: QueryClient,
  auctionId: string,
  message: ChatMessage,
  currentUserId?: string | null,
): void {
  qc.setQueryData(["auction-messages", auctionId], (old: ChatMessage[] | undefined) => {
    if (old?.some((m) => m.id === message.id)) return old;
    return [
      ...(old ?? []),
      {
        ...message,
        isMine: message.senderId === currentUserId,
      },
    ];
  });
}

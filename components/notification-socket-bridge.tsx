"use client";

import { useAuth } from "@/components/auth-provider";
import { useNotificationSocket } from "@/hooks/use-notification-socket";

export function NotificationSocketBridge() {
  const { user } = useAuth();
  useNotificationSocket(user?.id);
  return null;
}

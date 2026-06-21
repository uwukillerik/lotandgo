"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushSubscribeButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
    navigator.serviceWorker?.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
    });
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const keyRes = await fetch("/api/push/subscribe");
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        toast.error("Push не настроен на сервере (VAPID)");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Разрешите уведомления в браузере");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Ошибка сохранения подписки");
      setSubscribed(true);
      toast.success("Push-уведомления включены");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={loading || subscribed}
      onClick={subscribe}
      className={className ?? "btn-secondary !text-sm"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {subscribed ? "Push включён" : "Включить push"}
    </button>
  );
}

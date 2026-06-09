import { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { differenceInSeconds } from "date-fns";
import { COLORS } from "../config";

export function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, differenceInSeconds(new Date(endsAt), new Date())),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, differenceInSeconds(new Date(endsAt), new Date())));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return remaining;
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Завершён";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ч ${m}м ${s}с`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const remaining = useCountdown(endsAt);
  const urgent = remaining > 0 && remaining < 300;

  return (
    <Text style={[styles.text, urgent && styles.urgent]}>
      {formatCountdown(remaining)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  urgent: {
    color: COLORS.error,
  },
});

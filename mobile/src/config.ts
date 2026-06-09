export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8081";

export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? API_URL;

export const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  accent: "#F59E0B",
  accentDark: "#D97706",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

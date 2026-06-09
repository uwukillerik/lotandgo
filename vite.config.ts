import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    host: "::",
    port: 8081,
    strictPort: true,
  },
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@shared": path.resolve(__dirname, "./shared"),
      "next/link": path.resolve(__dirname, "./shim/next-link.tsx"),
      "next/image": path.resolve(__dirname, "./shim/next-image.tsx"),
      "next/navigation": path.resolve(__dirname, "./shim/next-navigation.ts"),
    },
  },
});

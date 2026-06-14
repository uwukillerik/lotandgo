import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "favicon.ico"],
      manifest: {
        name: "Lot&Go — Аукционы",
        short_name: "Lot&Go",
        description: "Аукционы частной собственности в реальном времени",
        theme_color: "#2563EB",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait-primary",
        lang: "ru",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
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

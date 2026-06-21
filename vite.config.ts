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
      injectRegister: "inline",
      includeAssets: ["favicon.ico", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Lot&Go — Аукционы",
        short_name: "Lot&Go",
        description: "Аукционы частной собственности в реальном времени",
        theme_color: "#2563EB",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait-primary",
        lang: "ru",
        categories: ["shopping"],
        start_url: "/",
        scope: "/",
        id: "/",
        shortcuts: [
          { name: "Каталог", url: "/catalog", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Профиль", url: "/profile", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2,png}"],
        importScripts: ["/push-sw.js"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/ws/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/auctions(\?.*)?$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "catalog-offline",
              expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 5 },
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

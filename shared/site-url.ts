/** Публичные URL продакшена (Keenetic: 7080→80, 3454→443). */
export const SITE_HOST = "77.50.193.34";
export const SITE_DOMAIN = "lotgo.ru";
export const EMAIL_DOMAIN = "lotandgo.ru";
export const HTTP_PORT = 7080;
export const HTTPS_PORT = 3454;

export const PUBLIC_HTTP_URL = `http://${SITE_HOST}:${HTTP_PORT}`;
export const PUBLIC_HTTPS_URL = `https://${SITE_HOST}:${HTTPS_PORT}`;
export const PUBLIC_HTTP_DOMAIN = `http://${SITE_DOMAIN}:${HTTP_PORT}`;
export const PUBLIC_HTTPS_DOMAIN = `https://${SITE_DOMAIN}:${HTTPS_PORT}`;

/** Основной URL для ссылок в письмах и шаринге. */
export const SITE_URL =
  typeof process !== "undefined" && process.env.SITE_URL
    ? process.env.SITE_URL
    : PUBLIC_HTTP_DOMAIN;

export const SUPPORT_EMAIL = `info@${EMAIL_DOMAIN}`;

export const APK_DOWNLOAD_PATH = "/downloads/lotgo.apk";

/** CORS для .env (через запятую). */
export const PRODUCTION_CORS_ORIGINS = [
  PUBLIC_HTTP_URL,
  PUBLIC_HTTPS_URL,
  PUBLIC_HTTP_DOMAIN,
  PUBLIC_HTTPS_DOMAIN,
  `http://www.${SITE_DOMAIN}:${HTTP_PORT}`,
  `https://www.${SITE_DOMAIN}:${HTTPS_PORT}`,
].join(",");

/** Anti-snipe: продлить торги, если ставка в последние N минут. */
export const ANTI_SNIPE_THRESHOLD_MS = 2 * 60 * 1000;
export const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

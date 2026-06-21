"use client";

import { useEffect } from "react";
import { SITE_URL } from "@shared/site-url";

type PageMetaProps = {
  title: string;
  description?: string;
  image?: string | null;
  path?: string;
};

export function PageMeta({ title, description, image, path }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes("Lot&Go") ? title : `${title} · Lot&Go`;
    document.title = fullTitle;

    const desc =
      description ??
      "Аукционы частной собственности в реальном времени — Lot&Go";
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const img = image?.startsWith("http")
      ? image
      : image
        ? `${SITE_URL}${image}`
        : `${SITE_URL}/icons/icon-512.png`;

    const setMeta = (property: string, content: string, isOg = true) => {
      const attr = isOg ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", desc, false);
    setMeta("og:title", fullTitle);
    setMeta("og:description", desc);
    setMeta("og:url", url);
    setMeta("og:image", img);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image", false);
    setMeta("twitter:title", fullTitle, false);
    setMeta("twitter:description", desc, false);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, image, path]);

  return null;
}

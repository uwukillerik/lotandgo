import type { Express, Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { auctions, lots } from "./db/schema";
import { SITE_URL } from "@shared/site-url";

export function registerPublicRoutes(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    );
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const rows = await db
        .select({ id: auctions.id, endsAt: auctions.endsAt })
        .from(auctions)
        .innerJoin(lots, eq(auctions.lotId, lots.id))
        .where(eq(auctions.status, "active"))
        .orderBy(desc(auctions.endsAt))
        .limit(500);

      const urls = [
        { loc: `${SITE_URL}/`, priority: "1.0" },
        { loc: `${SITE_URL}/catalog`, priority: "0.9" },
        { loc: `${SITE_URL}/auth`, priority: "0.5" },
        ...rows.map((r) => ({
          loc: `${SITE_URL}/auction/${r.id}`,
          priority: "0.8",
          lastmod: r.endsAt.toISOString().slice(0, 10),
        })),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${"lastmod" in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

      res.type("application/xml").send(xml);
    } catch (err) {
      console.error(err);
      res.status(500).send("sitemap error");
    }
  });

  app.get("/.well-known/assetlinks.json", (_req: Request, res: Response) => {
    const pkg = process.env.ANDROID_PACKAGE_NAME ?? "ru.lotgo.app";
    const fingerprint = process.env.ANDROID_SHA256_FINGERPRINT ?? "";
    res.json([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: pkg,
          sha256_cert_fingerprints: fingerprint ? [fingerprint] : [],
        },
      },
    ]);
  });
}

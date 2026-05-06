import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

// Public bucket: redirect is permanent + browser/CDN caches for 1 year.
// Private bucket (presigned): redirect is temporary, cache for 6 days
// (well inside the 7-day presigned URL TTL; 30-min safety margin is in storage.ts).
const PUBLIC_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const PRIVATE_MAX_AGE = 60 * 60 * 24 * 6;  // 6 days

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)["0"];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const isPublic = !!process.env.R2_PUBLIC_URL;
      const targetUrl = await storageGetSignedUrl(key); // returns public URL if R2_PUBLIC_URL set
      const maxAge = isPublic ? PUBLIC_MAX_AGE : PRIVATE_MAX_AGE;

      res.set("Cache-Control", `public, max-age=${maxAge}`);
      // 301 for public (permanent, browser caches the redirect itself)
      // 302 for private (temporary, re-validates before following cached redirect)
      res.redirect(isPublic ? 301 : 302, targetUrl);
    } catch (err: any) {
      console.error("[StorageProxy] failed:", err?.message ?? err);
      res.status(502).send("Storage proxy error");
    }
  });
}

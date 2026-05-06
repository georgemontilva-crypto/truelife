// seed-banners-categories.mjs
// Inserts 3 hero banners and updates category images in the DB
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ── 1. Insert banners ──────────────────────────────────────────────────────
const banners = [
  {
    title: "Premium THCA Flower",
    subtitle: "Pharmaceutical-grade hemp-derived products. Lab-tested for purity, potency, and compliance.",
    imageUrl: "/manus-storage/banner1-cannabis-bud_b82f9e57.jpg",
    imageKey: "banner1-cannabis-bud_b82f9e57.jpg",
    linkUrl: "/catalog",
    linkText: "Shop Now",
    sortOrder: 1,
    isActive: 1,
  },
  {
    title: "Dark & Potent",
    subtitle: "Federally compliant hemp products crafted for those who demand the best.",
    imageUrl: "/manus-storage/banner2-cannabis-dark_1f0b32b8.jpg",
    imageKey: "banner2-cannabis-dark_1f0b32b8.jpg",
    linkUrl: "/catalog",
    linkText: "Explore Products",
    sortOrder: 2,
    isActive: 1,
  },
  {
    title: "Pure Hemp. Pure Science.",
    subtitle: "Every batch third-party tested. ≤0.3% Δ9THC. FDA compliant.",
    imageUrl: "/manus-storage/banner3-hemp-smoke_052f03d1.jpg",
    imageKey: "banner3-hemp-smoke_052f03d1.jpg",
    linkUrl: "/catalog?category=",
    linkText: "View Catalog",
    sortOrder: 3,
    isActive: 1,
  },
];

// Delete existing banners first
await db.execute("DELETE FROM banners");
console.log("Cleared existing banners");

for (const b of banners) {
  await db.execute(
    `INSERT INTO banners (title, subtitle, imageUrl, imageKey, linkUrl, linkText, sortOrder, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [b.title, b.subtitle, b.imageUrl, b.imageKey, b.linkUrl, b.linkText, b.sortOrder, b.isActive]
  );
  console.log(`✓ Banner: ${b.title}`);
}

// ── 2. Update category images ──────────────────────────────────────────────
const categoryImages = [
  { slug: "devices",       imageUrl: "/manus-storage/cat-devices_60534ed5.jpg",    imageKey: "cat-devices_60534ed5.jpg" },
  { slug: "cartridges",    imageUrl: "/manus-storage/cat-cartridges_c979d8ef.jpg", imageKey: "cat-cartridges_c979d8ef.jpg" },
  { slug: "gummies",       imageUrl: "/manus-storage/cat-gummies_d8f1f496.jpg",    imageKey: "cat-gummies_d8f1f496.jpg" },
  { slug: "disposables",   imageUrl: "/manus-storage/cat-disposables_9d0f2ed0.jpg",imageKey: "cat-disposables_9d0f2ed0.jpg" },
  { slug: "thca-flower",   imageUrl: "/manus-storage/cat-thca-flower_6a5e2f25.png",imageKey: "cat-thca-flower_6a5e2f25.png" },
];

for (const c of categoryImages) {
  const [result] = await db.execute(
    "UPDATE categories SET imageUrl = ?, imageKey = ?, updatedAt = NOW() WHERE slug = ?",
    [c.imageUrl, c.imageKey, c.slug]
  );
  const r = result;
  console.log(`✓ Category ${c.slug}: ${r.affectedRows} row(s) updated`);
}

await db.end();
console.log("\n✅ Seed complete!");

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import tables
const { mysqlTable, int, varchar, text, boolean, timestamp, mysqlEnum, decimal, json } = await import("drizzle-orm/mysql-core");

// Recreate table references inline for the seed
const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  inventory: int("inventory").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  variants: json("variants"),
  thcContent: varchar("thcContent", { length: 64 }),
  cbdContent: varchar("cbdContent", { length: 64 }),
  weight: varchar("weight", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

console.log("🌱 Seeding database...");

// Insert categories
const categoryData = [
  { name: "Devices", slug: "devices", description: "Premium vaporizers and hardware devices", sortOrder: 1 },
  { name: "Cartridges", slug: "cartridges", description: "High-quality hemp-derived cartridges", sortOrder: 2 },
  { name: "Gummies", slug: "gummies", description: "Delicious hemp-infused edibles", sortOrder: 3 },
  { name: "Disposables", slug: "disposables", description: "Convenient all-in-one disposable vapes", sortOrder: 4 },
  { name: "THCA Flower", slug: "thca-flower", description: "Premium THCA hemp flower", sortOrder: 5 },
];

console.log("Inserting categories...");
for (const cat of categoryData) {
  await db.insert(categories).values(cat).onDuplicateKeyUpdate({ set: { name: cat.name } });
}

// Fetch inserted categories
const insertedCats = await db.select().from(categories);
const catMap = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));
console.log("Categories:", catMap);

// Insert products
const productData = [
  // Devices
  { categoryId: catMap["devices"], name: "Delta Pro 510 Battery", slug: "delta-pro-510-battery", description: "Variable voltage 510-thread battery with preheat function. Compatible with all standard cartridges.", price: "29.99", compareAtPrice: "39.99", inventory: 50, isActive: true, isFeatured: true, thcContent: "N/A", weight: "45g", variants: [{ label: "Color", options: ["Black", "Silver", "Rose Gold"] }] },
  { categoryId: catMap["devices"], name: "ChronicHemp Vape Kit", slug: "chronichermp-vape-kit", description: "Complete starter kit with battery, charger and carrying case.", price: "49.99", compareAtPrice: "69.99", inventory: 30, isActive: true, isFeatured: false, weight: "120g", variants: [{ label: "Color", options: ["Matte Black", "White"] }] },
  // Cartridges
  { categoryId: catMap["cartridges"], name: "Delta 8 Cartridge 1g", slug: "delta-8-cartridge-1g", description: "Premium Delta 8 THC cartridge, lab-tested for purity and potency. 1 gram of pure distillate.", price: "34.99", compareAtPrice: "44.99", inventory: 100, isActive: true, isFeatured: true, thcContent: "≤0.3% Δ9THC", cbdContent: "Delta 8 THC", weight: "1g", variants: [{ label: "Flavor", options: ["Strawberry Cough", "Blue Dream", "OG Kush", "Pineapple Express"] }] },
  { categoryId: catMap["cartridges"], name: "HHC Cartridge 1g", slug: "hhc-cartridge-1g", description: "Hexahydrocannabinol (HHC) cartridge. Smooth, potent and lab-verified.", price: "39.99", inventory: 80, isActive: true, isFeatured: false, thcContent: "≤0.3% Δ9THC", weight: "1g", variants: [{ label: "Flavor", options: ["Watermelon", "Mango Kush", "Grape Ape"] }] },
  { categoryId: catMap["cartridges"], name: "THCO Cartridge 1g", slug: "thco-cartridge-1g", description: "THC-O acetate cartridge. Triple the potency of standard Delta 9.", price: "44.99", compareAtPrice: "54.99", inventory: 60, isActive: true, isFeatured: true, thcContent: "≤0.3% Δ9THC", weight: "1g", variants: [{ label: "Flavor", options: ["Gelato", "Zkittlez", "Wedding Cake"] }] },
  // Gummies
  { categoryId: catMap["gummies"], name: "Delta 9 Gummies 10mg", slug: "delta-9-gummies-10mg", description: "Federally compliant Delta 9 THC gummies. 10mg per piece, 20 pieces per pack.", price: "29.99", compareAtPrice: "39.99", inventory: 200, isActive: true, isFeatured: true, thcContent: "10mg Δ9THC per piece", cbdContent: "5mg CBD per piece", weight: "100g", variants: [{ label: "Flavor", options: ["Mixed Berry", "Watermelon", "Mango", "Peach"] }] },
  { categoryId: catMap["gummies"], name: "CBD Sleep Gummies 25mg", slug: "cbd-sleep-gummies-25mg", description: "Broad-spectrum CBD gummies with melatonin for restful sleep. 25mg CBD per piece.", price: "34.99", inventory: 150, isActive: true, isFeatured: false, cbdContent: "25mg CBD per piece", weight: "120g", variants: [{ label: "Flavor", options: ["Lavender Honey", "Chamomile Mint"] }] },
  { categoryId: catMap["gummies"], name: "HHC Gummies 25mg", slug: "hhc-gummies-25mg", description: "Premium HHC gummies, 25mg per piece. Lab-tested and federally compliant.", price: "39.99", compareAtPrice: "49.99", inventory: 120, isActive: true, isFeatured: false, thcContent: "≤0.3% Δ9THC", weight: "100g", variants: [{ label: "Flavor", options: ["Tropical", "Sour Apple", "Grape"] }] },
  // Disposables
  { categoryId: catMap["disposables"], name: "Delta 8 Disposable 2g", slug: "delta-8-disposable-2g", description: "All-in-one Delta 8 disposable vape pen. 2 grams of premium distillate, no charging needed.", price: "39.99", compareAtPrice: "49.99", inventory: 75, isActive: true, isFeatured: true, thcContent: "≤0.3% Δ9THC", weight: "2g", variants: [{ label: "Flavor", options: ["Blue Razz", "Watermelon Ice", "Strawberry Banana", "Pineapple OG"] }] },
  { categoryId: catMap["disposables"], name: "HHC Disposable 2g", slug: "hhc-disposable-2g", description: "Rechargeable HHC disposable with USB-C charging. 2g capacity.", price: "44.99", inventory: 60, isActive: true, isFeatured: false, thcContent: "≤0.3% Δ9THC", weight: "2g", variants: [{ label: "Flavor", options: ["Mango Tango", "Lemon Haze", "Berry Blast"] }] },
  { categoryId: catMap["disposables"], name: "Live Resin Disposable 1g", slug: "live-resin-disposable-1g", description: "Premium live resin extract disposable. Full-spectrum terpene profile.", price: "54.99", compareAtPrice: "64.99", inventory: 40, isActive: true, isFeatured: true, thcContent: "≤0.3% Δ9THC", weight: "1g", variants: [{ label: "Strain", options: ["Sour Diesel", "GSC", "Northern Lights"] }] },
  // THCA Flower
  { categoryId: catMap["thca-flower"], name: "THCA Flower - Indoor 3.5g", slug: "thca-flower-indoor-3-5g", description: "Premium indoor-grown THCA hemp flower. Lab-tested, federally compliant.", price: "49.99", compareAtPrice: "59.99", inventory: 50, isActive: true, isFeatured: true, thcContent: "≤0.3% Δ9THC", cbdContent: "THCA Rich", weight: "3.5g", variants: [{ label: "Strain", options: ["Biscotti", "Runtz", "Gelato 41", "Mac 1"] }] },
  { categoryId: catMap["thca-flower"], name: "THCA Flower - Outdoor 7g", slug: "thca-flower-outdoor-7g", description: "Sun-grown THCA hemp flower. Rich terpene profile, smooth smoke.", price: "59.99", inventory: 35, isActive: true, isFeatured: false, thcContent: "≤0.3% Δ9THC", weight: "7g", variants: [{ label: "Strain", options: ["Sour Space Candy", "Hawaiian Haze", "Special Sauce"] }] },
  { categoryId: catMap["thca-flower"], name: "THCA Pre-Rolls 5-Pack", slug: "thca-pre-rolls-5-pack", description: "Premium THCA hemp pre-rolls. 5 x 1g joints, ready to smoke.", price: "44.99", compareAtPrice: "54.99", inventory: 80, isActive: true, isFeatured: false, thcContent: "≤0.3% Δ9THC", weight: "5g", variants: [{ label: "Strain", options: ["Mixed", "Indica Blend", "Sativa Blend"] }] },
];

console.log("Inserting products...");
for (const prod of productData) {
  if (!prod.categoryId) { console.warn(`Skipping ${prod.name}: category not found`); continue; }
  await db.insert(products).values(prod).onDuplicateKeyUpdate({ set: { name: prod.name } });
}

console.log("✅ Seed complete!");
await connection.end();

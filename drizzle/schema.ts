import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Auth propia
  passwordHash: varchar("passwordHash", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 8 }),
  emailVerifyExpiry: timestamp("emailVerifyExpiry"),
  // Reset de contraseña
  resetToken: varchar("resetToken", { length: 64 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  // Perfil
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  inventory: int("inventory").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  thcContent: varchar("thcContent", { length: 32 }),
  cbdContent: varchar("cbdContent", { length: 32 }),
  weight: varchar("weight", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Addresses ────────────────────────────────────────────────────────────────
export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  line1: varchar("line1", { length: 256 }).notNull(),
  line2: varchar("line2", { length: 256 }),
  city: varchar("city", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  country: varchar("country", { length: 64 }).default("US").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cart = typeof carts.$inferSelect;

export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  selectedVariants: json("selectedVariants").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  // Snapshot of shipping address at time of order
  shippingAddress: json("shippingAddress").$type<{
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(),
  productImageUrl: text("productImageUrl"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  selectedVariants: json("selectedVariants").$type<Record<string, string>>(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Product Variants (con precio propio) ─────────────────────────────────────
// Cada variante es una opción concreta: "Strawberry 3.5g", "Mango 7g", etc.
export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),       // "Strawberry 3.5g"
  sku: varchar("sku", { length: 128 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  inventory: int("inventory").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

// ─── Product Attributes (características personalizadas) ──────────────────────
// key-value: "Ingrediente Activo" => "Delta 8 THC", "Sabor" => "Fresa", etc.
export const productAttributes = mysqlTable("product_attributes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  key: varchar("key", { length: 128 }).notNull(),
  value: varchar("value", { length: 512 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});
export type ProductAttribute = typeof productAttributes.$inferSelect;

// ─── Lab Reports ──────────────────────────────────────────────────────────────
// Reporte de laboratorio: puede estar vinculado a un producto o a una variante
export const labReports = mysqlTable("lab_reports", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  category: varchar("category", { length: 128 }),
  variantId: int("variantId"),
  variantName: varchar("variantName", { length: 256 }),
  reportName: varchar("reportName", { length: 256 }).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  externalUrl: text("externalUrl"),
  batchNumber: varchar("batchNumber", { length: 128 }),
  title: varchar("title", { length: 255 }),
  testedAt: timestamp("testedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

// ─── Banners (Hero Slider + Site Images) ─────────────────────────────────────
// slot = NULL → hero slider banner; slot = 'about_us' | 'trust_*' | 'logo_*' | 'press_*' → static site image
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  slot: varchar("slot", { length: 64 }),
  title: varchar("title", { length: 256 }),
  subtitle: text("subtitle"),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey"),
  linkUrl: varchar("linkUrl", { length: 512 }),
  linkText: varchar("linkText", { length: 128 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;

// ─── Wishlist (Favoritos) ─────────────────────────────────────────────────────
export const wishlist = mysqlTable("wishlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WishlistItem = typeof wishlist.$inferSelect;

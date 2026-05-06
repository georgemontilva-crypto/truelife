import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  addresses,
  banners,
  cartItems,
  carts,
  categories,
  labReports,
  orderItems,
  orders,
  productAttributes,
  productVariants,
  products,
  users,
  wishlist,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imageKey?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(categories).values(data);
  return result[0];
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; slug: string; description: string; imageUrl: string; imageKey: string; sortOrder: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Banners ─────────────────────────────────────────────────────────────────────────────
export async function getBanners(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(banners).where(eq(banners.isActive, true)).orderBy(banners.sortOrder);
  }
  return db.select().from(banners).orderBy(banners.sortOrder);
}
export async function getBannerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  return result[0];
}
export async function createBanner(data: {
  imageUrl: string;
  imageKey?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  linkText?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(banners).values(data);
  return result[0];
}
export async function updateBanner(
  id: number,
  data: Partial<{ title: string; subtitle: string; imageUrl: string; imageKey: string; linkUrl: string; linkText: string; sortOrder: number; isActive: boolean }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(banners).set(data).where(eq(banners.id, id));
}
export async function deleteBanner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(banners).where(eq(banners.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(opts?: { categoryId?: number; activeOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
  if (opts?.activeOnly) conditions.push(eq(products.isActive, true));
  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(products.name);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
    .limit(8);
}

export async function createProduct(data: {
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  imageKey?: string;
  variants?: { label: string; options: string[] }[];
  inventory?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  thcContent?: string;
  cbdContent?: string;
  weight?: string;
  labReportUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(products).values(data);
}

export async function updateProduct(
  id: number,
  data: Partial<{
    categoryId: number;
    name: string;
    slug: string;
    description: string;
    price: string;
    compareAtPrice: string;
    imageUrl: string;
    imageKey: string;
    variants: { label: string; options: string[] }[];
    inventory: number;
    isActive: boolean;
    isFeatured: boolean;
    thcContent: string;
    cbdContent: string;
    weight: string;
    labReportUrl: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(products).where(eq(products.id, id));
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export async function getOrCreateCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  if (!cart) {
    await db.insert(carts).values({ userId });
    cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  }
  return cart!;
}

export async function getCartWithItems(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  if (!cart) return null;
  const items = await db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      selectedVariants: cartItems.selectedVariants,
      productName: products.name,
      productPrice: products.price,
      productImageUrl: products.imageUrl,
      productSlug: products.slug,
      productInventory: products.inventory,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));
  return { ...cart, items };
}

export async function addToCart(
  userId: number,
  productId: number,
  quantity: number,
  selectedVariants?: Record<string, string>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const cart = await getOrCreateCart(userId);
  const existing = (
    await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1)
  )[0];
  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity, selectedVariants: selectedVariants ?? existing.selectedVariants })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, productId, quantity, selectedVariants });
  }
}

export async function updateCartItem(cartItemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  }
}

export async function removeFromCart(cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const cart = (await db.select().from(carts).where(eq(carts.userId, userId)).limit(1))[0];
  if (cart) await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
}

// ─── Addresses ────────────────────────────────────────────────────────────────
export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault));
}

export async function createAddress(data: {
  userId: number;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, data.userId));
  }
  await db.insert(addresses).values(data);
}

export async function deleteAddress(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(data: {
  userId: number;
  subtotal: string;
  shippingCost: string;
  total: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
  items: {
    productId: number;
    productName: string;
    productImageUrl?: string;
    price: string;
    quantity: number;
    selectedVariants?: Record<string, string>;
  }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(orders).values({
    userId: data.userId,
    subtotal: data.subtotal,
    shippingCost: data.shippingCost,
    total: data.total,
    shippingAddress: data.shippingAddress,
    notes: data.notes,
  });
  const order = (
    await db
      .select()
      .from(orders)
      .where(eq(orders.userId, data.userId))
      .orderBy(desc(orders.createdAt))
      .limit(1)
  )[0]!;
  await db.insert(orderItems).values(
    data.items.map((item) => ({ ...item, orderId: order.id }))
  );
  return order;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  const result = [];
  for (const order of userOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items });
  }
  return result;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  const allOrders = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      subtotal: orders.subtotal,
      shippingCost: orders.shippingCost,
      total: orders.total,
      shippingAddress: orders.shippingAddress,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));
  return allOrders;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const order = (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
  if (!order) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getOrderStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: "0", pendingOrders: 0, totalUsers: 0, totalProducts: 0 };
  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<string>`COALESCE(SUM(total), 0)`,
      pendingOrders: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    })
    .from(orders);
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [productCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(products);
  return {
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    totalRevenue: String(orderStats?.totalRevenue ?? "0"),
    pendingOrders: Number(orderStats?.pendingOrders ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    totalProducts: Number(productCount?.count ?? 0),
  };
}

// ─── Product Variants ─────────────────────────────────────────────────────────
export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sortOrder);
}

export async function createProductVariant(data: {
  productId: number;
  name: string;
  sku?: string;
  price: string;
  compareAtPrice?: string;
  inventory?: number;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(productVariants).values({
    ...data,
    inventory: data.inventory ?? 0,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
  });
  return { id: (result as any).insertId as number };
}

export async function updateProductVariant(
  id: number,
  data: Partial<{
    name: string;
    sku: string;
    price: string;
    compareAtPrice: string;
    inventory: number;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(productVariants).set(data).where(eq(productVariants.id, id));
}

export async function deleteProductVariant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(productVariants).where(eq(productVariants.id, id));
}

export async function deleteProductVariantsByProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
}

// ─── Product Attributes ───────────────────────────────────────────────────────
export async function getProductAttributes(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, productId))
    .orderBy(productAttributes.sortOrder);
}

export async function setProductAttributes(
  productId: number,
  attrs: { key: string; value: string; sortOrder?: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Replace all attributes for this product
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  if (attrs.length > 0) {
    await db.insert(productAttributes).values(
      attrs.map((a, i) => ({ productId, key: a.key, value: a.value, sortOrder: a.sortOrder ?? i }))
    );
  }
}

// ─── Lab Reports ─────────────────────────────────────────────────────────────
export async function getLabReports(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(labReports)
    .where(eq(labReports.productId, productId))
    .orderBy(labReports.createdAt);
}

export async function createLabReport(data: {
  productId: number;
  variantId?: number;
  variantName?: string;
  reportName: string;
  fileUrl: string;
  fileKey?: string;
  batchNumber?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(labReports).values(data);
  return { id: (result as any).insertId as number };
}

export async function deleteLabReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(labReports).where(eq(labReports.id, id));
}

export async function deleteLabReportsByProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(labReports).where(eq(labReports.productId, productId));
}

// ─── Auth propia (email/password) ─────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function createLocalUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  emailVerifyToken: string;
  emailVerifyExpiry: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(users).values({
    ...data,
    openId: null as any,
    loginMethod: "email",
    emailVerified: false,
    lastSignedIn: new Date(),
  });
  return { id: (result as any).insertId as number };
}

export async function verifyUserEmail(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({
    emailVerified: true,
    emailVerifyToken: null,
    emailVerifyExpiry: null,
    lastSignedIn: new Date(),
  }).where(eq(users.id, userId));
}

export async function setEmailVerifyToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ emailVerifyToken: token, emailVerifyExpiry: expiry }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export async function getWishlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wishlist).where(eq(wishlist.userId, userId)).orderBy(desc(wishlist.createdAt));
}

export async function addToWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Ignore duplicate
  try {
    await db.insert(wishlist).values({ userId, productId });
  } catch {
    // already exists
  }
}

export async function removeFromWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
}

export async function isInWishlist(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId))).limit(1);
  return result.length > 0;
}

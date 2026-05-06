import { randomInt } from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addToCart,
  clearCart,
  createAddress,
  createCategory,
  createOrder,
  createProduct,
  deleteAddress,
  deleteCategory,
  deleteProduct,
  getAllOrders,
  getAllUsers,
  getCartWithItems,
  getCategories,
  getCategoryById,
  getFeaturedProducts,
  getOrderById,
  getOrderStats,
  getProductById,
  getProducts,
  getUserAddresses,
  getUserByOpenId,
  getUserOrders,
  removeFromCart,
  updateCartItem,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateUserRole,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getProductAttributes,
  setProductAttributes,
  getLabReports,
  createLabReport,
  deleteLabReport,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getSiteImages,
  upsertSiteImage,
  deleteSiteImage,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import { sendVerificationEmail } from "./_core/email";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  getUserById,
  createLocalUser,
  verifyUserEmail,
  setEmailVerifyToken,
  updateUserProfile,
  updateUserPassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "./db";

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        const passwordHash = await bcrypt.hash(input.password, 12);
        const code = randomInt(100000, 1000000).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        const { id } = await createLocalUser({
          name: input.name,
          email: input.email,
          passwordHash,
          emailVerifyToken: code,
          emailVerifyExpiry: expiry,
        });
        await sendVerificationEmail(input.email, input.name, code);
        return { userId: id, email: input.email };
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (user.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already verified" });
        if (!user.emailVerifyToken || user.emailVerifyToken !== input.code) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code" });
        }
        if (user.emailVerifyExpiry && new Date() > user.emailVerifyExpiry) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code expired. Please request a new one." });
        }
        await verifyUserEmail(user.id);
        // Auto-login after verification
        const token = await sdk.createLocalSessionToken(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true };
      }),

    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (user.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already verified" });
        const code = randomInt(100000, 1000000).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await setEmailVerifyToken(user.id, code, expiry);
        await sendVerificationEmail(input.email, user.name || "there", code);
        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        if (!user.emailVerified) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email before signing in" });
        }
        const token = await sdk.createLocalSessionToken(user.id);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set for this account" });
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        const hash = await bcrypt.hash(input.newPassword, 12);
        await updateUserPassword(ctx.user.id, hash);
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getCategories()),

     create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          sortOrder: z.number().optional(),
          imageBase64: z.string().optional(),
          imageFilename: z.string().optional(),
          imageContentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (input.imageBase64 && input.imageFilename) {
          const buffer = Buffer.from(input.imageBase64, "base64");
          const key = `categories/${Date.now()}-${input.imageFilename}`;
          const result = await storagePut(key, buffer, input.imageContentType || "image/jpeg");
          imageUrl = result.url;
          imageKey = key;
        }
        return createCategory({
          name: input.name,
          slug: input.slug,
          description: input.description,
          sortOrder: input.sortOrder,
          imageUrl,
          imageKey,
        });
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          sortOrder: z.number().optional(),
          imageBase64: z.string().optional(),
          imageFilename: z.string().optional(),
          imageContentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, imageBase64, imageFilename, imageContentType, ...rest } = input;
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (imageBase64 && imageFilename) {
          const buffer = Buffer.from(imageBase64, "base64");
          const key = `categories/${Date.now()}-${imageFilename}`;
          const result = await storagePut(key, buffer, imageContentType || "image/jpeg");
          imageUrl = result.url;
          imageKey = key;
        }
        return updateCategory(id, { ...rest, ...(imageUrl ? { imageUrl, imageKey } : {}) });
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCategory(input.id)),
  }),

  // ─── Products ───────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(({ input }) => getProducts({ categoryId: input?.categoryId, activeOnly: true })),

    listAdmin: adminProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(({ input }) => getProducts({ categoryId: input?.categoryId })),

    featured: publicProcedure.query(() => getFeaturedProducts()),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProductById(input.id)),

    create: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          price: z.coerce.number(),
          compareAtPrice: z.coerce.number().optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          inventory: z.number().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          thcContent: z.string().optional(),
          cbdContent: z.string().optional(),
          weight: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        console.log("INPUT_KEYS:", Object.keys(input).join(","));
        console.log("INPUT_VALS:", Object.values(input).map(v => typeof v + ":" + String(v).slice(0,20)).join(" | "));
        return createProduct(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          compareAtPrice: z.string().optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          inventory: z.number().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          thcContent: z.string().optional(),
          cbdContent: z.string().optional(),
          weight: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateProduct(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteProduct(input.id)),

    uploadImage: adminProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          base64: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `Products/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  // ─── Cart ────────────────────────────────────────────────────────────────────
  cart: router({
    get: protectedProcedure.query(({ ctx }) => getCartWithItems(ctx.user.id)),

    add: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1).default(1),
          selectedVariants: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        addToCart(ctx.user.id, input.productId, input.quantity, input.selectedVariants)
      ),

    update: protectedProcedure
      .input(z.object({ cartItemId: z.number(), quantity: z.number().min(0) }))
      .mutation(({ input }) => updateCartItem(input.cartItemId, input.quantity)),

    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(({ input }) => removeFromCart(input.cartItemId)),

    clear: protectedProcedure.mutation(({ ctx }) => clearCart(ctx.user.id)),
  }),

  // ─── Addresses ───────────────────────────────────────────────────────────────
  addresses: router({
    list: protectedProcedure.query(({ ctx }) => getUserAddresses(ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          line1: z.string().min(1),
          line2: z.string().optional(),
          city: z.string().min(1),
          state: z.string().min(1),
          zip: z.string().min(1),
          country: z.string().default("US"),
          isDefault: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) => createAddress({ ...input, userId: ctx.user.id })),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => deleteAddress(input.id, ctx.user.id)),
  }),

  // ─── Orders ──────────────────────────────────────────────────────────────────
  orders: router({
    myOrders: protectedProcedure.query(({ ctx }) => getUserOrders(ctx.user.id)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return order;
      }),

    place: protectedProcedure
      .input(
        z.object({
          shippingAddress: z.object({
            fullName: z.string(),
            line1: z.string(),
            line2: z.string().optional(),
            city: z.string(),
            state: z.string(),
            zip: z.string(),
            country: z.string().default("US"),
          }),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cartData = await getCartWithItems(ctx.user.id);
        if (!cartData || cartData.items.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
        }
        const subtotal = cartData.items.reduce(
          (sum, item) => sum + parseFloat(item.productPrice) * item.quantity,
          0
        );
        const shippingCost = subtotal >= 50 ? 0 : 9.99;
        const total = subtotal + shippingCost;

        const order = await createOrder({
          userId: ctx.user.id,
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          total: total.toFixed(2),
          shippingAddress: input.shippingAddress,
          notes: input.notes,
          items: cartData.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImageUrl: item.productImageUrl ?? undefined,
            price: item.productPrice,
            quantity: item.quantity,
            selectedVariants: (item.selectedVariants as Record<string, string>) ?? undefined,
          })),
        });

        await clearCart(ctx.user.id);

        // Notify owner
        await notifyOwner({
          title: `New Order #${order.id}`,
          content: `A new order has been placed by ${ctx.user.name ?? ctx.user.email ?? "a customer"} for $${total.toFixed(2)}.`,
        });

        return order;
      }),

    // Admin
    adminList: adminProcedure.query(() => getAllOrders()),

    adminUpdateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
        })
      )
      .mutation(({ input }) => updateOrderStatus(input.id, input.status)),
  }),

  // ─── Product Variants ────────────────────────────────────────────────────────
  productVariants: router({
    list: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => getProductVariants(input.productId)),
    create: adminProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().min(1),
        sku: z.string().optional(),
        price: z.string(),
        compareAtPrice: z.string().optional(),
        inventory: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
        imageBase64: z.string().optional(),
        imageFilename: z.string().optional(),
        imageContentType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { imageBase64, imageFilename, imageContentType, ...rest } = input;
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (imageBase64 && imageFilename) {
          const buffer = Buffer.from(imageBase64, "base64");
          const key = `Variants/${Date.now()}-${imageFilename}`;
          const result = await storagePut(key, buffer, imageContentType || "image/jpeg");
          imageUrl = result.url;
          imageKey = key;
        }
        return createProductVariant({ ...rest, imageUrl, imageKey });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        sku: z.string().optional(),
        price: z.string().optional(),
        compareAtPrice: z.string().optional(),
        inventory: z.number().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
        imageBase64: z.string().optional(),
        imageFilename: z.string().optional(),
        imageContentType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, imageBase64, imageFilename, imageContentType, ...rest } = input;
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (imageBase64 && imageFilename) {
          const buffer = Buffer.from(imageBase64, "base64");
          const key = `Variants/${Date.now()}-${imageFilename}`;
          const result = await storagePut(key, buffer, imageContentType || "image/jpeg");
          imageUrl = result.url;
          imageKey = key;
        }
        return updateProductVariant(id, { ...rest, ...(imageUrl ? { imageUrl, imageKey } : {}) });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteProductVariant(input.id)),
  }),
  // ─── Product Attributes ───────────────────────────────────────────────────────
  productAttributes: router({
    list: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => getProductAttributes(input.productId)),
    set: adminProcedure
      .input(z.object({
        productId: z.number(),
        attrs: z.array(z.object({ key: z.string(), value: z.string(), sortOrder: z.number().optional() })),
      }))
      .mutation(({ input }) => setProductAttributes(input.productId, input.attrs)),
  }),
  // ─── Lab Reports ─────────────────────────────────────────────────────────────
  labReports: router({
    list: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => getLabReports(input.productId)),
    uploadAndCreate: adminProcedure
      .input(z.object({
        productId: z.number(),
        variantId: z.number().optional(),
        variantName: z.string().optional(),
        reportName: z.string().min(1),
        batchNumber: z.string().optional(),
        filename: z.string(),
        contentType: z.string(),
        base64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `Lab Reports/${input.productId}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return createLabReport({
          productId: input.productId,
          variantId: input.variantId,
          variantName: input.variantName,
          reportName: input.reportName,
          fileUrl: url,
          fileKey: key,
          batchNumber: input.batchNumber,
        });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteLabReport(input.id)),
  }),
  // ─── Banners ──────────────────────────────────────────────────────────────────
  banners: router({
    list: publicProcedure.query(() => getBanners(true)),
    adminList: adminProcedure.query(() => getBanners(false)),
    create: adminProcedure
      .input(
        z.object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          linkUrl: z.string().optional(),
          linkText: z.string().optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
          imageBase64: z.string(),
          imageFilename: z.string(),
          imageContentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const key = `Banners/${Date.now()}-${input.imageFilename}`;
        const { url } = await storagePut(key, buffer, input.imageContentType || "image/jpeg");
        return createBanner({
          title: input.title,
          subtitle: input.subtitle,
          linkUrl: input.linkUrl,
          linkText: input.linkText,
          sortOrder: input.sortOrder,
          isActive: input.isActive ?? true,
          imageUrl: url,
          imageKey: key,
        });
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          linkUrl: z.string().optional(),
          linkText: z.string().optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
          imageBase64: z.string().optional(),
          imageFilename: z.string().optional(),
          imageContentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, imageBase64, imageFilename, imageContentType, ...rest } = input;
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        if (imageBase64 && imageFilename) {
          const buffer = Buffer.from(imageBase64, "base64");
          const key = `Banners/${Date.now()}-${imageFilename}`;
          const result = await storagePut(key, buffer, imageContentType || "image/jpeg");
          imageUrl = result.url;
          imageKey = key;
        }
        return updateBanner(id, { ...rest, ...(imageUrl ? { imageUrl, imageKey } : {}) });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteBanner(input.id)),
    siteImages: publicProcedure.query(() => getSiteImages()),
    upsertSiteImage: adminProcedure
      .input(z.object({
        slot: z.string().min(1),
        imageBase64: z.string(),
        imageFilename: z.string(),
        imageContentType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const key = `SiteImages/${input.slot}-${Date.now()}-${input.imageFilename}`;
        const { url } = await storagePut(key, buffer, input.imageContentType || "image/jpeg");
        await upsertSiteImage(input.slot, url, key);
        return { success: true };
      }),
    clearSiteImage: adminProcedure
      .input(z.object({ slot: z.string().min(1) }))
      .mutation(({ input }) => deleteSiteImage(input.slot)),
  }),
  // ─── Wishlist ─────────────────────────────────────────────────────────────────
  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await getWishlist(ctx.user.id);
      // Enrich with product data
      const productIds = items.map((i) => i.productId);
      if (productIds.length === 0) return [];
      const allProducts = await getProducts({ activeOnly: true });
      const productMap = new Map(allProducts.map((p) => [p.id, p]));
      return items.map((item) => ({
        ...item,
        product: productMap.get(item.productId) || null,
      })).filter((i) => i.product !== null);
    }),
    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await addToWishlist(ctx.user.id, input.productId);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await removeFromWishlist(ctx.user.id, input.productId);
        return { success: true };
      }),
    check: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input, ctx }) => {
        const inList = await isInWishlist(ctx.user.id, input.productId);
        return { inWishlist: inList };
      }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getOrderStats()),

    users: router({
      list: adminProcedure.query(() => getAllUsers()),
      updateRole: adminProcedure
        .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
        .mutation(({ input }) => updateUserRole(input.userId, input.role)),
    }),
  }),
});

export type AppRouter = typeof appRouter;

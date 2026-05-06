/**
 * Creates or updates the admin user in the production database.
 * Usage:
 *   DATABASE_URL="mysql://..." node create-admin.mjs
 *   DATABASE_URL="mysql://..." node create-admin.mjs --email=you@example.com --password=YourPass1!
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// ─── Parse optional CLI args ──────────────────────────────────────────────────
function getArg(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : fallback;
}

const EMAIL    = getArg("email",    "admin@chronichemp.com");
const PASSWORD = getArg("password", "Admin1234!");
const NAME     = getArg("name",     "Admin");

// ─── Validate ─────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set.");
  console.error('   Run: DATABASE_URL="mysql://..." node create-admin.mjs');
  process.exit(1);
}

if (PASSWORD.length < 8) {
  console.error("❌  Password must be at least 8 characters.");
  process.exit(1);
}

// ─── Inline table definition (mirrors drizzle/schema.ts) ─────────────────────
const { mysqlTable, int, varchar, text, boolean, timestamp, mysqlEnum } =
  await import("drizzle-orm/mysql-core");
const { eq } = await import("drizzle-orm");

const users = mysqlTable("users", {
  id:                 int("id").autoincrement().primaryKey(),
  openId:             varchar("openId",             { length: 64  }),
  name:               text("name"),
  email:              varchar("email",              { length: 320 }).unique(),
  loginMethod:        varchar("loginMethod",        { length: 64  }),
  role:               mysqlEnum("role",             ["user", "admin"]).default("user").notNull(),
  passwordHash:       varchar("passwordHash",       { length: 256 }),
  emailVerified:      boolean("emailVerified").default(false).notNull(),
  emailVerifyToken:   varchar("emailVerifyToken",   { length: 8   }),
  emailVerifyExpiry:  timestamp("emailVerifyExpiry"),
  resetToken:         varchar("resetToken",         { length: 64  }),
  resetTokenExpiry:   timestamp("resetTokenExpiry"),
  phone:              varchar("phone",              { length: 32  }),
  avatarUrl:          text("avatarUrl"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn:       timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Main ─────────────────────────────────────────────────────────────────────
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log(`\n🔑  Creating admin user...`);
console.log(`    Email : ${EMAIL}`);
console.log(`    Name  : ${NAME}`);
console.log(`    Role  : admin\n`);

const passwordHash = await bcrypt.hash(PASSWORD, 12);

// Check if user already exists
const existing = await db.select({ id: users.id, role: users.role })
  .from(users)
  .where(eq(users.email, EMAIL))
  .limit(1);

if (existing.length > 0) {
  const { id, role } = existing[0];
  console.log(`⚠️   User already exists (id=${id}, role=${role}). Updating to admin...`);
  await db.update(users)
    .set({
      role:          "admin",
      emailVerified: true,
      passwordHash,
      loginMethod:   "email",
      name:          NAME,
    })
    .where(eq(users.email, EMAIL));
  console.log(`✅  User updated to admin successfully (id=${id}).`);
} else {
  const [result] = await db.insert(users).values({
    email:         EMAIL,
    name:          NAME,
    passwordHash,
    role:          "admin",
    emailVerified: true,
    loginMethod:   "email",
    lastSignedIn:  new Date(),
  });
  const newId = result.insertId;
  console.log(`✅  Admin user created successfully (id=${newId}).`);
}

console.log(`\n   Login at /login with:`);
console.log(`   Email   : ${EMAIL}`);
console.log(`   Password: ${PASSWORD}\n`);

await connection.end();

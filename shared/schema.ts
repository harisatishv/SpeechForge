import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const authProviders = ["local", "google"] as const;
export const userRoles = ["user", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  provider: text("provider").notNull().default("local"),
  providerId: text("provider_id"),
  avatarUrl: text("avatar_url"),
  company: text("company"),
  role: text("role").$type<UserRole>().notNull().default("user"),
  createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name is required"),
  passwordHash: z.string().min(8).optional(),
  provider: z.enum(authProviders),
  providerId: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  company: z.string().max(120).optional(),
  role: z.enum(userRoles).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

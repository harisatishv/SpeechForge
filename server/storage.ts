import { eq } from "drizzle-orm";
import type { User, InsertUser } from "@shared/schema";
import { users } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  listUsers(): Promise<User[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: insertUser.email.toLowerCase(),
        name: insertUser.name,
        provider: insertUser.provider,
        passwordHash: insertUser.passwordHash,
        providerId: insertUser.providerId,
        avatarUrl: insertUser.avatarUrl,
        company: insertUser.company,
        role: insertUser.role ?? "user",
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const { id: _ignore, createdAt: _createdAt, ...rest } = data;
    const [user] = await db
      .update(users)
      .set(rest)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DbStorage();

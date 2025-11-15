import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import session from "express-session";
import memorystore from "memorystore";
import { z } from "zod";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import type { User, UserRole } from "@shared/schema";

const MemoryStore = memorystore(session);
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

type PublicUser = Omit<User, "passwordHash">;

const roleForEmail = (email: string): UserRole => (adminEmails.has(email.toLowerCase()) ? "admin" : "user");

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hashed = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hashed}`;
}

function verifyPassword(password: string, stored?: string | null) {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;

  const derived = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(derived, keyBuffer);
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function ensureRole(user: User, expectedRole: User["role"]) {
  if (user.role === expectedRole) {
    return user;
  }

  return await storage.updateUser(user.id, { role: expectedRole });
}

async function getSessionUser(req: Request) {
  if (!req.session.userId) return undefined;
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    delete req.session.userId;
    return undefined;
  }
  return user;
}

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "http://localhost:5000/auth/google/callback",
  };
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 * 24,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  const router = express.Router();
  router.use(express.json());

  router.get("/session", async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    res.json({ user: toPublicUser(user) });
  });

  router.post("/signup", async (req, res) => {
    try {
      const parsed = signupSchema.parse(req.body);
      const email = parsed.email.toLowerCase();

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const role = roleForEmail(email);
      const user = await storage.createUser({
        email,
        name: parsed.name.trim(),
        company: parsed.company?.trim(),
        provider: "local",
        passwordHash: hashPassword(parsed.password),
        role,
      });

      req.session.userId = user.id;
      await new Promise((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve(undefined))),
      );

      res.json({ user: toPublicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid input" });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const email = parsed.email.toLowerCase();

      let user = await storage.getUserByEmail(email);
      if (!user || user.provider !== "local" || !verifyPassword(parsed.password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const desiredRole = roleForEmail(email);
      user = await ensureRole(user, desiredRole);

      req.session.userId = user.id;
      await new Promise((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve(undefined))),
      );

      res.json({ user: toPublicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.issues[0]?.message ?? "Invalid input" });
      }
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  router.post("/logout", async (req, res) => {
    await new Promise<void>((resolve) => {
      req.session.destroy(() => resolve());
    });
    res.json({ message: "Logged out" });
  });

  router.get("/google", (req, res) => {
    const { clientId, redirectUri } = getGoogleConfig();
    if (!clientId) {
      return res.status(500).json({ message: "Google authentication is not configured" });
    }

    const state = randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const next = typeof req.query.next === "string" ? req.query.next : "/studio";
    req.session.nextPath = next;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
      access_type: "offline",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  router.get("/google/callback", async (req, res) => {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    if (!clientId || !clientSecret) {
      return res.redirect("/auth/login?error=google_config");
    }

    const { state, code } = req.query;
    if (!code) {
      return res.redirect("/auth/login?error=google_code");
    }

    if (!state || state !== req.session.oauthState) {
      return res.redirect("/auth/login?error=google_state");
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = (await tokenResponse.json()) as { access_token: string };
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch Google profile");
      }

      const profile = (await profileResponse.json()) as {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
      };

      const normalizedEmail = profile.email.toLowerCase();
      const existing = await storage.getUserByEmail(normalizedEmail);

      const desiredRole = roleForEmail(normalizedEmail);
      let user: User;
      if (existing) {
        user = await storage.updateUser(existing.id, {
          provider: "google",
          providerId: profile.sub,
          avatarUrl: profile.picture ?? existing.avatarUrl,
          name: profile.name ?? existing.name,
          role: desiredRole,
        });
      } else {
        user = await storage.createUser({
          email: normalizedEmail,
          name: profile.name ?? normalizedEmail,
          provider: "google",
          providerId: profile.sub,
          avatarUrl: profile.picture,
          role: desiredRole,
        });
      }

      req.session.userId = user.id;
      req.session.oauthState = undefined;
      const nextPath = req.session.nextPath ?? "/studio";
      req.session.nextPath = undefined;

      await new Promise((resolve, reject) =>
        req.session.save((err) => (err ? reject(err) : resolve(undefined))),
      );

      res.redirect(nextPath);
    } catch (error) {
      console.error("Google auth failed", error);
      res.redirect("/auth/login?error=google");
    }
  });

  app.use("/auth", router);

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    next();
  };

  const adminRouter = express.Router();
  adminRouter.use(requireAdmin);

  adminRouter.get("/profiles", async (_req, res) => {
    const profiles = await storage.listUsers();
    res.json({ users: profiles.map(toPublicUser) });
  });

  app.use("/admin", adminRouter);
}

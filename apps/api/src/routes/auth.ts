import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_ANON_KEY || ""
);

export const authRoutes = new Hono();

// ── Sign Up ───────────────────────────────────────────────────────

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(100).optional(),
});

authRoutes.post("/signup", zValidator("json", signUpSchema), async (c) => {
  const { email, password, displayName } = c.req.valid("json");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json(
    {
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at,
          }
        : null,
    },
    201
  );
});

// ── Sign In ───────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/signin", zValidator("json", signInSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
});

// ── Refresh Token ─────────────────────────────────────────────────

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

authRoutes.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({
    session: {
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
      expiresAt: data.session!.expires_at,
    },
  });
});

// ── Sign Out ──────────────────────────────────────────────────────

authRoutes.post("/signout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // Sign out is best-effort — even if it fails, the client should clear local tokens
    await supabase.auth.signOut();
  }

  return c.json({ success: true });
});

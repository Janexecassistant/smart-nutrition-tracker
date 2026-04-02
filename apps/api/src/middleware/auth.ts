import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
}

// Extend Hono's context variables
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_ANON_KEY || ""
);

/**
 * Auth middleware — extracts and validates the JWT from the Authorization header.
 * Sets `c.var.user` with the authenticated user's ID and email.
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", {
    id: user.id,
    email: user.email!,
  });

  await next();
});

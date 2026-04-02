import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { foodRoutes } from "./routes/foods";
import { logRoutes } from "./routes/logs";
import { weightRoutes } from "./routes/weight";
import { suggestionRoutes } from "./routes/suggestions";

const app = new Hono();

// ── Global middleware ─────────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow local dev origins + Expo Go on any LAN IP
      const allowed = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
      ];
      if (!origin) return allowed[0]; // same-origin requests
      if (allowed.includes(origin)) return origin;
      // Allow any 192.168.x.x or 10.x.x.x origin (Expo Go on LAN)
      if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return origin;
      return allowed[0];
    },
    credentials: true,
  })
);

// ── Health check ──────────────────────────────────────────────────

app.get("/", (c) =>
  c.json({
    name: "Smart Nutrition Tracker API",
    version: "0.0.1",
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

// ── Routes ────────────────────────────────────────────────────────

app.route("/api/auth", authRoutes);
app.route("/api/profile", profileRoutes);
app.route("/api/foods", foodRoutes);
app.route("/api/logs", logRoutes);
app.route("/api/weight", weightRoutes);
app.route("/api/suggestions", suggestionRoutes);

// ── 404 handler ───────────────────────────────────────────────────

app.notFound((c) =>
  c.json({ error: "Not found", path: c.req.path }, 404)
);

// ── Error handler ─────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);
  return c.json(
    {
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
});

// ── Start ─────────────────────────────────────────────────────────

const port = Number(process.env.API_PORT) || 3001;

console.log(`🚀 Smart Nutrition Tracker API running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

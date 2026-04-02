import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, gte } from "drizzle-orm";
import { db, weightLogs } from "@snt/db";
import { LogWeightSchema } from "@snt/shared";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

export const weightRoutes = new Hono();

weightRoutes.use("*", requireAuth);

// ── Log Weight ────────────────────────────────────────────────────

weightRoutes.post("/", zValidator("json", LogWeightSchema), async (c) => {
  const userId = c.var.user.id;
  const input = c.req.valid("json");

  const [entry] = await db
    .insert(weightLogs)
    .values({
      userId,
      logDate: input.date,
      weightKg: String(input.weightKg),
      notes: input.notes,
    })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.logDate],
      set: {
        weightKg: String(input.weightKg),
        notes: input.notes,
      },
    })
    .returning();

  return c.json({ entry }, 201);
});

// ── Get Weight History ────────────────────────────────────────────

weightRoutes.get(
  "/",
  zValidator(
    "query",
    z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
    })
  ),
  async (c) => {
    const userId = c.var.user.id;
    const { days } = c.req.valid("query");

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0]!;

    const entries = await db
      .select()
      .from(weightLogs)
      .where(
        and(eq(weightLogs.userId, userId), gte(weightLogs.logDate, sinceStr))
      )
      .orderBy(desc(weightLogs.logDate));

    return c.json({ entries, days });
  }
);

// ── Delete Weight Entry ───────────────────────────────────────────

weightRoutes.delete("/:id", async (c) => {
  const userId = c.var.user.id;
  const id = c.req.param("id");

  const deleted = await db
    .delete(weightLogs)
    .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, userId)))
    .returning();

  if (deleted.length === 0) {
    return c.json({ error: "Entry not found" }, 404);
  }

  return c.json({ success: true });
});

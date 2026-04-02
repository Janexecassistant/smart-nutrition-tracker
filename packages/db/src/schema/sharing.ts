import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Shares ────────────────────────────────────────────────────────

export const shares = pgTable(
  "shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull(),
    recipientEmail: text("recipient_email"),
    recipientId: uuid("recipient_id"),
    inviteToken: text("invite_token").notNull().unique(),
    status: text("status", {
      enum: ["pending", "active", "revoked"],
    }).default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_shares_owner").on(table.ownerId),
    index("idx_shares_recipient").on(table.recipientId),
    uniqueIndex("idx_shares_token").on(table.inviteToken),
  ]
);

// ── Share Grants ──────────────────────────────────────────────────

export const shareGrants = pgTable(
  "share_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shareId: uuid("share_id")
      .notNull()
      .references(() => shares.id, { onDelete: "cascade" }),
    dataType: text("data_type", {
      enum: ["diary", "weight", "measurements", "targets", "summary"],
    }).notNull(),
    permission: text("permission", { enum: ["view"] }).default("view"),
    dateRangeStart: date("date_range_start"),
    dateRangeEnd: date("date_range_end"),
    isOngoing: boolean("is_ongoing").default(true),
  },
  (table) => [index("idx_grants_share").on(table.shareId)]
);

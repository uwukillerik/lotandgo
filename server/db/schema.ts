import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const lotStatusEnum = pgEnum("lot_status", [
  "draft",
  "active",
  "ended",
  "sold",
]);

export const auctionStatusEnum = pgEnum("auction_status", [
  "scheduled",
  "active",
  "ended",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "outbid",
  "auction_start",
  "auction_end",
  "won",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lots = pgTable("lots", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: lotStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lotImages = pgTable("lot_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id")
    .notNull()
    .references(() => lots.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const auctions = pgTable("auctions", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id")
    .notNull()
    .references(() => lots.id, { onDelete: "cascade" })
    .unique(),
  startPrice: integer("start_price").notNull(),
  bidStep: integer("bid_step").notNull(),
  currentPrice: integer("current_price").notNull(),
  status: auctionStatusEnum("status").notNull().default("scheduled"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  winnerId: uuid("winner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bids = pgTable("bids", {
  id: uuid("id").primaryKey().defaultRandom(),
  auctionId: uuid("auction_id")
    .notNull()
    .references(() => auctions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  auctionId: uuid("auction_id")
    .notNull()
    .references(() => auctions.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  auctionId: uuid("auction_id")
    .notNull()
    .references(() => auctions.id, { onDelete: "cascade" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  lots: many(lots),
  bids: many(bids),
  notifications: many(notifications),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  seller: one(users, { fields: [lots.sellerId], references: [users.id] }),
  images: many(lotImages),
  auction: one(auctions, { fields: [lots.id], references: [auctions.lotId] }),
}));

export const lotImagesRelations = relations(lotImages, ({ one }) => ({
  lot: one(lots, { fields: [lotImages.lotId], references: [lots.id] }),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  lot: one(lots, { fields: [auctions.lotId], references: [lots.id] }),
  winner: one(users, { fields: [auctions.winnerId], references: [users.id] }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, { fields: [bids.auctionId], references: [auctions.id] }),
  user: one(users, { fields: [bids.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  auction: one(auctions, {
    fields: [notifications.auctionId],
    references: [auctions.id],
  }),
}));

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
  "message",
  "deal_update",
]);

export const dealStatusEnum = pgEnum("deal_status", [
  "none",
  "awaiting_payment",
  "paid",
  "shipped",
  "completed",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit",
  "withdraw",
  "purchase",
  "sale",
  "fee",
  "refund",
]);

export const promotionTierEnum = pgEnum("promotion_tier", [
  "boost",
  "featured",
  "premium",
]);

export const auctionTypeEnum = pgEnum("auction_type", [
  "fixed",
  "anti_snipe",
  "soft_close",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: userRoleEnum("role").notNull().default("user"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }),
  paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true }),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
  emailNotifications: boolean("email_notifications").notNull().default(true),
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
  auctionType: auctionTypeEnum("auction_type").notNull().default("anti_snipe"),
  holdDurationSeconds: integer("hold_duration_seconds").notNull().default(3600),
  leadingBidderId: uuid("leading_bidder_id").references(() => users.id),
  leadingSince: timestamp("leading_since", { withTimezone: true }),
  winnerId: uuid("winner_id").references(() => users.id),
  dealStatus: dealStatusEnum("deal_status").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auctionMessages = pgTable("auction_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  auctionId: uuid("auction_id")
    .notNull()
    .references(() => auctions.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
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

export const lotPromotions = pgTable("lot_promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  lotId: uuid("lot_id")
    .notNull()
    .references(() => lots.id, { onDelete: "cascade" }),
  tier: promotionTierEnum("tier").notNull(),
  priceRubles: integer("price_rubles").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wallets = pgTable("wallets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balanceKopecks: integer("balance_kopecks").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: walletTxTypeEnum("type").notNull(),
  amountKopecks: integer("amount_kopecks").notNull(),
  balanceAfterKopecks: integer("balance_after_kopecks").notNull(),
  description: text("description").notNull(),
  auctionId: uuid("auction_id").references(() => auctions.id, { onDelete: "set null" }),
  counterpartyUserId: uuid("counterparty_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const autoBids = pgTable(
  "auto_bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auctionId: uuid("auction_id")
      .notNull()
      .references(() => auctions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    maxAmount: integer("max_amount").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    auctionUserUnique: { columns: [t.auctionId, t.userId], isUnique: true },
  }),
);

export const sellerReviews = pgTable(
  "seller_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    auctionId: uuid("auction_id")
      .notNull()
      .references(() => auctions.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    auctionReviewerUnique: { columns: [t.auctionId, t.reviewerId], isUnique: true },
  }),
);

export const categorySubscriptions = pgTable(
  "category_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 100 }).notNull(),
    emailNotify: boolean("email_notify").notNull().default(true),
    pushNotify: boolean("push_notify").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userCategoryUnique: { columns: [t.userId, t.category], isUnique: true },
  }),
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  lots: many(lots),
  bids: many(bids),
  notifications: many(notifications),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, { fields: [walletTransactions.userId], references: [users.id] }),
  auction: one(auctions, {
    fields: [walletTransactions.auctionId],
    references: [auctions.id],
  }),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  seller: one(users, { fields: [lots.sellerId], references: [users.id] }),
  images: many(lotImages),
  auction: one(auctions, { fields: [lots.id], references: [auctions.lotId] }),
  promotions: many(lotPromotions),
}));

export const lotPromotionsRelations = relations(lotPromotions, ({ one }) => ({
  lot: one(lots, { fields: [lotPromotions.lotId], references: [lots.id] }),
}));

export const lotImagesRelations = relations(lotImages, ({ one }) => ({
  lot: one(lots, { fields: [lotImages.lotId], references: [lots.id] }),
}));

export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  lot: one(lots, { fields: [auctions.lotId], references: [lots.id] }),
  winner: one(users, { fields: [auctions.winnerId], references: [users.id] }),
  bids: many(bids),
  messages: many(auctionMessages),
}));

export const auctionMessagesRelations = relations(auctionMessages, ({ one }) => ({
  auction: one(auctions, {
    fields: [auctionMessages.auctionId],
    references: [auctions.id],
  }),
  sender: one(users, { fields: [auctionMessages.senderId], references: [users.id] }),
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

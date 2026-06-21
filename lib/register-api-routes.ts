import type { Express } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { wrapJson, wrapStream } from "./api-bridge";
import { uploadDir } from "./upload";

import * as health from "@/app/api/health/route";
import * as authLogin from "@/app/api/auth/login/route";
import * as authRegister from "@/app/api/auth/register/route";
import * as authLogout from "@/app/api/auth/logout/route";
import * as authRefresh from "@/app/api/auth/refresh/route";
import * as authMe from "@/app/api/auth/me/route";
import * as authAvatar from "@/app/api/auth/avatar/route";
import * as authChangePassword from "@/app/api/auth/change-password/route";
import * as auctions from "@/app/api/auctions/route";
import * as auctionById from "@/app/api/auctions/[id]/route";
import * as auctionBids from "@/app/api/auctions/[id]/bids/route";
import * as sellerContact from "@/app/api/auctions/[id]/seller-contact/route";
import * as auctionMessages from "@/app/api/auctions/[id]/messages/route";
import * as auctionDeal from "@/app/api/auctions/[id]/deal/route";
import * as lots from "@/app/api/lots/route";
import * as lotsMine from "@/app/api/lots/mine/route";
import * as lotPromote from "@/app/api/lots/[id]/promote/route";
import * as promotionPlans from "@/app/api/promotions/plans/route";
import * as bidsMine from "@/app/api/bids/mine/route";
import * as messageConversations from "@/app/api/messages/route";
import * as wallet from "@/app/api/wallet/route";
import * as walletDeposit from "@/app/api/wallet/deposit/route";
import * as walletWithdraw from "@/app/api/wallet/withdraw/route";
import * as notifications from "@/app/api/notifications/route";
import * as notificationsReadAll from "@/app/api/notifications/read-all/route";
import * as notificationRead from "@/app/api/notifications/[id]/read/route";
import * as paymentsStatus from "@/app/api/payments/status/route";
import * as paymentsSetup from "@/app/api/payments/setup-intent/route";
import * as paymentsConfirm from "@/app/api/payments/confirm/route";
import * as paymentsVerifyLocal from "@/app/api/payments/verify-local/route";
import * as paymentsWebhook from "@/app/api/payments/webhook/route";
import * as adminStats from "@/app/api/admin/stats/route";
import * as adminUsers from "@/app/api/admin/users/route";
import * as adminUserById from "@/app/api/admin/users/[id]/route";
import * as adminLots from "@/app/api/admin/lots/route";
import * as adminLotById from "@/app/api/admin/lots/[id]/route";
import * as adminAuctions from "@/app/api/admin/auctions/route";
import * as adminAuctionEnd from "@/app/api/admin/auctions/[id]/end/route";
import * as adminPayments from "@/app/api/admin/payments/route";
import * as adminEmailSend from "@/app/api/admin/email/send/route";
import * as adminExport from "@/app/api/admin/export/[type]/route";
import * as auctionAutoBid from "@/app/api/auctions/[id]/auto-bid/route";
import * as auctionSuggest from "@/app/api/auctions/suggest/route";
import * as categorySubscriptions from "@/app/api/category-subscriptions/route";
import * as reviews from "@/app/api/reviews/route";
import * as pushSubscribe from "@/app/api/push/subscribe/route";
import * as favoritesRoute from "@/app/api/favorites/route";
import * as publicStats from "@/app/api/stats/public/route";

export function registerApiRoutes(app: Express) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(path.resolve(uploadDir)));

  const api = express.Router();

  api.post("/auth/avatar", wrapStream(authAvatar.POST));
  api.post("/lots", wrapStream(lots.POST));

  api.use(express.json({ limit: "10mb" }));
  api.use(cookieParser());

  api.get("/stats/public", wrapJson(publicStats.GET));

  api.get("/favorites", wrapJson(favoritesRoute.GET));
  api.post("/favorites", wrapJson(favoritesRoute.POST));
  api.delete("/favorites", wrapJson(favoritesRoute.DELETE));

  api.get("/health", wrapJson(health.GET));
  api.post("/auth/login", wrapJson(authLogin.POST));
  api.post("/auth/register", wrapJson(authRegister.POST));
  api.post("/auth/logout", wrapJson(authLogout.POST));
  api.post("/auth/refresh", wrapJson(authRefresh.POST));
  api.get("/auth/me", wrapJson(authMe.GET));
  api.patch("/auth/me", wrapJson(authMe.PATCH));
  api.post("/auth/change-password", wrapJson(authChangePassword.POST));

  api.get("/auctions/suggest", wrapJson(auctionSuggest.GET));
  api.get("/auctions", wrapJson(auctions.GET));
  api.post("/auctions", wrapJson(auctions.POST));
  api.get("/auctions/:id", wrapJson(auctionById.GET));
  api.post("/auctions/:id/bids", wrapJson(auctionBids.POST));
  api.get("/auctions/:id/auto-bid", wrapJson(auctionAutoBid.GET));
  api.post("/auctions/:id/auto-bid", wrapJson(auctionAutoBid.POST));
  api.delete("/auctions/:id/auto-bid", wrapJson(auctionAutoBid.DELETE));
  api.get("/auctions/:id/seller-contact", wrapJson(sellerContact.GET));
  api.get("/auctions/:id/messages", wrapJson(auctionMessages.GET));
  api.post("/auctions/:id/messages", wrapJson(auctionMessages.POST));
  api.patch("/auctions/:id/deal", wrapJson(auctionDeal.PATCH));

  api.get("/lots/mine", wrapJson(lotsMine.GET));
  api.post("/lots/:id/promote", wrapJson(lotPromote.POST));
  api.get("/promotions/plans", wrapJson(promotionPlans.GET));
  api.get("/bids/mine", wrapJson(bidsMine.GET));
  api.get("/messages", wrapJson(messageConversations.GET));
  api.get("/wallet", wrapJson(wallet.GET));
  api.post("/wallet/deposit", wrapJson(walletDeposit.POST));
  api.post("/wallet/withdraw", wrapJson(walletWithdraw.POST));

  api.get("/notifications", wrapJson(notifications.GET));
  api.patch("/notifications/read-all", wrapJson(notificationsReadAll.PATCH));
  api.patch("/notifications/:id/read", wrapJson(notificationRead.PATCH));

  api.get("/payments/status", wrapJson(paymentsStatus.GET));
  api.post("/payments/setup-intent", wrapJson(paymentsSetup.POST));
  api.post("/payments/confirm", wrapJson(paymentsConfirm.POST));
  api.post("/payments/verify-local", wrapJson(paymentsVerifyLocal.POST));
  api.post("/payments/webhook", wrapJson(paymentsWebhook.POST));

  api.get("/admin/stats", wrapJson(adminStats.GET));
  api.get("/admin/users", wrapJson(adminUsers.GET));
  api.get("/admin/users/:id", wrapJson(adminUserById.GET));
  api.patch("/admin/users/:id", wrapJson(adminUserById.PATCH));
  api.get("/admin/lots", wrapJson(adminLots.GET));
  api.get("/admin/lots/:id", wrapJson(adminLotById.GET));
  api.patch("/admin/lots/:id", wrapJson(adminLotById.PATCH));
  api.delete("/admin/lots/:id", wrapJson(adminLotById.DELETE));
  api.get("/admin/auctions", wrapJson(adminAuctions.GET));
  api.post("/admin/auctions/:id/end", wrapJson(adminAuctionEnd.POST));
  api.get("/admin/payments", wrapJson(adminPayments.GET));
  api.get("/admin/email/send", wrapJson(adminEmailSend.GET));
  api.post("/admin/email/send", wrapJson(adminEmailSend.POST));
  api.put("/admin/email/send", wrapJson(adminEmailSend.PUT));
  api.get("/admin/export/:type", wrapJson(adminExport.GET, { type: ":type" }));

  api.get("/category-subscriptions", wrapJson(categorySubscriptions.GET));
  api.post("/category-subscriptions", wrapJson(categorySubscriptions.POST));
  api.get("/reviews", wrapJson(reviews.GET));
  api.post("/reviews", wrapJson(reviews.POST));
  api.get("/push/subscribe", wrapJson(pushSubscribe.GET));
  api.post("/push/subscribe", wrapJson(pushSubscribe.POST));
  api.delete("/push/subscribe", wrapJson(pushSubscribe.DELETE));

  app.use("/api", api);
}

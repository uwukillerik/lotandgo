import "@/app/globals.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Providers } from "@/components/providers";
import { ShellLayout } from "./ShellLayout";
import { ScrollToTop } from "./ScrollToTop";
import { AdminShell } from "@/components/admin-shell";
import { CookieConsent } from "@/components/cookie-consent";

import HomePage from "@/app/(main)/page";
import CatalogPage from "@/app/(main)/catalog/page";
import AuctionPage from "@/app/(main)/auction/[id]/page";
import AuthPage from "@/app/(main)/auth/page";
import LegalPage from "@/app/(main)/legal/[slug]/page";
import ProfilePage from "@/app/(app)/profile/page";
import ProfileBidsPage from "@/app/(app)/profile/bids/page";
import ProfileLotsPage from "@/app/(app)/profile/lots/page";
import ProfileSettingsPage from "@/app/(app)/profile/settings/page";
import ProfilePaymentsPage from "@/app/(app)/profile/payments/page";
import ProfileWalletPage from "@/app/(app)/profile/wallet/page";
import ProfilePromotePage from "@/app/(app)/profile/promote/page";
import SellPage from "@/app/(app)/sell/page";
import NotificationsPage from "@/app/(app)/notifications/page";
import MessagesPage from "@/app/(app)/messages/page";
import MessageThreadPage from "@/app/(app)/messages/[auctionId]/page";
import AdminPage from "@/app/(admin)/admin/page";
import AdminUsersPage from "@/app/(admin)/admin/users/page";
import AdminUserDetailPage from "@/app/(admin)/admin/users/[id]/page";
import AdminLotsPage from "@/app/(admin)/admin/lots/page";
import AdminLotDetailPage from "@/app/(admin)/admin/lots/[id]/page";
import AdminAuctionsPage from "@/app/(admin)/admin/auctions/page";
import AdminPaymentsPage from "@/app/(admin)/admin/payments/page";

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

const rootEl = document.getElementById("root")!;
type RootHolder = HTMLElement & { __lotgoRoot?: ReturnType<typeof createRoot> };
const holder = rootEl as RootHolder;
if (!holder.__lotgoRoot) {
  holder.__lotgoRoot = createRoot(rootEl);
}
holder.__lotgoRoot.render(
  <Providers>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CookieConsent />
      <ScrollToTop />
      <Routes>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/auction/:id" element={<AuctionPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/bids" element={<ProfileBidsPage />} />
          <Route path="/profile/lots" element={<ProfileLotsPage />} />
          <Route path="/profile/settings" element={<ProfileSettingsPage />} />
          <Route path="/profile/payments" element={<ProfilePaymentsPage />} />
          <Route path="/profile/wallet" element={<ProfileWalletPage />} />
          <Route path="/profile/promote" element={<ProfilePromotePage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:auctionId" element={<MessageThreadPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="lots" element={<AdminLotsPage />} />
          <Route path="lots/:id" element={<AdminLotDetailPage />} />
          <Route path="auctions" element={<AdminAuctionsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Providers>,
);

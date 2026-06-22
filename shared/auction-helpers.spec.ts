import { describe, it, expect } from "vitest";
import {
  isAuctionWinner,
  formatLotNumber,
  auctionStatusLabel,
  shouldExtendAuction,
  extendedEndsAt,
} from "./auction-helpers";

describe("isAuctionWinner", () => {
  it("returns true only when ended and isWinner", () => {
    expect(isAuctionWinner("ended", true)).toBe(true);
    expect(isAuctionWinner("active", true)).toBe(false);
    expect(isAuctionWinner("ended", false)).toBe(false);
  });
});

describe("formatLotNumber", () => {
  it("formats uuid prefix without dashes", () => {
    expect(formatLotNumber("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("A1B2C3D4");
  });
});

describe("auctionStatusLabel", () => {
  it("maps known statuses", () => {
    expect(auctionStatusLabel("active")).toBe("Live");
    expect(auctionStatusLabel("ended")).toBe("Завершён");
  });
});

describe("anti-snipe helpers", () => {
  it("extends when under 2 minutes remain", () => {
    const endsAt = new Date("2026-06-21T12:00:00Z");
    const now = new Date("2026-06-21T11:59:30Z");
    expect(shouldExtendAuction(endsAt, now)).toBe(true);
  });

  it("does not extend when more than 2 minutes remain", () => {
    const endsAt = new Date("2026-06-21T12:00:00Z");
    const now = new Date("2026-06-21T11:57:00Z");
    expect(shouldExtendAuction(endsAt, now)).toBe(false);
  });

  it("does not extend for fixed auction type", () => {
    const endsAt = new Date("2026-06-21T12:00:00Z");
    const now = new Date("2026-06-21T11:59:30Z");
    expect(shouldExtendAuction(endsAt, now, "fixed")).toBe(false);
  });
    const endsAt = new Date("2026-06-21T12:00:00Z");
    expect(extendedEndsAt(endsAt).toISOString()).toBe("2026-06-21T12:02:00.000Z");
  });
});

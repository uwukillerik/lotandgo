import { describe, it, expect } from "vitest";
import { formatPrice } from "./utils";

describe("formatPrice", () => {
  it("formats rubles with non-breaking space", () => {
    expect(formatPrice(1000)).toContain("₽");
    expect(formatPrice(1000)).toMatch(/1[\s\u00A0]000/);
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toContain("0");
  });
});

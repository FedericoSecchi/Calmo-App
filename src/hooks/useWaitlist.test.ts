import { describe, it, expect } from "vitest";
import { looksLikeBot, WAITLIST_MIN_FILL_MS } from "./useWaitlist";

describe("looksLikeBot (waitlist client-side filters)", () => {
  it("lets a person through: empty trap, ≥3 s after the form was shown", () => {
    expect(looksLikeBot({ trap: "", shownAt: 1000 }, 1000 + WAITLIST_MIN_FILL_MS)).toBe(false);
  });

  it("flags a filled trap field even after a long wait", () => {
    expect(looksLikeBot({ trap: "https://spam.example", shownAt: 0 }, 60_000)).toBe(true);
  });

  it("flags a submit faster than 3 s", () => {
    expect(looksLikeBot({ trap: "", shownAt: 1000 }, 1000 + WAITLIST_MIN_FILL_MS - 1)).toBe(true);
  });

  it("ignores whitespace-only trap values (autofill noise)", () => {
    expect(looksLikeBot({ trap: "  ", shownAt: 0 }, 10_000)).toBe(false);
  });
});

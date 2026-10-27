import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const tokens = readFileSync("apps/web/src/app/tokens.css", "utf8");
function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high! + 0.05) / (low! + 0.05);
}
describe("homepage palettes remain scoped and legible across all three existing themes", () => {
  for (const selector of [
    ".home-page",
    '[data-theme="broadcast-studio"] .home-page',
    '[data-theme="on-air-premium"] .home-page',
  ]) {
    it(`${selector} preserves AA text and control contrast`, () => {
      const block = tokens
        .slice(tokens.indexOf(selector + " {"))
        .split("}")[0]!;
      const colors = Object.fromEntries(
        [...block.matchAll(/--home-([a-z-]+):\s*(#[\da-f]{6});/g)].map((m) => [
          m[1]!,
          m[2]!,
        ]),
      );
      for (const text of ["ink", "muted", "lilac"])
        for (const surface of ["bg", "surface", "raised"])
          expect(
            contrast(colors[text]!, colors[surface]!),
            `${text} on ${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(colors.primary!, colors["on-primary"]!),
      ).toBeGreaterThanOrEqual(4.5);
      for (const surface of ["bg", "surface", "raised"])
        expect(
          contrast(colors["control-border"]!, colors[surface]!),
        ).toBeGreaterThanOrEqual(3);
    });
  }
});

import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  applicationDefaultTheme,
  historicalBroadcastTheme,
  officialThemes,
  themeIdSchema,
} from "@extension-twitch/contracts/themes";
const css = readFileSync("apps/web/src/app/tokens.css", "utf8");
function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((s) => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
export function ratio(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe("three official themes and explicit scopes", () => {
  it("validates official identifiers without accepting CSS, script or arbitrary themes", () => {
    expect(applicationDefaultTheme).toBe("broadcast-studio");
    expect(historicalBroadcastTheme).toBe("neon-show");
    expect(officialThemes).toHaveLength(3);
    for (const theme of officialThemes)
      expect(themeIdSchema.parse(theme.id)).toBe(theme.id);
    for (const bad of [
      "",
      null,
      "custom",
      "url(https://invalid.example)",
      { accent: "red" },
    ])
      expect(themeIdSchema.safeParse(bad).success).toBe(false);
  });
  for (const theme of officialThemes)
    it(`${theme.name} has measured AA text and readable semantic controls on all its surfaces`, () => {
      const block = css.match(
        new RegExp('\\[data-theme="' + theme.id + '"\\]\\s*\\{([^}]+)\\}'),
      )?.[1];
      expect(block).toBeTruthy();
      const colors = Object.fromEntries(
        Array.from(
          block!.matchAll(/--color-([a-z-]+):\s*(#[\da-f]{6});/g),
          (m) => [m[1]!, m[2]!],
        ),
      );
      for (const text of ["text-primary", "text-secondary", "text-muted"])
        for (const surface of [
          "background",
          "surface",
          "surface-secondary",
          "surface-raised",
          "input",
        ])
          expect(
            ratio(colors[text]!, colors[surface]!),
            `${text}/${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
      for (const [accent, subtle] of [
        ["action-primary", "primary-subtle"],
        ["success", "success-subtle"],
        ["warning", "warning-subtle"],
        ["danger", "danger-subtle"],
        ["info", "info-subtle"],
      ]) {
        expect(
          ratio(colors["on-accent"]!, colors[accent!]!),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          ratio(colors[accent!]!, colors[subtle!]!),
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const surface of [
        "background",
        "surface",
        "surface-raised",
        "input",
      ])
        expect(
          ratio(colors["border-control"]!, colors[surface]!),
        ).toBeGreaterThanOrEqual(3);
    });
});

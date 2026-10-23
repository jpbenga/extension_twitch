import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const app = resolve("apps/web/src/app");
const tokens = readFileSync(resolve(app, "tokens.css"), "utf8");
const values = Object.fromEntries(
  [...tokens.matchAll(/--(color-[a-z-]+):\s*(#[a-f\d]{6});/g)].map((m) => [
    m[1]!,
    m[2]!,
  ]),
);
function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((s) => (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
  return c[0]! * 0.2126 + c[1]! * 0.7152 + c[2]! * 0.0722;
}
const contrast = (a: string, b: string) => {
  const x = luminance(values[`color-${a}`]!),
    y = luminance(values[`color-${b}`]!);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
describe("Broadcast Neon accessibility boundaries", () => {
  it("keeps ordinary, secondary and disabled text at AA contrast across real application surfaces", () => {
    for (const text of ["text-primary", "text-secondary", "text-muted"])
      for (const surface of [
        "background",
        "surface",
        "surface-secondary",
        "surface-raised",
        "input",
      ])
        expect(
          contrast(text, surface),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
  });
  it("keeps accent button labels and semantic feedback readable without relying on colour alone", () => {
    for (const [accent, subtle] of [
      ["action-primary", "primary-subtle"],
      ["success", "success-subtle"],
      ["warning", "warning-subtle"],
      ["danger", "danger-subtle"],
      ["info", "info-subtle"],
    ]) {
      expect(
        contrast("on-accent", accent!),
        `ink on ${accent}`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(accent!, subtle!),
        `${accent} on ${subtle}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    for (const surface of ["background", "surface", "surface-raised", "input"])
      expect(contrast("border-control", surface)).toBeGreaterThanOrEqual(3);
  });
  it("centralizes CSS colours and forbids native application confirm, alert and prompt regressions", () => {
    const source = resolve("apps/web/src");
    function scan(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = resolve(directory, entry.name);
        if (entry.isDirectory()) scan(file);
        else if (/\.(tsx?|css)$/.test(entry.name)) {
          const content = readFileSync(file, "utf8");
          if (entry.name.endsWith("css") && entry.name !== "tokens.css")
            expect(content, file).not.toMatch(/#[\da-f]{3,8}\b/i);
          if (entry.name.endsWith("ts") || entry.name.endsWith("tsx"))
            expect(content, file).not.toMatch(
              /window\.(?:confirm|alert|prompt)\s*\(/,
            );
        }
      }
    }
    scan(source);
  });
});

import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { officialTvFixture } from "./undercover-tv-fixture.js";
const root = (p: Page) =>
  p.getByLabel("Overlay public de l’émission", { exact: true });
async function ready(p: Page) {
  await expect(p.getByTestId("broadcast-connection")).toHaveText("Synchronisé");
  await expect(root(p)).toHaveAttribute("data-layout-version", "2");
}
async function capture(p: Page, info: TestInfo, name: string) {
  await p.evaluate(() => document.fonts.ready);
  const b = await p.screenshot({
    path:
      process.env.CAPTURE_MOTION === "1"
        ? `docs/ux/implementation/undercover-consolidation-motion/${name}.png`
        : info.outputPath(`${name}.png`),
    omitBackground: true,
    animations: "disabled",
  });
  expect(b[25]).toBe(6); // PNG RGBA, independent of a checkerboard background.
  expect(
    await p.evaluate(async (b64) => {
      const i = new Image();
      i.src = `data:image/png;base64,${b64}`;
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.width;
      c.height = i.height;
      const x = c.getContext("2d")!;
      x.drawImage(i, 0, 0);
      return x.getImageData(
        Math.floor(i.width / 2),
        Math.floor(i.height / 2),
        1,
        1,
      ).data[3];
    }, b.toString("base64")),
  ).toBe(0);
}
for (const reduced of [false, true])
  for (const count of [3, 6, 12]) {
    const motion = reduced ? "reduced" : "normal";
    test(`${motion}: ${count} actual players, anonymous duo, readable assignments, stable vote counter and interruption`, async ({
      page,
      request,
      browser,
    }, info) => {
      await page.emulateMedia({
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      const f = await officialTvFixture(request, count);
      await page.goto(`/sessions/${f.id}/obs`);
      await ready(page);
      await f.action("deal");
      await expect(root(page).locator(".tv-speaker-number")).toHaveText("1");
      await expect(root(page).locator(".tv-speaker")).toHaveCSS(
        "animation-duration",
        reduced ? "0.1s" : "0.18s",
      );
      if (reduced)
        await expect(root(page).locator(".tv-speaker")).toHaveCSS(
          "animation-name",
          "tv-fade-in",
        );
      await f.command({ type: "undercover.publish", mode: "duo" });
      const duo = root(page).locator(".tv-duo");
      await expect(duo).toHaveCount(2);
      await expect(duo.first()).toHaveCSS(
        "animation-name",
        reduced ? "tv-fade-in" : "tv-duo-a",
      );
      await expect(duo.last()).toHaveCSS(
        "animation-delay",
        reduced ? "0s" : "0.04s",
      );
      expect((await f.publicView()).undercoverBroadcast).not.toHaveProperty(
        "assignments",
      );
      await expect(root(page).locator("[data-player],.tv-camp")).toHaveCount(0);
      await capture(page, info, `motion-duo-${count}-${motion}-alpha`);
      await f.command({
        type: "undercover.publish",
        mode: "assignments",
        page: 0,
      });
      const cards = root(page).locator(".tv-assignment");
      await expect(cards).toHaveCount(3);
      await expect(cards.nth(2)).toHaveCSS(
        "animation-delay",
        reduced ? "0s" : "0.08s",
      );
      await capture(page, info, `motion-assignments-${count}-${motion}-alpha`);
      // The cue may finish; published assignments remain a durable state, without an exit flash.
      await page.waitForFunction(
        () =>
          document
            .querySelector('.broadcast-tv [data-widget="players"]')
            ?.getAttribute("data-motion-stage") === "exit",
        undefined,
        { timeout: 6000, polling: "raf" },
      );
      expect(
        await cards.first().evaluate((e) => getComputedStyle(e).animationName),
      ).not.toMatch(/out/);
      await expect(root(page)).toHaveAttribute("data-motion", "stable");
      await expect(cards.first()).toHaveCSS("opacity", "1");
      if (count > 3) {
        await f.command({
          type: "undercover.publish",
          mode: "assignments",
          page: count / 3 - 1,
        });
        await expect(root(page).locator(".tv-player").last()).toHaveText(
          `#${count} ${f.players[count - 1]!.name}`,
        );
        await capture(
          page,
          info,
          `motion-assignments-${count}-last-${motion}-alpha`,
        );
      }
      await f.clues();
      // A new Duo is interrupted by the real GM opening votes. It must never come back.
      await f.command({ type: "undercover.publish", mode: "duo" });
      await expect(duo).toHaveCount(2);
      await f.action("open-vote");
      await expect(duo).toHaveCount(0);
      const counter = page.getByTestId("broadcast-votes"),
        box = root(page).locator(".tv-vote");
      await expect(counter).toHaveText(`0 / ${count} votes reçus`);
      const initial = (await box.boundingBox())!;
      if (count === 12) {
        expect(Math.round(initial.width)).toBe(720);
        expect(Math.round(initial.height)).toBe(180);
        expect(
          await counter.evaluate((e) =>
            parseFloat(getComputedStyle(e).fontSize),
          ),
        ).toBeCloseTo(64, 2);
      }
      await capture(page, info, `motion-vote-${count}-zero-${motion}-alpha`);
      for (let i = 0; i < count; i++)
        await f.action("vote", f.players[i]!.token, {
          target: f.players[i === 0 ? 1 : 0]!.id,
        });
      await expect(counter).toHaveText(`${count} / ${count} votes reçus`);
      const final = (await box.boundingBox())!;
      expect(final).toEqual(initial);
      await expect(root(page).locator(".tv-vote-progress > span")).toHaveCSS(
        "transition-duration",
        reduced ? "0s" : "0.14s",
      );
      expect(
        await counter.evaluate((e) => e.scrollWidth <= e.clientWidth),
      ).toBe(true);
      const pub = JSON.stringify(await f.publicView());
      expect(pub).not.toMatch(/ownVote|"choices"/);
      await capture(
        page,
        info,
        `motion-vote-${count}-complete-${motion}-alpha`,
      );
      if (count === 12) {
        await page.setViewportSize({ width: 390, height: 220 });
        await capture(page, info, `motion-vote12-twitch390-${motion}-alpha`);
        await page.setViewportSize({ width: 1920, height: 1080 });
      }
      await page.waitForFunction(
        () =>
          document
            .querySelector('.broadcast-tv [data-widget="vote"]')
            ?.getAttribute("data-motion-stage") === "exit",
        undefined,
        { timeout: 6000, polling: "raf" },
      );
      expect(
        await root(page)
          .locator(".tv-vote-counter")
          .evaluate((e) => getComputedStyle(e).animationName),
      ).not.toMatch(/out/);
      await expect(root(page)).toHaveAttribute("data-motion", "stable", {
        timeout: 10000,
      });
      await expect(duo).toHaveCount(0);
      await expect(counter).toHaveText(`${count} / ${count} votes reçus`);
      if (count === 3) {
        await f.action("resolve");
        await expect(root(page).locator(".tv-final-card")).toHaveCount(3);
        await capture(page, info, `motion-final-${motion}-alpha`);
        await expect(root(page).locator(".tv-final-card")).toHaveCount(0, {
          timeout: 10000,
        });
        const outcome = (await f.publicView()).publicGame!.play!.outcome!.label;
        await expect(root(page).locator(".tv-result-compact")).toContainText(
          outcome,
        );
        const late = await browser.newContext({
          baseURL: "http://127.0.0.1:3000",
          viewport: { width: 1920, height: 1080 },
          reducedMotion: reduced ? "reduce" : "no-preference",
        });
        try {
          const p = await late.newPage();
          await p.goto(`/sessions/${f.id}/obs`);
          await ready(p);
          await expect(root(p)).toHaveAttribute("data-motion", "stable");
          await expect(root(p).locator(".tv-final-card")).toHaveCount(0);
          await expect(root(p).locator(".tv-result-compact")).toContainText(
            outcome,
          );
          await capture(p, info, `motion-late-result-${motion}-alpha`);
          await p.reload();
          await ready(p);
          await expect(root(p).locator(".tv-final-card")).toHaveCount(0);
        } finally {
          await late.close();
        }
      }
    });
  }

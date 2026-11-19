import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { officialTvFixture } from "./undercover-tv-fixture.js";

const captures = "docs/ux/implementation/studio-return";
mkdirSync(captures, { recursive: true });

async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${captures}/${name}.png`,
    animations: "disabled",
  });
}

test("real Studio output stays independent from OBS and reveals only after the server outcome", async ({
  page,
  request,
  browser,
}) => {
  const fixture = await officialTvFixture(request, 3);
  await page.goto(`/sessions/${fixture.id}/studio`);
  await fixture.action("deal");
  await expect(page.locator(".studio-sync")).toContainText("Synchronisé");
  await expect(page.getByTestId("studio-return")).toHaveAttribute(
    "data-state",
    "discussion",
  );
  await expect(page.locator("body")).not.toContainText(/Phare|Balise|Civil/);
  await shot(page, "discussion-video-integrale-1920x1080");

  const twitchReturn = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await twitchReturn.route("https://www.twitch.tv/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Chat Twitch de test</title>",
    }),
  );
  await twitchReturn.goto(
    `/sessions/${fixture.id}/studio?twitchChannel=twitchdev&chat=1`,
  );
  const twitchFrame = twitchReturn.locator(".studio-chat-frame");
  await expect(twitchFrame).toHaveAttribute(
    "src",
    /twitch\.tv\/embed\/twitchdev\/chat\?parent=127\.0\.0\.1&darkpopout=true/,
  );
  await expect(twitchReturn.locator("body")).not.toContainText(
    /Phare|Balise|Civil/,
  );
  await twitchReturn.close();

  await page.getByRole("button", { name: "Afficher le chat" }).click();
  await expect(page.getByLabel("Chat Twitch")).toContainText(
    "Chat momentanément indisponible",
  );
  await shot(page, "discussion-chat-lateral-1920x1080");

  const obs = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await obs.goto(`/sessions/${fixture.id}/obs`);
  await expect(obs.locator('[data-renderer="broadcast-v1"]')).toBeVisible();
  const obsRendererBefore = await obs
    .locator('[data-renderer="broadcast-v1"]')
    .evaluate((element) => element.outerHTML);

  await fixture.clues();
  await fixture.action("open-vote");
  await expect(page.getByTestId("studio-return")).toHaveAttribute(
    "data-state",
    "vote",
  );
  await expect(page.locator("body")).toContainText("0 votes reçus sur 3");
  await expect(page.locator("body")).not.toContainText(/Phare|Balise|Civil/);
  await shot(page, "avant-revelation-vote-1920x1080");

  const gm = await fixture.read();
  const undercover = Object.entries(gm.game!.management!.assignments).find(
    ([, role]) => role === "undercover",
  )![0];
  const civil = fixture.players.find((player) => player.id !== undercover)!.id;
  for (const player of fixture.players)
    await fixture.action("vote", player.token, {
      target: player.id === undercover ? civil : undercover,
    });
  await fixture.action("resolve");
  await expect(page.getByTestId("studio-return")).toHaveAttribute(
    "data-state",
    "reveal",
  );
  await expect(page.getByTestId("studio-reveal-card")).toHaveCount(3);
  await expect(page.locator("body")).toContainText("Victoire des civils");
  await page.waitForTimeout(1500);
  await expect(page.getByTestId("studio-reveal-card")).toHaveCount(3);
  await shot(page, "revelation-3-joueurs-1920x1080");

  await expect(obs.locator('[data-renderer="broadcast-v1"]')).toBeVisible();
  expect(obsRendererBefore).toContain('data-renderer="broadcast-v1"');
  await obs.close();

  await page.evaluate(
    ({ id, token }) => sessionStorage.setItem(`xt:access:${id}:gm`, token),
    { id: fixture.id, token: fixture.token },
  );
  await page.goto(`/sessions/${fixture.id}/gm#board`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("link", { name: "Plateau", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Ouvrir le Retour Studio ↗" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Répétition avant direct ↗" }),
  ).toBeVisible();
  await page.getByLabel("Chaîne Twitch du live test").fill("TwitchDev");
  await page.getByLabel("Vidéo + vrai chat Twitch latéral").check();
  await expect(
    page.getByRole("link", { name: "Ouvrir le Retour Studio ↗" }),
  ).toHaveAttribute("href", /twitchChannel=twitchdev&chat=1$/);
  await shot(page, "acces-gm-retour-studio-1920x1080");
});

test("rehearsal is fixture-only, covers 6 and 12 players, long labels and pagination", async ({
  page,
}) => {
  const commandRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" && request.url().includes("/commands"))
      commandRequests.push(request.url());
  });
  await page.goto(
    "/sessions/rehearsal-only/studio/rehearsal?state=discussion&chat=1",
  );
  await expect(page.getByTestId("studio-return")).toHaveAttribute(
    "data-rehearsal",
    "true",
  );
  await expect(page.getByLabel("Chat Twitch")).toContainText("RÉPÉTITION");
  await page.getByRole("button", { name: "Masquer le chat" }).click();
  expect(commandRequests).toEqual([]);
  await shot(page, "repetition-avant-direct-1920x1080");

  await page.goto(
    "/sessions/rehearsal-only/studio/rehearsal?state=reveal&players=6",
  );
  await expect(page.getByTestId("studio-reveal-card")).toHaveCount(6);
  await expect(page.locator(".studio-pagination")).toHaveCount(0);
  await expect(page.locator("body")).toContainText(
    "Alexandre au nom particulièrement long",
  );
  await shot(page, "revelation-6-joueurs-1920x1080");

  await page.goto(
    "/sessions/rehearsal-only/studio/rehearsal?state=reveal&players=12",
  );
  await expect(page.getByTestId("studio-reveal-card")).toHaveCount(3);
  await expect(page.locator(".studio-pagination")).toContainText("1 sur 4");
  await shot(page, "revelation-12-joueurs-1920x1080");
  await page.getByRole("button", { name: "Groupe suivant" }).click();
  await expect(page.locator(".studio-pagination")).toContainText("2 sur 4");
  await expect(page.getByTestId("studio-reveal-card")).toHaveCount(3);
  expect(commandRequests).toEqual([]);
});

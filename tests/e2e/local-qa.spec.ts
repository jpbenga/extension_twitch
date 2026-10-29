import {
  test,
  expect,
  type Page,
  type TestInfo,
  type BrowserContext,
} from "@playwright/test";
import { acceptConfirmation } from "./dialog-helpers.js";
import { completeClues } from "./turn-helpers.js";
import { openGmReplay } from "./undercover-helpers.js";
async function shot(p: Page, info: TestInfo, name: string, alpha = false) {
  await p.evaluate(() => document.fonts.ready);
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  const b = await p.screenshot({
    path:
      process.env.CAPTURE_LOCAL_QA === "1"
        ? `docs/screenshots/local-qa/${name}.png`
        : info.outputPath(`${name}.png`),
    fullPage: !alpha,
    omitBackground: alpha,
    animations: "disabled",
    mask: [p.locator(".copy-block input,.invitation-code")],
  });
  if (alpha) expect(b[25]).toBe(6);
}
test("the converged application prepares three actual rounds, keeps independent players, broadcasts real results and advances without losing the conductor", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto("/");
  await shot(page, info, "01-home");
  await page
    .getByRole("link", { name: "Préparer une partie Undercover", exact: true })
    .click();
  await expect(
    page.getByLabel("Nom du contenu A", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Participants prévus", { exact: true }).fill("5");
  const image = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 300;
      c.height = 180;
      const x = c.getContext("2d")!;
      x.fillStyle = "#544476";
      x.fillRect(0, 0, 300, 180);
      x.fillStyle = "#b396ff";
      x.beginPath();
      x.arc(150, 90, 60, 0, Math.PI * 2);
      x.fill();
      return c.toDataURL().split(",")[1]!;
    }),
    "base64",
  );
  for (const [index, pair] of [
    ["Sasuke", "Itachi"],
    ["Messi", "Ronaldo"],
    ["Paris", "Londres"],
  ].entries()) {
    if (index)
      await page
        .getByRole("button", { name: "＋ Ajouter une manche", exact: true })
        .click();
    await page.getByLabel("Nom du contenu A", { exact: true }).fill(pair[0]!);
    await page.getByLabel("Nom du contenu B", { exact: true }).fill(pair[1]!);
    if (index === 0) {
      for (const side of ["A", "B"])
        await page
          .getByLabel(`Image du contenu ${side}`, { exact: true })
          .setInputFiles({
            name: `neutral-${side}.png`,
            mimeType: "image/png",
            buffer: image,
          });
      await shot(page, info, "02-prepare");
    }
    await page
      .getByRole("button", { name: "Ajouter cette manche", exact: true })
      .click();
  }
  await page
    .getByLabel("Nom de la partie", { exact: true })
    .fill("Test stream");
  await shot(page, info, "03-multi-manches");
  await page
    .locator(".series-runlist > li")
    .first()
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await shot(page, info, "04-content-editor");
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Vérifier la partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  const id = page.url().split("/").at(-2)!;
  const read = async () =>
    page.evaluate(async (id) => {
      const r = await fetch(`/api/server/sessions/${id}/private`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:gm`)}`,
        },
      });
      return r.json();
    }, id);
  const initial = await read();
  expect(initial.game).toBeUndefined();
  expect(initial.participants).toHaveLength(0);
  await shot(page, info, "05-lobby");
  const invitation = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const actors: { name: string; page: Page; id: string }[] = [];
  try {
    for (const name of ["Alex", "Camille", "Noa", "Lou", "Sam"]) {
      const c = await browser.newContext({
        baseURL: "http://127.0.0.1:3000",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      contexts.push(c);
      const p = await c.newPage();
      await p.goto(invitation);
      await p.getByLabel("Votre nom", { exact: true }).fill(name);
      await p
        .getByRole("button", { name: "Rejoindre la partie", exact: true })
        .click();
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
      actors.push({
        name,
        page: p,
        id: p.url().split("/").pop()!.split("#")[0]!,
      });
    }
    const c = await browser.newContext({
      baseURL: "http://127.0.0.1:3000",
      viewport: { width: 1920, height: 1080 },
    });
    contexts.push(c);
    const obs = await c.newPage(),
      pub = await c.newPage();
    await obs.goto(`/sessions/${id}/obs`);
    await pub.goto(`/sessions/${id}/public`);
    await expect(obs.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(
      obs.getByLabel("Overlay public de l’émission", { exact: true }),
    ).toHaveAttribute("data-phase", "discussion");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, info, "06-gm-discussion-mobile");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await shot(actors[0]!.page, info, "07-player-mobile");
    await shot(pub, info, "08-public");
    const view = await read(),
      roles = view.game.management.assignments as Record<string, string>;
    const publicRead = async () =>
      (await page.request.get(`/api/server/sessions/${id}/public`)).json();
    const publication = page.locator(".gm-content-publication");
    await publication.locator(":scope > summary").click();
    await publication
      .getByRole("button", { name: "Montrer le duo anonyme", exact: true })
      .click();
    await expect(obs.locator(".tv-duo img")).toHaveCount(2);
    await shot(obs, info, "09-duo-obs-alpha", true);
    const anon = (await publicRead()).undercoverBroadcast;
    expect(anon.mode).toBe("duo");
    expect(anon).not.toHaveProperty("assignments");
    expect(JSON.stringify(anon)).not.toMatch(/participantId|"role"|"camp"/);
    await publication
      .getByRole("button", { name: "Publier les affectations", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(obs.locator(".tv-assignment")).toHaveCount(3);
    await shot(obs, info, "10-assignments-obs-alpha", true);
    await publication
      .getByRole("button", { name: "Masquer les contenus", exact: true })
      .click();
    const civil = actors.find((p) => roles[p.id] === "civil")!,
      enemy = actors.find((p) => roles[p.id] === "undercover")!;
    async function ballot(target: string) {
      await completeClues(page);
      await page
        .getByRole("button", { name: "Ouvrir les votes", exact: true })
        .click();
      await expect(obs.getByTestId("broadcast-votes")).toHaveText(
        /0 \/ [45] votes reçus/,
      );
      await shot(obs, info, "11-vote-obs-alpha", true);
      const active = (await read()).game.play.roster
        .filter((p: { active: boolean }) => p.active)
        .map((p: { id: string }) => p.id) as string[];
      for (const actor of actors.filter((p) => active.includes(p.id))) {
        const t = actors.find(
          (p) =>
            p.id ===
            (actor.id === target ? active.find((x) => x !== target) : target),
        )!;
        await actor.page
          .getByRole("radio", { name: t.name, exact: true })
          .check();
        await actor.page
          .getByRole("button", { name: "Voter", exact: true })
          .click();
        await acceptConfirmation(actor.page);
      }
      await page
        .getByRole("button", {
          name: "Révéler le résultat du vote",
          exact: true,
        })
        .click();
      await acceptConfirmation(page);
    }
    await ballot(civil.id);
    expect((await read()).game.play.outcome).toBeUndefined();
    await expect(
      civil.page.getByRole("button", { name: "Voter", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Commencer un nouveau cycle", exact: true })
      .click();
    expect((await read()).undercoverPreparation.id).toBe(
      initial.undercoverPreparation.id,
    );
    await ballot(enemy.id);
    await expect(obs.locator(".tv-final-card")).toHaveCount(3);
    await shot(obs, info, "12-final-obs-alpha", true);
    expect((await read()).game.play.outcome.label).toBe("Victoire des civils");
    await page.goto(`/sessions/${id}/stream?from=gm`);
    await expect(
      page.getByRole("link", { name: "← Régie", exact: true }),
    ).toBeVisible();
    await shot(page, info, "13-stream-preview");
    await page.goto(`/sessions/${id}/overlay`);
    await expect(
      page.getByLabel("Bloc à ajuster", { exact: true }),
    ).toBeVisible();
    await shot(page, info, "14-advanced-layout");
    await page.goto(`/sessions/${id}/gm`);
    await page
      .getByRole("button", { name: "Manche suivante", exact: true })
      .click();
    await acceptConfirmation(page);
    const next = await read();
    expect(next.undercoverPreparation.series.position).toBe(2);
    expect(next.game.play.dealt).toBe(false);
    expect((await publicRead()).undercoverBroadcast.mode).toBe("none");
    expect(JSON.stringify(await publicRead())).not.toMatch(/Messi|Ronaldo/);
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await openGmReplay(page);
    await page
      .getByRole("button", { name: "Rejouer cette manche", exact: true })
      .click();
    await acceptConfirmation(page);
    const replay = await read();
    expect(replay.undercoverPreparation.id).toBe(next.undercoverPreparation.id);
    expect(replay.game.play.dealt).toBe(false);
    expect(replay.participants).toHaveLength(5);
    await page.goto("/play/undercover?view=series");
    await expect(page.locator(".series-runlist > li")).toHaveCount(3);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

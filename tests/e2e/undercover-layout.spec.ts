import { openGmReplay } from "./undercover-helpers.js";
import { openLabAccess, openLabPlayers } from "./undercover-helpers.js";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { acceptConfirmation } from "./dialog-helpers.js";
import { completeClues } from "./turn-helpers.js";
const rendered = (p: Page) =>
  p.getByLabel("Overlay public de l’émission", { exact: true });
const widget = (p: Page, id: string) =>
  rendered(p).locator(`[data-widget="${id}"]`);
async function start(page: Page, count = 3) {
  await page.goto("/play/undercover");
  await page
    .getByLabel("Joueurs de démonstration", { exact: true })
    .fill(String(count));
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return page.url().split("/").pop()!;
}
async function assertBounds(page: Page) {
  const sizes = await rendered(page).evaluate((el) => {
    const frame = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll<HTMLElement>("[data-widget]")).map(
      (w) => {
        const r = w.getBoundingClientRect();
        return {
          x: r.x - frame.x,
          y: r.y - frame.y,
          right: r.right - frame.x,
          bottom: r.bottom - frame.y,
          w: frame.width,
          h: frame.height,
        };
      },
    );
  });
  for (const r of sizes) {
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(r.w + 1);
    expect(r.bottom).toBeLessThanOrEqual(r.h + 1);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("configure a real Undercover game, adjust the shared layout, play to a result and retain it on replay", async ({
  page,
  browser,
}, info) => {
  await page.goto("/play/undercover");
  await page.getByLabel("Joueurs de démonstration", { exact: true }).fill("3");
  await expect(page.getByLabel("Règles actives")).toContainText(
    "2 civils et 1 Undercover",
  );
  await page.getByText("Personnaliser l’overlay", { exact: true }).click();
  await page
    .getByLabel("Disposition de départ", { exact: true })
    .selectOption("bottom");
  await acceptConfirmation(page);
  await expect(widget(page, "players")).toHaveAttribute("style", /66.111/);
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("result");
  await page.getByLabel("Résultat · Hauteur", { exact: true }).fill("390");
  const resultStyle = await widget(page, "result").getAttribute("style");
  await page.reload();
  await page.getByText("Personnaliser l’overlay", { exact: true }).click();
  await expect(widget(page, "result")).toHaveAttribute("style", resultStyle!);
  await assertBounds(page);
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/play\/lab\//);
  const id = page.url().split("/").pop()!;
  await openLabAccess(page);
  const gmHref = (await page
    .getByRole("link", {
      name: "Ouvrir la régie sur cet appareil",
      exact: true,
    })
    .getAttribute("href"))!;
  await openLabPlayers(page);
  const links = await Promise.all(
    [1, 2, 3].map((i) =>
      page
        .getByRole("link", {
          name: `Ouvrir Joueur ${i} séparément`,
          exact: true,
        })
        .getAttribute("href"),
    ),
  );
  const contexts: BrowserContext[] = [];
  try {
    async function open(href: string) {
      const c = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      contexts.push(c);
      const p = await c.newPage();
      await p.goto(href);
      return p;
    }
    const gm = await open(gmHref),
      players = await Promise.all(links.map((h) => open(h!))),
      preview = await open(`/sessions/${id}/stream`),
      obs = await open(`/sessions/${id}/obs`);
    await expect(obs.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(widget(obs, "result")).toHaveAttribute("style", resultStyle!);
    await expect(widget(preview, "result")).toHaveAttribute(
      "style",
      resultStyle!,
    );
    await expect(obs.locator("button,input,select")).toHaveCount(0);
    await gm
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(rendered(obs)).toHaveAttribute("data-phase", "discussion");
    await expect(rendered(obs)).not.toContainText(/Phare|Fusée/);
    await gm
      .getByText("Informations privées du Game Master", { exact: true })
      .click();
    const intrus = (await gm
      .locator(".gm-secrets li")
      .filter({ hasText: /: Undercover$/ })
      .textContent())!.split(" : ")[0]!;
    await completeClues(gm);
    await gm
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 0; i < 3; i++) {
      const target =
        intrus === `Joueur démo ${i + 1}`
          ? `Joueur démo ${i === 0 ? 2 : 1}`
          : intrus;
      await players[i]!.getByRole("radio", {
        name: target,
        exact: true,
      }).check();
      await players[i]!.getByRole("button", {
        name: "Voter",
        exact: true,
      }).click();
      await acceptConfirmation(players[i]!);
      await expect(obs.getByTestId("broadcast-votes")).toHaveText(
        `${i + 1} / 3 votes reçus`,
      );
    }
    await gm
      .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
      .click();
    await acceptConfirmation(gm);
    await expect(rendered(obs)).toContainText("Victoire des civils");
    await assertBounds(obs);
    await obs.screenshot({
      path: info.outputPath("undercover-personnalise-obs.png"),
      omitBackground: true,
    });
    expect(
      await obs.evaluate(() => getComputedStyle(document.body).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
    await openGmReplay(gm);
    await gm
      .getByRole("button", { name: "Rejouer cette partie", exact: true })
      .click();
    await acceptConfirmation(gm);
    await expect(rendered(obs)).toHaveAttribute("data-phase", "preparation");
    await expect(widget(obs, "result")).toHaveAttribute("style", resultStyle!);
    await openLabAccess(page);
    await page
      .getByRole("link", { name: "Personnaliser l’overlay", exact: true })
      .click();
    await expect(widget(page, "result")).toHaveAttribute("style", resultStyle!);
    await page.screenshot({
      path: info.outputPath("editeur-undercover.png"),
      fullPage: true,
    });
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("drag, resize, bounds, ordering and independent cards persist; concurrent editing preserves local work", async ({
  page,
  context,
}) => {
  const id = await start(page, 12);
  await openLabAccess(page);
  const gmHref = (await page
    .getByRole("link", {
      name: "Ouvrir la régie sur cet appareil",
      exact: true,
    })
    .getAttribute("href"))!;
  await page
    .getByRole("link", { name: "Personnaliser l’overlay", exact: true })
    .click();
  await expect(page.getByTestId("layout-canvas")).toBeVisible();
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  const titleWidth = page.getByLabel("Titre · Largeur", { exact: true });
  await titleWidth.fill("");
  await titleWidth.pressSequentially("1700");
  await expect(titleWidth).toHaveValue("1700");
  const drag = page.getByRole("button", {
    name: "Déplacer Titre",
    exact: true,
  });
  const before = await widget(page, "header").getAttribute("style");
  await drag.focus();
  await page.keyboard.press("ArrowRight");
  await expect(widget(page, "header")).not.toHaveAttribute("style", before!);
  // Actual mouse pointer capture exercises the shared design-space scaling, even on a touch viewport.
  const handle = page.getByRole("button", {
    name: "Redimensionner Joueurs",
    exact: true,
  });
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 - 35,
    box.y + box.height / 2 + 15,
    { steps: 5 },
  );
  await page.mouse.up();
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("players");
  await expect(
    page.getByLabel("Joueurs · Largeur", { exact: true }),
  ).not.toHaveValue("1872");
  await page.getByLabel("Joueurs · Gauche", { exact: true }).fill("99999");
  await assertBounds(page);
  await page
    .getByLabel("Présentation des joueurs", { exact: true })
    .selectOption("vertical");
  await expect(rendered(page).locator("[data-player]")).toHaveCount(12);
  await page
    .getByLabel("Présentation des joueurs", { exact: true })
    .selectOption("grid");
  await page.getByText("Ordre visuel des joueurs", { exact: true }).click();
  await page
    .getByRole("button", { name: "Reculer Joueur 1", exact: true })
    .click();
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("player:0");
  await page.getByLabel("Joueur 1 · Gauche", { exact: true }).fill("30");
  await expect(
    page.getByLabel("Présentation des joueurs", { exact: true }),
  ).toHaveValue("free");
  await page
    .getByRole("button", { name: "Enregistrer la disposition", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({
      hasText: "Disposition enregistrée. L’aperçu et OBS sont à jour.",
    }),
  ).toBeVisible();
  const saved = await widget(page, "players").getAttribute("style");
  await page.reload();
  await expect(widget(page, "players")).toHaveAttribute("style", saved!);
  // Explicitly import the owner's private capability: sessionStorage is intentionally isolated by tab.
  const other = await context.newPage();
  other.on("dialog", (dialog) => {
    if (dialog.type() === "beforeunload") void dialog.accept();
    else void dialog.dismiss();
  });
  await other.goto(
    `/sessions/${id}/overlay${new URL(gmHref, "http://127.0.0.1:3000").hash}`,
  );
  await expect(other.getByTestId("layout-canvas")).toBeVisible();
  await other
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  await other.getByLabel("Titre · Hauteur", { exact: true }).fill("150");
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  await page.getByLabel("Titre · Hauteur", { exact: true }).fill("160");
  await page
    .getByRole("button", { name: "Enregistrer la disposition", exact: true })
    .click();
  await expect(
    other
      .getByRole("alert")
      .filter({ hasText: "modifiée dans un autre onglet" }),
  ).toContainText("modifiée dans un autre onglet");
  await expect(
    other.getByLabel("Titre · Hauteur", { exact: true }),
  ).toHaveValue("150");
  await expect(
    other.getByRole("button", {
      name: "Enregistrer la disposition",
      exact: true,
    }),
  ).toBeDisabled();
  await other.reload();
  await other
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  await expect(
    other.getByLabel("Titre · Hauteur", { exact: true }),
  ).toHaveValue("150");
  await other
    .getByRole("button", {
      name: "Charger la disposition enregistrée",
      exact: true,
    })
    .click();
  await acceptConfirmation(other);
  await expect(
    other.getByLabel("Titre · Hauteur", { exact: true }),
  ).toHaveValue("160");
  await other
    .getByRole("button", {
      name: "Rétablir la disposition par défaut",
      exact: true,
    })
    .click();
  await acceptConfirmation(other);
  await expect(widget(other, "players")).toHaveAttribute(
    "style",
    /left: 1.25%/,
  );
  await other.close();
});

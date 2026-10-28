import { launchPrepareDemo, openPrepareDemo } from "./undercover-helpers.js";
import { test, expect, type Page } from "@playwright/test";

const prepare = (page: Page) =>
  page.getByRole("link", {
    name: "Préparer une partie Undercover",
    exact: true,
  });
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const el of await page
    .locator(".home-button:visible,.home-page summary:visible")
    .all())
    expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(
    await page.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/);
}
async function theme(page: Page, value: string) {
  const control = page.getByLabel("Apparence de l’application", {
    exact: true,
  });
  await control.click();
  await page
    .getByLabel("Thème de l’application", { exact: true })
    .selectOption(value);
  await page.keyboard.press("Escape");
  await expect(control).toBeFocused();
}
async function demo(page: Page) {
  await page.goto("/play/undercover");
  await openPrepareDemo(page);
  await page.getByLabel("Joueurs de démonstration", { exact: true }).fill("3");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return page.url();
}

test("approved homepage has real preparation, disclosures and three persistent themes without invented games", async ({
  page,
}, info) => {
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.method() === "POST") writes.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Votre prochaine partie commence ici.",
  );
  await expect(prepare(page)).toHaveAttribute("href", "/play/undercover");
  await expect(
    page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".home-art-reference img")).toHaveJSProperty(
    "complete",
    true,
  );
  for (const name of ["Enchères", "Qui est l’espion ?"]) {
    const card = page.locator(".home-future article").filter({ hasText: name });
    await expect(card).toContainText("À venir");
    await expect(card.locator("a,button")).toHaveCount(0);
  }
  for (const value of ["broadcast-studio", "neon-show", "on-air-premium"]) {
    await theme(page, value);
    await fits(page);
    await page.screenshot({
      path: info.outputPath(`accueil-${value}.png`),
      fullPage: true,
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", value);
  }
  await page.getByText("Découvrir le jeu", { exact: true }).click();
  await expect(
    page.getByText(/Format de démonstration jouable\./),
  ).toBeVisible();
  await page.getByLabel("Retrouver ma partie", { exact: true }).click();
  await expect(
    page.getByText(/Ouvrez votre lien privé GM ou joueur conservé/),
  ).toBeVisible();
  await fits(page);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
  await prepare(page).click();
  await expect(page).toHaveURL(/\/play\/undercover$/);
  await expect(
    page.getByRole("heading", {
      name: /Préparer (?:votre |la )partie/,
      exact: true,
    }),
  ).toBeVisible();
  expect(writes).toEqual([]);
});

test("inline invitation rejects malformed input and joins a real session through the existing name entry", async ({
  page,
  browser,
}, info) => {
  await page.goto("/play/undercover");

  await page
    .getByRole("button", {
      name: "Préparer la partie",
      exact: true,
    })
    .click();
  const invitation = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  const gmUrl = page.url();
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
  ).toHaveAttribute("href", new URL(gmUrl).pathname);
  await page
    .getByRole("link", { name: "Reprendre ma partie", exact: true })
    .click();
  await expect(page).toHaveURL(gmUrl);
  const context = await browser.newContext({
    viewport: page.viewportSize(),
    isMobile: info.project.use.isMobile ?? false,
  });
  try {
    const player = await context.newPage();
    const writes: string[] = [];
    player.on("request", (r) => {
      if (r.method() === "POST") writes.push(r.url());
    });
    await player.goto("/");
    const input = player.getByLabel("Code ou lien d’invitation", {
      exact: true,
    });
    await input.fill("invalide");
    await player
      .getByRole("button", { name: "Rejoindre", exact: true })
      .click();
    await expect(player.locator(".home-error[role=alert]")).toContainText(
      "Collez le code complet",
    );
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await fits(player);
    expect(writes).toEqual([]);
    await player.screenshot({
      path: info.outputPath("invitation-erreur.png"),
      fullPage: true,
    });
    await input.fill(`  ${invitation}  `);
    await player
      .getByRole("button", { name: "Rejoindre", exact: true })
      .click();
    await expect(player.getByLabel("Votre nom", { exact: true })).toBeVisible();
    expect(writes).toEqual([]);
    await player
      .getByLabel("Votre nom", { exact: true })
      .fill("Invité accueil");
    await player
      .getByRole("button", { name: "Rejoindre la partie", exact: true })
      .click();
    await expect(player.locator('[data-experience="player"]')).toBeVisible();
    await expect(page.locator(".lobby-players").first()).toContainText(
      "Invité accueil",
    );
    expect(writes.filter((u) => u.includes("/join"))).toHaveLength(1);
    await player.goto("/");
    await expect(
      player.getByRole("link", { name: "Reprendre ma partie", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("resume waits for actual GM authorization, prioritizes the recovered game and denies a forged access", async ({
  page,
}, info) => {
  const destination = await demo(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/server/sessions/*/private", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText(
    "Vérification de votre accès…",
  );
  await expect(
    page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
  ).toHaveCount(0);
  await expect(prepare(page)).toBeVisible();
  release();
  const resume = page.getByRole("link", {
    name: "Reprendre ma partie",
    exact: true,
  });
  await expect(resume).toHaveAttribute("href", new URL(destination).pathname);
  await expect(resume).toHaveClass(/home-button-primary/);
  await expect(prepare(page)).toHaveClass(/home-button-secondary/);
  await expect(page.locator(".home-main > section").first()).toHaveClass(
    /home-recovery/,
  );
  await fits(page);
  await page.screenshot({
    path: info.outputPath("reprise-disponible.png"),
    fullPage: true,
  });
  await page.unroute("**/api/server/sessions/*/private");
  await resume.click();
  await expect(page).toHaveURL(destination);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await page.evaluate(() => {
    const id = sessionStorage.getItem("xt:recent-gm-session");
    sessionStorage.setItem(`xt:access:${id}:gm`, "X".repeat(43));
  });
  const refused = page.waitForResponse(
    (r) => r.url().endsWith("/private") && r.status() === 401,
  );
  await page.goto("/");
  await refused;
  await expect(page.getByRole("status")).toHaveText(
    "Cet accès n’est pas disponible dans cet onglet.",
  );
  await expect(
    page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
  ).toHaveCount(0);
  await expect(prepare(page)).toHaveClass(/home-button-primary/);
  await page.getByLabel("Retrouver ma partie", { exact: true }).click();
  await expect(page.getByText(/Ouvrez votre lien privé/)).toBeVisible();
  await fits(page);
});

test("network errors and blocked browser storage preserve access to preparation, appearance and private-link help", async ({
  page,
  browser,
}, info) => {
  await demo(page);
  await page.route("**/api/server/sessions/*/private", (route) =>
    route.abort("failed"),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText(
    "Cet accès n’est pas disponible dans cet onglet.",
  );
  await expect(prepare(page)).toBeVisible();
  await fits(page);
  const context = await browser.newContext({
    viewport: page.viewportSize(),
    isMobile: info.project.use.isMobile ?? false,
  });
  try {
    await context.addInitScript(() => {
      for (const name of ["sessionStorage", "localStorage"])
        Object.defineProperty(window, name, {
          get() {
            throw new DOMException("Unavailable", "SecurityError");
          },
        });
    });
    const p = await context.newPage();
    await p.goto("/");
    await expect(prepare(p)).toBeVisible();
    await theme(p, "neon-show");
    await p.getByLabel("Apparence de l’application", { exact: true }).click();
    await expect(
      p
        .getByRole("status")
        .filter({ hasText: "Thème appliqué pour cet onglet" }),
    ).toBeVisible();
    await p.keyboard.press("Escape");
    await fits(p);
  } finally {
    await context.close();
  }
});

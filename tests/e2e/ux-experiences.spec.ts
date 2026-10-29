import { openPreparedSalon } from "./undercover-helpers.js";
import {
  launchPrepareDemo,
  openPrepareBroadcast,
  openPrepareDemo,
} from "./undercover-helpers.js";
import { openGmReplay } from "./undercover-helpers.js";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { completeClues } from "./turn-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
import { openLabAccess } from "./undercover-helpers.js";
async function chooseTheme(page: Page, theme: string) {
  const trigger = page.getByLabel("Apparence de l’application", {
    exact: true,
  });
  const details = trigger.locator("..");
  if ((await details.getAttribute("open")) === null) await trigger.click();
  await page
    .getByLabel("Thème de l’application", { exact: true })
    .selectOption(theme);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
const overlay = (p: Page) =>
  p.getByRole("region", { name: "Overlay public de l’émission", exact: true });

test("three app themes persist, remain keyboard accessible and never alter the independently pinned OBS theme", async ({
  page,
  browser,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", {
      name: "Préparer une partie Undercover",
      exact: true,
    }),
  ).toBeVisible();
  for (const theme of ["broadcast-studio", "neon-show", "on-air-premium"]) {
    await chooseTheme(page, theme);
    await fits(page);
    const colors = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        bg: s.getPropertyValue("--color-background").trim(),
        text: s.getPropertyValue("--color-text-primary").trim(),
        accent: s.getPropertyValue("--color-action-primary").trim(),
      };
    });
    expect(colors.bg).toMatch(/^#/);
    expect(colors.accent).not.toBe(colors.bg);
    await page.screenshot({
      path: info.outputPath(`accueil-${theme}.png`),
      fullPage: true,
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
  await page
    .getByRole("link", { name: "Préparer une partie Undercover", exact: true })
    .click();
  await expect(
    page.getByLabel("Nom du contenu A", { exact: true }),
  ).toBeVisible();
  await openPrepareDemo(page);
  await page.getByLabel("Joueurs de démonstration", { exact: true }).fill("3");
  await openPrepareBroadcast(page);
  await page
    .getByLabel("Thème de l’émission", { exact: true })
    .selectOption("neon-show");
  await expect(overlay(page)).toHaveAttribute("data-theme", "neon-show");
  await page.reload();
  await openPrepareBroadcast(page);
  await expect(
    page.getByLabel("Thème de l’émission", { exact: true }),
  ).toHaveValue("neon-show");
  await chooseTheme(page, "broadcast-studio");
  await expect(overlay(page)).toHaveAttribute("data-theme", "neon-show");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  const id = page.url().split("/").pop()!;
  await expect(
    page.getByLabel("Perspective du laboratoire", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Personnaliser l’overlay", exact: true }),
  ).toBeHidden();
  await expect(page.locator(".lab-role-view #game")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("laboratoire.png"),
    fullPage: true,
    mask: [page.locator(".copy-block input,.invitation-code")],
  });
  await openLabAccess(page);
  const gmLink = (await page
    .getByRole("link", {
      name: "Ouvrir la régie sur cet appareil",
      exact: true,
    })
    .getAttribute("href"))!;
  const observer = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  try {
    const obs = await observer.newPage();
    await obs.goto(`/sessions/${id}/obs`);
    await expect(obs.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(overlay(obs)).toHaveAttribute("data-theme", "neon-show");
    await obs.screenshot({
      path: info.outputPath("obs-preparation.png"),
      omitBackground: true,
    });
    const preview = await observer.newPage();
    await preview.goto(`/sessions/${id}/stream`);
    await expect(preview.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await preview.screenshot({
      path: info.outputPath("apercu.png"),
      fullPage: true,
    });
    await preview.close();
    const beforeVersion = (
      await (await page.request.get(`/api/server/sessions/${id}/public`)).json()
    ).version;
    await chooseTheme(page, "on-air-premium");
    expect(
      (
        await (
          await page.request.get(`/api/server/sessions/${id}/public`)
        ).json()
      ).version,
    ).toBe(beforeVersion);
    await expect(overlay(obs)).toHaveAttribute("data-theme", "neon-show");
    await page.goto(gmLink);
    await expect(page.locator('[data-experience="gm"]')).toBeVisible();
    for (const theme of ["broadcast-studio", "neon-show", "on-air-premium"]) {
      await chooseTheme(page, theme);
      await expect(overlay(obs)).toHaveAttribute("data-theme", "neon-show");
      await expect(
        page.getByRole("button", {
          name: "Distribuer les mots et commencer",
          exact: true,
        }),
      ).toBeEnabled();
      await fits(page);
    }
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(overlay(obs)).toHaveAttribute("data-phase", "discussion");
    await openGmReplay(page);
    await page
      .getByRole("button", { name: "Rejouer cette manche", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(overlay(obs)).toHaveAttribute("data-phase", "preparation");
    await expect(overlay(obs)).toHaveAttribute("data-theme", "neon-show");
    await obs.reload();
    await expect(overlay(obs)).toHaveAttribute("data-theme", "neon-show");
    expect(
      await obs.evaluate(() => getComputedStyle(document.body).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
    await expect(obs.locator("button,input,select,summary")).toHaveCount(0);
    await expect(overlay(obs)).not.toContainText(/Phare|Fusée/);
  } finally {
    await observer.close();
  }
});

test("six experiences run a real invited game with a focused GM, private companion, full result and stable spectator view", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  const native: string[] = [];
  page.on("dialog", async (d) => {
    native.push(d.type());
    await d.dismiss();
  });
  try {
    await page.goto("/");
    await page
      .getByRole("link", {
        name: "Préparer une partie Undercover",
        exact: true,
      })
      .click();
    await fits(page);
    await page.screenshot({
      path: info.outputPath("configuration.png"),
      fullPage: true,
    });

    await openPreparedSalon(page);
    await expect(page.locator('[data-experience="salon"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Préparer la partie", exact: true }),
    ).toBeDisabled();
    const invitation = await page
      .getByLabel("Invitation des joueurs", { exact: true })
      .inputValue();
    const id = page.url().split("/").at(-2)!;
    const players: Page[] = [];
    for (let i = 1; i <= 3; i++) {
      const c = await browser.newContext({ viewport: page.viewportSize() });
      contexts.push(c);
      const p = await c.newPage();
      players.push(p);
      await p.goto(invitation);
      await p.getByLabel("Votre nom", { exact: true }).fill(`Invité ${i}`);
      await p
        .getByRole("button", { name: "Rejoindre la partie", exact: true })
        .click();
      await expect(p.getByTestId("session-connection")).toHaveText(
        "Synchronisé",
      );
      await expect(p.locator('[data-experience="player"]')).toBeVisible();
      await expect(
        p.getByRole("navigation", { name: "Navigation de la session" }),
      ).toHaveCount(0);
    }
    await players[0]!
      .getByRole("button", { name: "Je suis prêt", exact: true })
      .click();
    await expect(
      page.locator(".lobby-players li").filter({ hasText: "Invité 1" }).first(),
    ).toContainText("Prêt");
    await page.screenshot({
      path: info.outputPath("salon.png"),
      fullPage: true,
      mask: [page.locator(".copy-block input,.invitation-code")],
    });
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    await expect(page.locator('[data-experience="gm"]')).toBeVisible();
    const main = page.getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    });
    await expect(main).toBeVisible();
    if ((page.viewportSize()?.height ?? 0) >= 800)
      expect(
        (await main.boundingBox())!.y + (await main.boundingBox())!.height,
      ).toBeLessThan(page.viewportSize()!.height);
    await page.screenshot({
      path: info.outputPath("regie-preparation.png"),
      fullPage: true,
    });
    await expect(players[0]!.getByLabel("Votre carte privée")).toBeVisible();
    await players[0]!.screenshot({
      path: info.outputPath("joueur-preparation.png"),
      fullPage: true,
    });
    await main.click();
    await expect(page.locator(".speaker-focus")).toHaveText("Invité 1");
    await expect(
      page.getByRole("button", {
        name: "Confirmer l’indice et passer au suivant",
        exact: true,
      }),
    ).toBeEnabled();
    const toast = page.getByRole("button", {
      name: "Fermer la notification",
      exact: true,
    });
    if (await toast.count()) await toast.click();
    await page.screenshot({
      path: info.outputPath("regie.png"),
      fullPage: true,
    });
    const privateCard = players[0]!.getByLabel("Votre carte privée");
    await expect(privateCard.locator(".game-values article")).toHaveCount(1);
    await players[0]!
      .getByRole("button", { name: "Masquer mon mot", exact: true })
      .click();
    await expect(privateCard.locator(".game-values")).toHaveCount(0);
    await players[0]!
      .getByRole("button", { name: "Voir mon mot", exact: true })
      .click();
    await expect(privateCard.locator(".game-values article")).toHaveCount(1);
    for (const theme of ["broadcast-studio", "neon-show", "on-air-premium"]) {
      await chooseTheme(players[0]!, theme);
      await expect(privateCard.locator(".game-values article")).toHaveCount(1);
      await fits(players[0]!);
    }
    await players[0]!.screenshot({
      path: info.outputPath("joueur.png"),
      fullPage: true,
    });
    await page
      .getByText("Informations privées du Game Master", { exact: true })
      .click();
    const intrus = (await page
      .locator(".gm-secrets li")
      .filter({ hasText: /: Undercover$/ })
      .textContent())!.split(" : ")[0]!;
    const c = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    contexts.push(c);
    const obs = await c.newPage();
    await obs.goto(`/sessions/${id}/obs`);
    await expect(obs.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(overlay(obs)).not.toContainText(/Phare|Fusée/);
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 0; i < 3; i++) {
      const target =
        intrus === `Invité ${i + 1}` ? `Invité ${i === 0 ? 2 : 1}` : intrus;
      expect(
        await players[i]!.getByRole("radio")
          .first()
          .evaluate((radio) => {
            const card = document.querySelector(".personal-card");
            return (
              !!card &&
              !!(
                radio.compareDocumentPosition(card) &
                Node.DOCUMENT_POSITION_FOLLOWING
              )
            );
          }),
      ).toBe(true);
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
    await page
      .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(overlay(obs)).toContainText("Victoire des civils");
    await expect(overlay(obs)).toContainText(/Phare|Fusée/);
    const finishedUrl = page.url();
    await page.goto("/");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Votre dernière partie est terminée." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Reprendre ma partie", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", {
        name: "Préparer une partie Undercover",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(finishedUrl);
    await fits(page);
    await obs.screenshot({
      path: info.outputPath("obs-final.png"),
      omitBackground: true,
    });
    await openGmReplay(page);
    await page
      .getByRole("button", { name: "Rejouer cette manche", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(overlay(obs)).toHaveAttribute("data-phase", "preparation");
    await expect(privateCard).toContainText("Le GM va vous distribuer");
    await expect(
      page
        .getByRole("navigation", { name: "Navigation de la session" })
        .getByRole("link", { name: "Joueurs", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Navigation de la session" })
      .getByRole("link", { name: "Joueurs", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      }),
    ).toBeHidden();
    expect(native).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("a browser without stored preferences has a deterministic default and unavailable storage does not break gameplay navigation", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "broadcast-studio",
  );
  await page.evaluate(() =>
    localStorage.setItem("xt:theme:application", "not-an-official-theme"),
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    "broadcast-studio",
  );
  const blocked = await browser.newContext({ viewport: page.viewportSize() });
  try {
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage unavailable", "SecurityError");
        },
      }),
    );
    const p = await blocked.newPage();
    await p.goto("/");
    await chooseTheme(p, "on-air-premium");
    await p.getByLabel("Apparence de l’application", { exact: true }).click();
    await expect(p.getByRole("status")).toContainText(
      "Thème appliqué pour cet onglet",
    );
    await fits(p);
    await p
      .getByRole("link", {
        name: "Préparer une partie Undercover",
        exact: true,
      })
      .click();
    await expect(
      p.getByRole("heading", {
        name: "Manche 1",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await blocked.close();
  }
});

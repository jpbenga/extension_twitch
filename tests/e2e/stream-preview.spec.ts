import { createUndercoverLayout } from "@extension-twitch/contracts/undercover-layout";
import { launchPrepareDemo, openPrepareDemo } from "./undercover-helpers.js";
import { openGmReplay } from "./undercover-helpers.js";
import {
  openUndercoverOptions,
  openLabAccess,
  openLabPlayers,
  openBroadcastHelp,
} from "./undercover-helpers.js";
import {
  test as base,
  expect,
  type Page,
  type BrowserContext,
} from "@playwright/test";
import { completeClues } from "./turn-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";
const test = base.extend<{
  open: (
    href: string,
    phone?: boolean,
    before?: (page: Page) => void,
  ) => Promise<Page>;
}>({
  open: async ({ browser, page }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async (href, phone = false, before) => {
        const context = await browser.newContext({
          viewport: phone ? { width: 390, height: 844 } : page.viewportSize(),
          hasTouch: phone,
          isMobile: phone,
        });
        contexts.push(context);
        const next = await context.newPage();
        before?.(next);
        await next.goto(href);
        return next;
      });
    } finally {
      await Promise.all(contexts.map((c) => c.close()));
    }
  },
});
async function demo(page: Page, count = 3, long = false) {
  await page.goto("/play/undercover");
  await openPrepareDemo(page);
  await page
    .getByLabel("Joueurs de démonstration", { exact: true })
    .fill(String(count));
  await openUndercoverOptions(page);
  await page
    .getByLabel("Nom du contenu A", { exact: true })
    .fill(long ? "C".repeat(80) : "SECRET CIVIL");
  await page
    .getByLabel("Nom du contenu B", { exact: true })
    .fill(long ? "U".repeat(80) : "SECRET INTRUS");
  await launchPrepareDemo(page);
  await expect(page).toHaveURL(/\/play\/lab\//);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  return page.url().split("/").pop()!;
}
async function gmLink(page: Page) {
  await openLabAccess(page);
  return (await page
    .getByRole("link", {
      name: "Ouvrir la régie sur cet appareil",
      exact: true,
    })
    .getAttribute("href"))!;
}
async function playerLink(page: Page, n: number) {
  await openLabPlayers(page);
  return (await page
    .getByRole("link", { name: `Ouvrir Joueur ${n} séparément`, exact: true })
    .getAttribute("href"))!;
}
// Keep complete legacy broadcast/reconnection coverage; TV v2 publication is covered by tv-undercover.spec.ts.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (layout) =>
      sessionStorage.setItem(
        "xt:official:undercover:layout",
        JSON.stringify(layout),
      ),
    createUndercoverLayout(),
  );
});
const overlay = (page: Page) =>
  page.getByLabel("Overlay public de l’émission", { exact: true });
const synced = async (page: Page) =>
  expect(page.getByTestId("broadcast-connection")).toHaveText("Synchronisé");
async function durableMarkup(page: Page) {
  return overlay(page).evaluate((el) => {
    const copy = el.cloneNode(true) as Element;
    copy.querySelectorAll(".broadcast-cue").forEach((node) => node.remove());
    return copy.outerHTML;
  });
}
async function vote(page: Page, target: string) {
  await page.getByRole("radio", { name: target, exact: true }).check();
  await page.getByRole("button", { name: "Voter", exact: true }).click();
  await acceptConfirmation(page);
  await expect(
    page.getByRole("status").filter({ hasText: /Votre vote pour/ }),
  ).toBeVisible();
}

test("a complete real Undercover show shares one public renderer between preview, OBS and the multi-role lab", async ({
  page,
  open,
}, info) => {
  const id = await demo(page);
  const gm = await open(await gmLink(page), true);
  await expect(gm.getByTestId("session-connection")).toHaveText("Synchronisé");
  const players: Page[] = [];
  for (let i = 1; i <= 3; i++) {
    const p = await open(await playerLink(page, i));
    await expect(p.getByTestId("session-connection")).toHaveText("Synchronisé");
    players.push(p);
  }
  const privateRequests: string[] = [];
  const observe = (client: Page) =>
    client.on("request", (r) => {
      if (r.url().includes("/private") || r.url().includes("/commands"))
        privateRequests.push(r.url());
    });
  const preview = await open(`/sessions/${id}/stream`, false, observe),
    obs = await open(`/sessions/${id}/obs`, false, observe);
  await synced(preview);
  await synced(obs);
  await expect(preview.getByTestId("broadcast-cue")).toHaveCount(0);
  await expect(obs.locator("button,input,select,textarea")).toHaveCount(0);
  await expect(overlay(obs)).toHaveAttribute("data-renderer", "broadcast-v1");
  await gm
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(overlay(preview)).toHaveAttribute("data-phase", "discussion");
  await expect(preview.getByTestId("broadcast-cue")).toContainText(
    "Discussion",
  );
  for (const client of [preview, obs])
    await expect(overlay(client)).not.toContainText(
      /SECRET CIVIL|SECRET INTRUS/,
    );
  const publicResponse = await preview.request.get(
    `/api/server/sessions/${id}/public`,
  );
  expect(publicResponse.status()).toBe(200);
  expect(JSON.stringify(await publicResponse.json())).not.toMatch(
    /SECRET CIVIL|SECRET INTRUS|invitationCode|preparedGame|management/,
  );
  await gm
    .getByText("Informations privées du Game Master", { exact: true })
    .click();
  const intrus = (await gm
    .locator(".gm-secrets li")
    .filter({ hasText: /: Undercover$/ })
    .textContent())!.split(" : ")[0]!;
  await completeClues(gm);
  await expect(preview.getByTestId("broadcast-turns")).toContainText(
    "Indices terminés",
  );
  await gm
    .getByRole("button", { name: "Ouvrir les votes", exact: true })
    .click();
  for (let i = 0; i < 3; i++) {
    await vote(
      players[i]!,
      intrus === `Joueur démo ${i + 1}`
        ? `Joueur démo ${i === 0 ? 2 : 1}`
        : intrus,
    );
    await expect(preview.getByTestId("broadcast-votes")).toHaveText(
      `${i + 1} / 3 votes reçus`,
    );
    await expect(obs.getByTestId("broadcast-votes")).toHaveText(
      `${i + 1} / 3 votes reçus`,
    );
  }
  await expect
    .poll(async () => durableMarkup(obs))
    .toBe(await durableMarkup(preview));
  const late = await open(`/sessions/${id}/obs`);
  await synced(late);
  await expect(late.getByTestId("broadcast-votes")).toHaveText(
    "3 / 3 votes reçus",
  );
  await expect(late.getByTestId("broadcast-cue")).toHaveCount(0);
  await gm
    .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
    .click();
  await acceptConfirmation(gm);
  await expect(overlay(preview)).toHaveAttribute("data-phase", "finished");
  await expect(preview.getByTestId("broadcast-cue")).toContainText(
    "Victoire des civils",
  );
  await expect(overlay(obs)).toContainText("Victoire des civils");
  await expect(overlay(obs)).toContainText("SECRET CIVIL");
  await expect
    .poll(async () => durableMarkup(obs))
    .toBe(await durableMarkup(preview));
  await preview.screenshot({
    path: info.outputPath("emission-finale.png"),
    fullPage: true,
  });
  await obs.setViewportSize({ width: 1920, height: 1080 });
  const bounds = await obs.getByTestId("broadcast-frame").boundingBox();
  expect(bounds).toMatchObject({ width: 1920, height: 1080 });
  expect(
    await obs.evaluate(() => [
      getComputedStyle(document.documentElement).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    ]),
  ).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  await obs.screenshot({
    path: info.outputPath("obs-final-transparent.png"),
    omitBackground: true,
  });
  await openGmReplay(gm);
  await gm
    .getByRole("button", { name: "Rejouer cette partie", exact: true })
    .click();
  await acceptConfirmation(gm);
  await expect(overlay(obs)).toHaveAttribute("data-phase", "preparation");
  await expect(overlay(preview)).not.toContainText(
    /SECRET CIVIL|SECRET INTRUS|Victoire des civils/,
  );
  await expect(preview.getByTestId("broadcast-cue")).toHaveCount(0, {
    timeout: 5000,
  });
  expect(privateRequests).toEqual([]);
});

test("a disconnected preview clears transient animations, restores current state and does not replay offline events", async ({
  page,
  browser,
  open,
}) => {
  const id = await demo(page);
  const gm = await open(await gmLink(page), true);
  const context = await browser.newContext({ viewport: page.viewportSize() });
  try {
    await context.addInitScript(() => {
      const original = window.fetch.bind(window);
      let blocked = false;
      let active: AbortController | null = null;
      Object.defineProperty(window, "testBroadcastNetwork", {
        value: {
          cut: () => {
            blocked = true;
            active?.abort();
          },
          resume: () => {
            blocked = false;
          },
        },
      });
      window.fetch = (input, options) => {
        if (String(input).endsWith("/public/events")) {
          if (blocked)
            return Promise.reject(new TypeError("Test network interruption"));
          active = new AbortController();
          return original(input, {
            ...options,
            signal: options?.signal
              ? AbortSignal.any([active.signal, options.signal])
              : active.signal,
          });
        }
        return original(input, options);
      };
    });
    const preview = await context.newPage();
    await preview.goto(`/sessions/${id}/stream`);
    await synced(preview);
    await gm
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    await expect(preview.getByTestId("broadcast-cue")).toBeVisible();
    await preview.evaluate(() =>
      (
        window as unknown as { testBroadcastNetwork: { cut: () => void } }
      ).testBroadcastNetwork.cut(),
    );
    await expect(preview.getByTestId("broadcast-connection")).toHaveText(
      "Reconnexion…",
    );
    await expect(preview.getByTestId("broadcast-cue")).toHaveCount(0);
    for (let i = 0; i < 2; i++) {
      await gm
        .getByRole("button", {
          name: "Confirmer l’indice et passer au suivant",
          exact: true,
        })
        .click();
      await expect(gm.locator("#game .turn-progress")).toHaveAttribute(
        "data-completed",
        String(i + 1),
      );
    }
    await preview.evaluate(() =>
      (
        window as unknown as { testBroadcastNetwork: { resume: () => void } }
      ).testBroadcastNetwork.resume(),
    );
    await synced(preview);
    await expect(preview.getByTestId("broadcast-turns")).toContainText(
      "2 / 3 passages",
    );
    await expect(preview.getByTestId("broadcast-cue")).toHaveCount(0);
    await preview.emulateMedia({ reducedMotion: "reduce" });
    await gm
      .getByRole("button", {
        name: "Confirmer l’indice et passer au suivant",
        exact: true,
      })
      .click();
    await expect(preview.getByTestId("broadcast-cue")).toBeVisible();
    expect(
      await preview
        .getByTestId("broadcast-cue")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
  } finally {
    await context.close();
  }
});

test("spectator testing is honestly read-only, the comparison is public and the canvas fits twelve players", async ({
  page,
  open,
}, info) => {
  const id = await demo(page, 12, true);
  const preview = await open(`/sessions/${id}/stream`);
  await synced(preview);
  await openBroadcastHelp(preview);
  await expect(
    preview.getByLabel("Interface spectateur de test"),
  ).toContainText("Aucune action spectateur n’est autorisée");
  await expect(
    preview
      .getByLabel("Interface spectateur de test")
      .locator("button,input,select"),
  ).toHaveCount(0);
  await preview
    .getByRole("button", { name: "Overlay seul", exact: true })
    .click();
  await expect(preview.locator(".broadcast-checker")).toBeVisible();
  await expect(preview.locator(".broadcast-demo-scene")).toHaveCount(0);
  await expect(
    overlay(preview).locator(".broadcast-roster article"),
  ).toHaveCount(12);
  expect(
    await preview.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bounds = await preview.getByTestId("broadcast-frame").boundingBox();
  expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 2);
  if (info.project.name === "desktop") {
    await page
      .getByLabel("Perspective du laboratoire", { exact: true })
      .selectOption({ label: "Joueur 1" });
    await expect(page.locator(".lab-identity")).toContainText(
      "Vous incarnez Joueur 1",
    );
    await page
      .getByLabel("Afficher le plateau à côté sur ordinateur", { exact: true })
      .check();
    await expect(
      page
        .getByLabel("Plateau public comparatif")
        .getByLabel("Overlay public de l’émission"),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("joueur-et-emission.png"),
      fullPage: true,
    });
  }
  await preview
    .getByRole("button", { name: "Scène fictive", exact: true })
    .click();
  await preview.screenshot({
    path: info.outputPath("emission-douze-joueurs.png"),
    fullPage: true,
  });
});

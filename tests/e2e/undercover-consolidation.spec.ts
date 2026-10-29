import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createUndercoverLayout } from "@extension-twitch/contracts/undercover-layout";
import { officialTvFixture } from "./undercover-tv-fixture.js";
import { acceptConfirmation } from "./dialog-helpers.js";
import { openPrepareDemo } from "./undercover-helpers.js";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
});
async function shot(p: Page, info: TestInfo, name: string) {
  await expect
    .poll(() =>
      p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({
    path:
      process.env.CAPTURE_CONSOLIDATION === "1"
        ? `docs/ux/implementation/undercover-consolidation-motion/${name}-${info.project.name}.png`
        : info.outputPath(`${name}.png`),
    fullPage: true,
    animations: "disabled",
    mask: [p.locator(".copy-block input,.invitation-code")],
  });
  if (
    info.project.name === "mobile" &&
    process.env.CAPTURE_CONSOLIDATION === "1"
  )
    await p.screenshot({
      path: `docs/ux/implementation/undercover-consolidation-motion/${name}-mobile-viewport.png`,
      animations: "disabled",
    });
}
async function image(page: Page) {
  return Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 210;
      const x = c.getContext("2d")!;
      x.fillStyle = "#594c85";
      x.fillRect(0, 0, 320, 210);
      x.fillStyle = "#b396ff";
      x.beginPath();
      x.arc(160, 105, 65, 0, Math.PI * 2);
      x.fill();
      return c.toDataURL().split(",")[1]!;
    }),
    "base64",
  );
}
async function fillPair(p: Page, a: string, b: string) {
  await p.getByLabel("Nom du contenu A", { exact: true }).fill(a);
  await p.getByLabel("Nom du contenu B", { exact: true }).fill(b);
}
async function diffusion(p: Page) {
  const options = p.locator(".consolidation-options");
  await expect(options).toBeAttached();
  if ((await options.count()) && (await options.getAttribute("open")) === null)
    await options.locator(":scope>summary").click();
  const settings = p.locator(".series-editor-settings");
  if (
    (await settings.count()) &&
    (await settings.getAttribute("open")) === null
  )
    await settings.locator(":scope>summary").click();
  await p.getByRole("button", { name: "Diffusion", exact: true }).click();
  await expect(
    p.getByRole("heading", { name: "Diffusion", exact: true }),
  ).toBeVisible();
}
test("approved content-first preparation, conductor, independent edits, reuse, recovery and confirmation remain real", async ({
  page,
}, info) => {
  const creates: string[] = [];
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      r.url().endsWith("/official-games/undercover/sessions")
    )
      creates.push(r.url());
  });
  await page.goto("/play/undercover?view=prepare");
  await fillPair(page, "Phare", "Balise");
  const buffer = await image(page);
  for (const side of ["A", "B"])
    await page
      .getByLabel(`Image du contenu ${side}`, { exact: true })
      .setInputFiles({ name: `${side}.png`, mimeType: "image/png", buffer });
  await page
    .getByRole("button", {
      name: "Diminuer le nombre de participants",
      exact: true,
    })
    .click();
  await shot(page, info, "ac1");
  expect(
    (await page.getByLabel("Nom du contenu A").boundingBox())!.y,
  ).toBeLessThan(
    (await page.getByLabel("Participants prévus").boundingBox())!.y,
  );
  await page
    .getByRole("button", { name: "Ajouter cette manche", exact: true })
    .click();
  await page
    .getByLabel("Nom de la partie", { exact: true })
    .fill("Stream du vendredi");
  for (const pair of [
    ["Train", "Tram"],
    ["Paris", "Lyon"],
  ]) {
    await page
      .getByRole("button", { name: "＋ Ajouter une manche", exact: true })
      .click();
    await fillPair(page, pair[0]!, pair[1]!);
    await page
      .getByRole("button", { name: "Ajouter cette manche", exact: true })
      .click();
  }
  await shot(page, info, "ac2");
  await page
    .getByRole("button", { name: "Monter la manche 3", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li").nth(1)).toContainText(
    "Paris / Lyon",
  );
  await page.getByLabel("Options de la manche 1", { exact: true }).click();
  await page
    .locator(".series-row-menu[open]")
    .getByRole("button", { name: "Dupliquer", exact: true })
    .click();
  await page
    .locator(".series-runlist>li")
    .nth(1)
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await page.getByLabel("Nom du contenu A", { exact: true }).fill("Océan");
  await shot(page, info, "ac3");
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li").first()).toContainText(
    "Phare / Balise",
  );
  await page.getByLabel("Options de la manche 2", { exact: true }).click();
  await page
    .locator(".series-row-menu[open]")
    .getByRole("button", { name: "Retirer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Retirer cette manche");
  await shot(page, info, "ac14");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Annuler", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(4);
  await page.getByLabel("Options de la manche 2", { exact: true }).click();
  // The details may already be open after cancelling; restore its real open state if necessary.
  const menu = page.locator(".series-row-menu").nth(1);
  if ((await menu.getAttribute("open")) === null)
    await menu.locator(":scope>summary").click();
  await menu.getByRole("button", { name: "Retirer", exact: true }).click();
  await acceptConfirmation(page);
  await expect(page.locator(".series-runlist>li")).toHaveCount(3);
  await page
    .getByRole("button", {
      name: "Réutiliser une ancienne manche",
      exact: true,
    })
    .click();
  await shot(page, info, "ac4");
  await page.getByLabel("Copie du contenu A", { exact: true }).fill("Glacier");
  await page
    .getByRole("button", { name: "Ajouter cette manche", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(4);
  await page.reload();
  await expect(
    page.getByLabel("Nom de la partie", { exact: true }),
  ).toHaveValue("Stream du vendredi");
  expect(creates).toHaveLength(0);
  // Only the fixture's optional local image is removed; product state is not injected.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("extension-twitch-undercover-series", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["library", "images"], "readwrite"),
        r = tx.objectStore("library").get("current");
      r.onsuccess = () =>
        tx
          .objectStore("images")
          .delete(r.result.series[0].preparations[0].contents.a.imageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await page
    .locator(".series-runlist>li")
    .first()
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await expect(page.locator(".series-image.is-missing")).toHaveCount(1);
  await shot(page, info, "ac5");
  await page
    .getByLabel("Image du contenu A", { exact: true })
    .setInputFiles({ name: "reconnected.png", mimeType: "image/png", buffer });
  await expect(page.locator(".series-image.is-missing")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Enregistrer la manche", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Vérifier la partie", exact: true })
    .click();
  await shot(page, info, "ac6");
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  expect(creates).toHaveLength(1);
  const empty = await page.evaluate(async () => {
    const id = location.pathname.split("/")[2]!;
    const r = await fetch(`/api/server/sessions/${id}/private`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:gm`)}`,
      },
    });
    const v = await r.json();
    return {
      participants: v.participants.length,
      phase: v.phase,
      game: !!v.game,
    };
  });
  expect(empty).toEqual({ participants: 0, phase: "lobby", game: false });
});
test("broadcast entry preserves legacy coordinates and explicitly adopts, previews and restores TV without publication", async ({
  page,
}, info) => {
  const legacy = createUndercoverLayout();
  legacy.widgets.header.x = 76;
  legacy.widgets.header.width = 1760;
  await page.addInitScript((l) => {
    sessionStorage.setItem("xt:official:undercover:layout", JSON.stringify(l));
    sessionStorage.setItem(
      "xt:official:undercover:broadcast-theme",
      "neon-show",
    );
  }, legacy);
  await page.goto("/play/undercover?view=prepare");
  await diffusion(page);
  await shot(page, info, "ac7-legacy");
  await page
    .getByRole("button", {
      name: "Découvrir le nouvel habillage TV",
      exact: true,
    })
    .click();
  await shot(page, info, "ac8");
  await page
    .getByRole("button", { name: "Voir le nouvel habillage", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Fermer l’aperçu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Garder ma disposition", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Découvrir le nouvel habillage TV",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Utiliser cet habillage", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Habillage TV", exact: true }),
  ).toBeVisible();
  await shot(page, info, "ac7");
  await page
    .getByLabel("Mode public", { exact: true })
    .selectOption("assignments");
  await page
    .getByRole("button", { name: "Enregistrer la diffusion", exact: true })
    .click();
  await expect(page.locator(".series-notice")).toContainText(
    "Aucun contenu n’a été publié",
  );
  await diffusion(page);
  await page.reload();
  await expect(page.getByLabel("Mode public", { exact: true })).toHaveValue(
    "assignments",
  );
  await page
    .getByRole("button", {
      name: "Retrouver ma disposition précédente",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ajustements avancés", exact: true })
    .click();
  await expect(
    page.getByLabel("Bloc à ajuster", { exact: true }),
  ).toBeVisible();
  const snapshot = (await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((r) => {
      const q = indexedDB.open("extension-twitch-undercover-series", 1);
      q.onsuccess = () => r(q.result);
    });
    const value = await new Promise<unknown>((r) => {
      const q = db.transaction("library").objectStore("library").get("current");
      q.onsuccess = () => r(q.result);
    });
    db.close();
    return value;
  })) as {
    series: {
      draft: {
        overlayLayout: typeof legacy;
        previousOverlayLayout: typeof legacy;
      };
    }[];
  };
  expect(snapshot.series[0]!.draft.overlayLayout).toEqual(legacy);
  expect(snapshot.series[0]!.draft.previousOverlayLayout.schemaVersion).toBe(2);
  // A second explicit adoption must back up the restored custom layout again.
  await page
    .getByRole("button", { name: "Revenir à la diffusion", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Découvrir le nouvel habillage TV",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Utiliser cet habillage", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Retrouver ma disposition précédente",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Ajustements avancés", exact: true })
    .click();
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  await expect(page.getByLabel("Titre · Gauche", { exact: true })).toHaveValue(
    "76",
  );
});
test("preview returns to verified GM or lab context and never promotes a public reader", async ({
  page,
  browser,
  request,
}, info) => {
  const f = await officialTvFixture(request);
  await page.goto(`/sessions/${f.id}/gm#access=${f.token}`);
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await page.getByLabel("Options de la partie", { exact: true }).click();
  await shot(page, info, "ac9-supported-menu");
  await page.goto(`/sessions/${f.id}/stream?from=lab`);
  await expect(
    page.getByRole("link", { name: "← Régie", exact: true }),
  ).toHaveAttribute("href", `/sessions/${f.id}/gm#board`);
  await shot(page, info, "preview-gm-return");
  await page.evaluate(
    (id) =>
      sessionStorage.setItem(`xt:creator:lab:${id}`, "invalid lab record"),
    f.id,
  );
  await page.reload();
  await expect(
    page.getByRole("link", { name: "← Régie", exact: true }),
  ).toHaveAttribute("href", `/sessions/${f.id}/gm#board`);

  const pc = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  const pub = await pc.newPage();
  await pub.goto(`/sessions/${f.id}/stream?from=gm`);
  await expect(
    pub.getByRole("link", { name: "← Plateau public", exact: true }),
  ).toHaveAttribute("href", `/sessions/${f.id}/public`);
  expect(
    await pub.getByRole("link", { name: "← Régie", exact: true }).count(),
  ).toBe(0);
  await pub.evaluate(
    (id) => sessionStorage.setItem(`xt:access:${id}:gm`, "x".repeat(43)),
    f.id,
  );
  const denied = pub.waitForResponse(
    (r) =>
      r.url().endsWith(`/sessions/${f.id}/private`) &&
      r.request().method() === "GET",
  );
  await pub.reload();
  expect((await denied).status()).toBe(401);
  await expect(
    pub.getByRole("link", { name: "← Plateau public", exact: true }),
  ).toHaveAttribute("href", `/sessions/${f.id}/public`);
  await expect(
    pub.getByRole("link", { name: "← Régie", exact: true }),
  ).toHaveCount(0);
  await pc.close();
  await page.goto("/play/undercover?view=prepare");
  await openPrepareDemo(page);
  await page
    .getByRole("button", {
      name: "Lancer une partie de démonstration",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/play\/lab\//);
  const id = page.url().split("/").at(-1)!;
  await page.goto(`/sessions/${id}/stream?from=lab`);
  await expect(
    page.getByRole("link", { name: "← Retour au laboratoire", exact: true }),
  ).toHaveAttribute("href", `/play/lab/${id}`);
});

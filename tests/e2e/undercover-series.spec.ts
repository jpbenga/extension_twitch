import { test, expect, type Page, type TestInfo } from "@playwright/test";
async function start(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto("/play/undercover");
  await expect(
    page.getByRole("heading", { name: "Préparer une partie", exact: true }),
  ).toBeVisible();
}
async function picture(page: Page, color: string) {
  return Buffer.from(
    await page.evaluate((c) => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(160, 120, 64, 0, Math.PI * 2);
      ctx.fill();
      return canvas.toDataURL("image/png").split(",")[1]!;
    }, color),
    "base64",
  );
}
async function editContents(page: Page, a: string, b: string, images = false) {
  await page
    .getByRole("button", { name: "Modifier les contenus", exact: true })
    .click();
  await page.getByLabel("Nom du contenu A", { exact: true }).fill(a);
  await page.getByLabel("Nom du contenu B", { exact: true }).fill(b);
  if (images) {
    await page.getByLabel("Image du contenu A", { exact: true }).setInputFiles({
      name: "contenu-a.png",
      mimeType: "image/png",
      buffer: await picture(page, "#336677"),
    });
    await page.getByLabel("Image du contenu B", { exact: true }).setInputFiles({
      name: "contenu-b.png",
      mimeType: "image/png",
      buffer: await picture(page, "#997733"),
    });
  }
}
async function shot(page: Page, info: TestInfo, name: string) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path:
      process.env.CAPTURE_SERIES === "1"
        ? `docs/ux/implementation/undercover-stream-series/${name}-${info.project.name}.png`
        : info.outputPath(`${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
  if (info.project.name === "mobile" && process.env.CAPTURE_SERIES === "1") {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `docs/ux/implementation/undercover-stream-series/${name}-mobile-viewport.png`,
      animations: "disabled",
    });
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.screenshot({
      path: `docs/ux/implementation/undercover-stream-series/${name}-mobile-viewport-bottom.png`,
      animations: "disabled",
    });
  }
}
async function add(page: Page, a: string, b: string, images = false) {
  await editContents(page, a, b, images);
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter à la série", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li").last()).toContainText(
    `${a} / ${b}`,
  );
}
async function library(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("extension-twitch-undercover-series", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const r = db
          .transaction("library")
          .objectStore("library")
          .get("current");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  });
}
test("real local series persist names, ordered independent copies and reused content across pages and browser tabs", async ({
  page,
  context,
}, info) => {
  await start(page);
  await expect(
    page.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("4");
  await expect(
    page.getByRole("radio", { name: "2 tours d’indices", exact: true }),
  ).toBeChecked();
  await shot(page, info, "a1");
  await editContents(page, "Océan", "Rivière", true);
  await expect(page.locator(".series-editor-grid img")).toHaveCount(2);
  await shot(page, info, "a2");
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter à la série", exact: true })
    .click();
  await page
    .getByLabel("Nom de la série", { exact: true })
    .fill("Mon émission de test");
  await page
    .getByRole("button", { name: "＋ Ajouter une partie", exact: true })
    .click();
  await add(page, "Désert", "Forêt");
  await page.getByLabel("Options de la partie 1", { exact: true }).click();
  await page
    .locator(".series-row-menu[open]")
    .getByRole("button", { name: "Dupliquer", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(3);
  await page
    .locator(".series-runlist>li")
    .nth(1)
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await page.getByLabel("Nom du contenu A", { exact: true }).fill("Glacier");
  await page
    .getByRole("button", { name: "Retirer l’image A", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li").first()).toContainText(
    "Océan / Rivière",
  );
  await page.getByLabel("Descendre la partie 2", { exact: true }).click();
  await expect(page.locator(".series-row-title>strong")).toHaveText([
    "Océan / Rivière",
    "Désert / Forêt",
    "Glacier / Rivière",
  ]);
  await expect(
    page.getByLabel("Monter la partie 1", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Descendre la partie 3", { exact: true }),
  ).toBeDisabled();
  await shot(page, info, "a3");
  await page.getByLabel("Options de la partie 2", { exact: true }).click();
  await page
    .locator(".series-row-menu[open]")
    .getByRole("button", { name: "Retirer", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Annuler le retrait", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(3);
  await page
    .getByRole("button", {
      name: "Réutiliser une ancienne partie",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: /Océan \/ Rivière/,
      exact: true,
    })
    .click();
  await page.getByLabel("Copie du contenu A", { exact: true }).fill("Mangrove");
  await shot(page, info, "a4");
  await page
    .getByRole("button", { name: "Ajouter cette partie", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(4);
  await expect(page.locator(".series-runlist>li").first()).toContainText(
    "Océan / Rivière",
  );
  await expect(page.locator(".series-runlist>li").last()).toContainText(
    "Mangrove / Rivière",
  );
  const url = page.url();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(url);
  await expect(
    reopened.getByLabel("Nom de la série", { exact: true }),
  ).toHaveValue("Mon émission de test");
  await expect(reopened.locator(".series-runlist>li")).toHaveCount(4);
  expect(JSON.stringify(await library(reopened))).toContain("Mangrove");
});
test("missing optional images preserve text, reconnect independently and open one real empty salon without distribution", async ({
  page,
}, info) => {
  await start(page);
  await add(page, "Phare", "Balise", true);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("extension-twitch-undercover-series", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["library", "images"], "readwrite");
      const get = tx.objectStore("library").get("current");
      get.onsuccess = () => {
        const library = get.result;
        const p = library.series[0].preparations[0];
        tx.objectStore("images").delete(p.contents.a.imageId);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator(".series-runlist")).toContainText(
    "image à reconnecter",
  );
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await expect(page.locator(".series-image.is-missing")).toHaveCount(1);
  await expect(
    page.getByLabel("Nom du contenu A", { exact: true }),
  ).toHaveValue("Phare");
  await shot(page, info, "a5");
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Vérifier la série", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Votre série est prête", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".series-readiness")).toContainText("facultatif");
  await shot(page, info, "a6");
  const beforeReconnect = (await library(page)) as {
    series: { preparations: { contents: { b: { imageId: string } } }[] }[];
  };
  const untouchedB =
    beforeReconnect.series[0]!.preparations[0]!.contents.b.imageId;
  await page
    .getByRole("button", { name: "Reconnecter l’image", exact: true })
    .click();
  await page.getByLabel("Image du contenu A", { exact: true }).setInputFiles({
    name: "reconnexion.png",
    mimeType: "image/png",
    buffer: await picture(page, "#665588"),
  });
  await expect(page.locator(".series-editor-grid img")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  const afterReconnect = (await library(page)) as typeof beforeReconnect;
  expect(afterReconnect.series[0]!.preparations[0]!.contents.b.imageId).toBe(
    untouchedB,
  );
  await page
    .getByRole("button", { name: "Vérifier la série", exact: true })
    .click();
  let creates = 0;
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      r.url().endsWith("/official-games/undercover/sessions")
    )
      creates++;
  });
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  const result = await page.evaluate(async () => {
    const id = location.pathname.split("/")[2]!;
    const token = sessionStorage.getItem(`xt:access:${id}:gm`);
    const view = await (
      await fetch(`/api/server/sessions/${id}/private`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    const publicView = await (
      await fetch(`/api/server/sessions/${id}/public`)
    ).json();
    return { view, publicView };
  });
  expect(result.view.participants).toEqual([]);
  expect(result.view.game).toBeUndefined();
  expect(result.view.undercoverPreparation.contents.a.label).toBe("Phare");
  expect(result.publicView).not.toHaveProperty("undercoverPreparation");
  expect(JSON.stringify(result.publicView)).not.toContain("Balise");
  expect(creates).toBe(1);
  await page.goto("/play/undercover?view=series");
  await page
    .getByRole("button", { name: "Reprendre la partie", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  expect(creates).toBe(1);
});
test("invalid names and rejected images keep their independent editable text and never create a session", async ({
  page,
}) => {
  await start(page);
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await editContents(page, "Même nom", "Même nom");
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "deux noms différents",
  );
  await page.getByLabel("Nom du contenu B", { exact: true }).fill("Autre nom");
  await page.getByLabel("Image du contenu A", { exact: true }).setInputFiles({
    name: "image.png",
    mimeType: "image/png",
    buffer: Buffer.from("pas une image"),
  });
  await expect(page.locator("main [role=alert]")).toContainText(
    "ne peut pas être ouverte",
  );
  await expect(
    page.getByLabel("Nom du contenu A", { exact: true }),
  ).toHaveValue("Même nom");
  await page
    .getByRole("button", { name: "Enregistrer la partie", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Préparer une partie", exact: true }),
  ).toBeVisible();
  expect(posts).toBe(0);
});
test("concurrent tabs preserve their edits and can keep a separate series without overwriting the first", async ({
  page,
  context,
}) => {
  await start(page);
  const other = await context.newPage();
  await other.goto("/play/undercover");
  await expect(
    other.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("4");
  await page.getByLabel("Participants prévus", { exact: true }).fill("5");
  await expect
    .poll(async () => JSON.stringify(await library(page)))
    .toContain('"count":5');
  await other.getByLabel("Participants prévus", { exact: true }).fill("6");
  await expect(other.locator("main [role=alert]")).toContainText(
    "autre onglet",
  );
  await expect(
    other.getByLabel("Participants prévus", { exact: true }),
  ).toHaveValue("6");
  await other
    .getByRole("button", {
      name: "Conserver mes changements dans une nouvelle série",
      exact: true,
    })
    .click();
  await expect(other.locator("main [role=alert]")).toHaveCount(0);
  const stored = (await library(other)) as {
    series: { draft: { count: number } }[];
  };
  expect(stored.series.map((s) => s.draft.count)).toEqual([5, 6]);
});

test("the real series connects an invited game, isolated private media, public publication, a result, next preparation and replay", async ({
  page,
  browser,
}) => {
  const { completeClues } = await import("./turn-helpers.js");
  const { acceptConfirmation } = await import("./dialog-helpers.js");
  const { openGmReplay } = await import("./undercover-helpers.js");
  const contexts: import("@playwright/test").BrowserContext[] = [];
  await start(page);
  await add(page, "Phare", "Balise", true);
  await page
    .getByRole("button", { name: "＋ Ajouter une partie", exact: true })
    .click();
  await add(page, "Jardin", "Prairie", true);
  await page
    .getByRole("button", { name: "Vérifier la série", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ouvrir le salon", exact: true })
    .click();
  await expect(page).toHaveURL(/\/sessions\/[^/]+\/gm/);
  const id = page.url().split("/").at(-2)!,
    origin = new URL(page.url()).origin;
  const read = () =>
    page.evaluate(async () => {
      const id = location.pathname.split("/")[2]!;
      return (
        await fetch(`/api/server/sessions/${id}/private`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:gm`)}`,
          },
        })
      ).json();
    });
  const invitation = await page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
  try {
    const players: Page[] = [];
    for (let i = 1; i <= 3; i++) {
      const c = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
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
    }
    const viewer = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    contexts.push(viewer);
    const obs = await viewer.newPage();
    await obs.goto(`${origin}/sessions/${id}/obs`);
    await expect(obs.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await page
      .getByRole("button", { name: "Préparer la partie", exact: true })
      .click();
    expect((await read()).game.play.dealt).toBe(false);
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    const privateStates = [];
    for (const p of players) {
      const state = await p.evaluate(async () => {
        const [, , id, , pid] = location.pathname.split("/");
        return (
          await fetch(`/api/server/sessions/${id}/private`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:player:${pid}`)}`,
            },
          })
        ).json();
      });
      privateStates.push(state);
      await expect(p.locator(".private-content-image")).toBeVisible();
      expect(JSON.stringify(state)).not.toContain('"assignments"');
      expect(state.personalContent.label).toBe(
        state.game.values.find(
          (v: { id: string; value: unknown }) => v.id === "secret-word",
        ).value,
      );
    }
    expect(new Set(privateStates.map((p) => p.participantId)).size).toBe(3);
    const g = await read(),
      a = g.undercoverPreparation.contents.a,
      b = g.undercoverPreparation.contents.b;
    const civ = privateStates.find((p) => p.personalContent.id === a.id)!;
    const denied = await players[privateStates.indexOf(civ)]!.evaluate(
      async (url) => {
        const [, , id, , pid] = location.pathname.split("/");
        return (
          await fetch(url, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem(`xt:access:${id}:player:${pid}`)}`,
            },
          })
        ).status;
      },
      b.image.url,
    );
    expect(denied).toBe(403);
    const before = await (
      await obs.request.get(`${origin}/api/server/sessions/${id}/public`)
    ).json();
    expect(JSON.stringify(before)).not.toMatch(/Phare|Balise|Jardin|Prairie/);
    await page.locator(".gm-content-publication > summary").click();
    await page
      .getByRole("button", { name: "Montrer le duo anonyme", exact: true })
      .click();
    await expect(obs.locator(".tv-duo img")).toHaveCount(2);
    const duo = await (
      await obs.request.get(`${origin}/api/server/sessions/${id}/public`)
    ).json();
    expect(duo.undercoverBroadcast.mode).toBe("duo");
    expect(duo.undercoverBroadcast).not.toHaveProperty("assignments");
    await page
      .getByRole("button", { name: "Masquer les contenus", exact: true })
      .click();
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    for (let i = 0; i < 3; i++) {
      const p = players[i]!;
      await p
        .getByRole("radio", { name: `Invité ${i === 0 ? 2 : 1}`, exact: true })
        .check();
      await p.getByRole("button", { name: "Voter", exact: true }).click();
      await acceptConfirmation(p);
      await expect(
        p.getByRole("heading", { name: "Vote enregistré", exact: true }),
      ).toBeVisible();
    }
    await expect(obs.getByTestId("broadcast-votes")).toHaveText(
      "3 / 3 votes reçus",
    );
    await page
      .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(
      page.getByRole("button", { name: "Partie suivante", exact: true }),
    ).toBeVisible();
    await expect(obs.locator(".tv-final-card")).toHaveCount(3);
    const original = await read();
    await page
      .getByRole("button", { name: "Partie suivante", exact: true })
      .click();
    await acceptConfirmation(page);
    await expect(
      page.getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      }),
    ).toBeEnabled();
    const next = await read();
    expect(next.undercoverPreparation.series.position).toBe(2);
    expect(next.game.play.dealt).toBe(false);
    expect(next.participants.map((p: { id: string }) => p.id)).toEqual(
      original.participants.map((p: { id: string }) => p.id),
    );
    await expect(obs.locator(".broadcast-tv")).not.toContainText(
      /Jardin|Prairie|Phare|Balise/,
    );
    await openGmReplay(page);
    await page
      .getByRole("button", { name: "Rejouer cette partie", exact: true })
      .click();
    await acceptConfirmation(page);
    const replay = await read();
    expect(replay.undercoverPreparation.id).toBe(next.undercoverPreparation.id);
    expect(replay.undercoverPreparation.series.position).toBe(2);
    await page
      .getByRole("button", { name: "Revenir à la partie", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Distribuer les mots et commencer",
        exact: true,
      })
      .click();
    for (const p of players)
      await expect(p.locator(".private-content-image")).toBeVisible();
    await players[1]!.reload();
    await expect(players[1]!.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(players[1]!.locator(".private-content-image")).toBeVisible();
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("eighty-character content names keep the preparation and its mobile confirmation reachable", async ({
  page,
}, info) => {
  await start(page);
  await editContents(page, "C".repeat(80), "U".repeat(80));
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const save = page.getByRole("button", {
    name: "Enregistrer la partie",
    exact: true,
  });
  await expect(save).toBeEnabled();
  if (info.project.name === "mobile") await shot(page, info, "a2-long-names");
  await save.click();
  await expect(
    page.getByRole("heading", { name: "Préparer une partie", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ajouter à la série", exact: true })
    .click();
  await expect(page.locator(".series-runlist>li")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

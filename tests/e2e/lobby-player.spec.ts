import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  gmSessionSchema,
  playerSessionSchema,
} from "@extension-twitch/contracts/sessions";
import { openUndercoverOptions } from "./undercover-helpers.js";
import { completeClues } from "./turn-helpers.js";
import { acceptConfirmation } from "./dialog-helpers.js";

async function fits(p: Page) {
  expect(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  for (const control of await p
    .locator(".stitch-button, .stitch-disclosure>summary")
    .all())
    if (await control.isVisible())
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(
    await p.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toMatch(/user-scalable=no|maximum-scale=1/);
}
async function snapshot(p: Page, info: TestInfo, slug: string) {
  await p.evaluate(() => document.fonts.ready);
  const toast = p.getByRole("button", {
    name: "Fermer la notification",
    exact: true,
  });
  if (await toast.isVisible()) await toast.click();
  await fits(p);
  // Keep sticky actions at the end of a full-page capture, using real scrolling.
  if (!(await p.getByRole("dialog").isVisible()))
    await p.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
  await p.screenshot({
    path: info.outputPath(`${slug}.png`),
    fullPage: true,
    animations: "disabled",
    mask: [p.locator('input[type="password"]:visible')],
  });
}
async function readPrivate(page: Page) {
  return page.evaluate(async () => {
    const path = location.pathname.split("/"),
      id = path[2]!;
    const key = `xt:access:${id}:${path[3] === "gm" ? "gm" : `player:${path[4]}`}`;
    const response = await fetch(`/api/server/sessions/${id}/private`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem(key)}` },
      cache: "no-store",
    });
    return response.json();
  });
}
async function setup(page: Page, roundLimit = 10) {
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto("/play/undercover");

  if (roundLimit !== 10) {
    await openUndercoverOptions(page);
    await page
      .getByLabel("Maximum de manches", { exact: true })
      .fill(String(roundLimit));
  }
  await page
    .getByRole("button", {
      name: "Préparer la partie",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("session-connection")).toHaveText(
    "Synchronisé",
  );
  await expect(page.locator('[data-experience="salon"]')).toBeVisible();
  return page
    .getByLabel("Invitation des joueurs", { exact: true })
    .inputValue();
}
async function newPlayer(
  browser: Browser,
  host: Page,
  contexts: BrowserContext[],
  invitation: string,
  name: string,
) {
  const c = await browser.newContext({
    viewport: host.viewportSize(),
    deviceScaleFactor: 2,
  });
  contexts.push(c);
  await c.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  const p = await c.newPage();
  await p.goto(invitation);
  await p.getByLabel("Votre nom", { exact: true }).fill(name);
  await p
    .getByRole("button", { name: "Rejoindre la partie", exact: true })
    .click();
  await expect(p.getByTestId("session-connection")).toHaveText("Synchronisé");
  return p;
}
async function prepareAndDeal(gm: Page) {
  await gm
    .getByRole("button", { name: "Préparer la partie", exact: true })
    .click();
  await expect(gm.locator('[data-experience="gm"]')).toBeVisible();
  expect(gmSessionSchema.parse(await readPrivate(gm)).game!.play!.dealt).toBe(
    false,
  );
  await gm
    .getByRole("button", {
      name: "Distribuer les mots et commencer",
      exact: true,
    })
    .click();
  await expect(gm.locator(".speaker-focus")).toBeVisible();
}
async function vote(p: Page, name: string) {
  await p.getByRole("radio", { name, exact: true }).check();
  await p.getByRole("button", { name: "Voter", exact: true }).click();
  await acceptConfirmation(p);
  await expect(
    p.getByRole("heading", { name: "Vote enregistré", exact: true }),
  ).toBeVisible();
}
async function resolve(gm: Page) {
  await gm
    .getByRole("button", { name: "Révéler le résultat du vote", exact: true })
    .click();
  await acceptConfirmation(gm);
}

test("approved lobby and arrival: real invitations, name refusal, optional readiness, private recovery and themes", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    const invitation = await setup(page);
    const variant = info.project.name === "desktop" ? "desktop" : "mobile";
    const button = page.getByRole("button", {
      name: "Préparer la partie",
      exact: true,
    });
    await expect(button).toBeDisabled();
    await snapshot(page, info, `lobby-empty-${variant}`);
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .getByRole("button", { name: "Copier le lien d’invitation", exact: true })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      invitation,
    );
    const one = await newPlayer(browser, page, contexts, invitation, "Alex");
    await one
      .getByRole("button", { name: "Je suis prêt", exact: true })
      .click();
    await expect(
      page.locator(".stitch-participants li").filter({ hasText: "Alex" }),
    ).toContainText("Prêt");
    await expect(
      one.getByRole("button", { name: "Je ne suis plus prêt", exact: true }),
    ).toBeEnabled();
    await snapshot(one, info, "player-waiting-mobile");
    const c = await browser.newContext({
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
    });
    contexts.push(c);
    await c.addInitScript(() =>
      localStorage.setItem("xt:theme:application", "neon-show"),
    );
    const second = await c.newPage();
    await second.goto(invitation);
    await second.getByLabel("Votre nom", { exact: true }).fill("Alex");
    await second
      .getByRole("button", { name: "Rejoindre la partie", exact: true })
      .click();
    await expect(second.locator("#join-error")).toContainText(
      "Ce nom est déjà utilisé",
    );
    await expect(second.getByLabel("Votre nom", { exact: true })).toHaveValue(
      "Alex",
    );
    await snapshot(second, info, "player-arrival-mobile");
    await second.getByLabel("Votre nom", { exact: true }).fill("Lou");
    await second
      .getByRole("button", { name: "Rejoindre la partie", exact: true })
      .click();
    await expect(second.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    const third = await newPlayer(browser, page, contexts, invitation, "Sam");
    const fourth = await newPlayer(browser, page, contexts, invitation, "Noa");
    await fourth.close();
    await expect(
      page.locator(".stitch-participants li").filter({ hasText: "Noa" }),
    ).toContainText("Hors ligne");
    await expect(button).toBeEnabled(); // Offline and not-ready players stay enrolled.
    await snapshot(page, info, `lobby-ready-${variant}`);
    for (const theme of ["broadcast-studio", "on-air-premium", "neon-show"]) {
      const toggle = page.getByLabel("Apparence de l’application", {
        exact: true,
      });
      await toggle.click();
      await page
        .getByLabel("Thème de l’application", { exact: true })
        .selectOption(theme);
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await fits(page);
    }
    const denied = await c.newPage();
    await denied.goto(one.url());
    await expect(
      denied.getByRole("heading", {
        name: "Votre accès privé est nécessaire",
        exact: true,
      }),
    ).toBeVisible();
    await snapshot(denied, info, "player-access-required-mobile");
    const invalid = await c.newPage();
    await invalid.goto("/join/ZZZZZZZZZZZZ");
    await invalid.getByLabel("Votre nom", { exact: true }).fill("Invité");
    await invalid
      .getByRole("button", { name: "Rejoindre la partie", exact: true })
      .click();
    await expect(
      invalid.getByRole("heading", {
        name: "Invitation indisponible",
        exact: true,
      }),
    ).toBeVisible();
    await snapshot(invalid, info, "invitation-unavailable-mobile");
    await button.click();
    await expect(page.locator('[data-experience="gm"]')).toBeVisible();
    const prepared = gmSessionSchema.parse(await readPrivate(page));
    expect(prepared.admissionOpen).toBe(false);
    expect(prepared.game!.play!.dealt).toBe(false);
    await expect(third.locator(".personal-card")).toContainText(
      "Le GM va vous distribuer",
    );
    expect(errors).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("approved companion: private word, oral turns, confirmed unique vote, elimination, personal results and replay", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  const native: string[] = [];
  try {
    const invitation = await setup(page);
    const players: Page[] = [];
    for (const name of ["Camille", "Noa", "Léa", "Sami"])
      players.push(await newPlayer(browser, page, contexts, invitation, name));
    for (const p of [page, ...players])
      p.on("dialog", async (d) => {
        native.push(d.type());
        await d.dismiss();
      });
    await prepareAndDeal(page);
    const gm = gmSessionSchema.parse(await readPrivate(page));
    const id = gm.sessionId;
    const assignments = gm.game!.management!.assignments;
    const names = gm.participants;
    const target = names.find((p) => assignments[p.id] === "civil")!;
    const undercover = names.find((p) => assignments[p.id] === "undercover")!;
    const observerContext = await browser.newContext();
    contexts.push(observerContext);
    const observer = await observerContext.newPage();
    await observer.goto(`/sessions/${id}/obs`);
    await expect(observer.getByTestId("broadcast-connection")).toHaveText(
      "Synchronisé",
    );
    await expect(observer.locator("body")).not.toContainText(/Phare|Fusée/);
    for (const p of players) {
      const own = playerSessionSchema.parse(await readPrivate(p));
      expect(own.game!.values.map((v) => v.participantId)).toEqual([
        own.participantId,
      ]);
      expect(own.game!.management).toBeUndefined();
      expect(own.publicGame!.values).toEqual([]);
    }
    await snapshot(players[0]!, info, "player-secret-mobile");
    await players[0]!
      .getByRole("button", { name: "Masquer mon mot", exact: true })
      .click();
    await expect(
      players[0]!.locator(".personal-card .game-values"),
    ).toHaveCount(0);
    await snapshot(players[0]!, info, "player-secret-hidden-mobile");
    await snapshot(players[0]!, info, "player-clue-turn-mobile");
    await players[1]!
      .getByRole("button", { name: "Masquer mon mot", exact: true })
      .click();
    await snapshot(players[1]!, info, "player-await-turn-mobile");
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    await expect(
      players[0]!.getByRole("radio", { name: "Camille", exact: true }),
    ).toHaveCount(0);
    await snapshot(players[0]!, info, "player-vote-mobile");
    const firstTarget = target.name === "Camille" ? "Noa" : target.name;
    await players[0]!
      .getByRole("radio", { name: firstTarget, exact: true })
      .check();
    await players[0]!
      .getByRole("button", { name: "Voter", exact: true })
      .click();
    const dialog = players[0]!.getByRole("dialog");
    await expect(
      dialog.getByRole("button", { name: "Annuler", exact: true }),
    ).toBeFocused();
    await snapshot(players[0]!, info, "player-vote-confirm-mobile");
    await players[0]!.keyboard.press("Escape");
    await expect(
      players[0]!.getByRole("button", { name: "Voter", exact: true }),
    ).toBeFocused();
    expect(
      playerSessionSchema.parse(await readPrivate(players[0]!)).game!.play!
        .ballot!.myVote,
    ).toBeUndefined();
    await vote(players[0]!, firstTarget);
    await snapshot(players[0]!, info, "player-vote-recorded-mobile");
    await players[0]!.reload();
    await expect(
      players[0]!.getByRole("heading", {
        name: "Vote enregistré",
        exact: true,
      }),
    ).toBeVisible();
    for (let i = 1; i < players.length; i++)
      await vote(
        players[i]!,
        names[i]!.id === target.id ? "Camille" : target.name,
      );
    await resolve(page);
    const eliminatedIndex = names.findIndex((p) => p.id === target.id);
    const staying = players[(eliminatedIndex + 1) % 4]!;
    await expect(
      staying.getByRole("heading", {
        name: `${target.name} est éliminé.`,
        exact: true,
      }),
    ).toBeVisible();
    await snapshot(staying, info, "player-round-result-mobile");
    await expect(observer.locator("body")).not.toContainText(/Phare|Fusée/);
    await page
      .getByRole("button", {
        name: "Commencer la manche suivante",
        exact: true,
      })
      .click();
    await expect(
      players[eliminatedIndex]!.getByRole("heading", {
        name: "Vous êtes éliminé",
        exact: true,
      }),
    ).toBeVisible();
    await snapshot(players[eliminatedIndex]!, info, "player-eliminated-mobile");
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    await expect(players[eliminatedIndex]!.getByRole("radio")).toHaveCount(0);
    for (let i = 0; i < players.length; i++)
      if (i !== eliminatedIndex) {
        const voteTarget =
          names[i]!.id === undercover.id
            ? names.find((p) => p.id !== target.id && p.id !== undercover.id)!
                .name
            : undercover.name;
        await vote(players[i]!, voteTarget);
      }
    await resolve(page);
    const winnerIndex = names.findIndex((p) => assignments[p.id] === "civil");
    const loserIndex = names.findIndex((p) => p.id === undercover.id);
    await expect(
      players[winnerIndex]!.getByRole("heading", {
        name: "Vous avez gagné !",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      players[loserIndex]!.getByRole("heading", {
        name: "Vous avez perdu",
        exact: true,
      }),
    ).toBeVisible();
    await snapshot(players[winnerIndex]!, info, "player-victory-mobile");
    await snapshot(players[loserIndex]!, info, "player-defeat-mobile");
    await expect(observer.locator("body")).toContainText("Victoire des civils");
    await expect(observer.locator("body")).toContainText("Phare");
    await page
      .getByRole("button", { name: "Rejouer cette partie", exact: true })
      .click();
    await acceptConfirmation(page);
    for (const p of players) {
      await expect(p.locator(".personal-card")).toContainText(
        "Le GM va vous distribuer",
      );
      await expect(p.locator("body")).not.toContainText(/Phare|Fusée/);
    }
    expect(native).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("approved tie and draw are real server results and preserve private information until final revelation", async ({
  page,
  browser,
}, info) => {
  const contexts: BrowserContext[] = [];
  try {
    const invitation = await setup(page, 2);
    const players: Page[] = [];
    for (const name of ["Camille", "Noa", "Léa"])
      players.push(await newPlayer(browser, page, contexts, invitation, name));
    await prepareAndDeal(page);
    for (let round = 1; round <= 2; round++) {
      await completeClues(page);
      await page
        .getByRole("button", { name: "Ouvrir les votes", exact: true })
        .click();
      await vote(players[0]!, "Noa");
      await vote(players[1]!, "Léa");
      await vote(players[2]!, "Camille");
      await resolve(page);
      if (round === 1) {
        await expect(
          players[0]!.getByRole("heading", { name: "Égalité", exact: true }),
        ).toBeVisible();
        await players[0]!
          .getByRole("button", { name: "Masquer mon mot", exact: true })
          .click();
        await snapshot(players[0]!, info, "player-tie-mobile");
        const own = playerSessionSchema.parse(await readPrivate(players[0]!));
        expect(
          own.game!.play!.roster.every((p) => p.active && p.role === undefined),
        ).toBe(true);
        await page
          .getByRole("button", {
            name: "Commencer la manche suivante",
            exact: true,
          })
          .click();
      }
    }
    await expect(
      players[0]!.getByRole("heading", { name: "Partie nulle", exact: true }),
    ).toBeVisible();
    await snapshot(players[0]!, info, "player-draw-mobile");
    expect(
      playerSessionSchema.parse(await readPrivate(players[0]!)).game!.play!
        .outcome!.id,
    ).toBe("round-limit");
    await expect(players[0]!.locator(".stitch-final-words")).toContainText(
      "Phare",
    );
    await expect(players[0]!.locator(".stitch-final-words")).toContainText(
      "Fusée",
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("player identities, reconnection and an uncertain confirmed vote keep real permissions and the exact pending command", async ({
  page,
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    const invitation = await setup(page);
    const players: Page[] = [];
    for (const name of ["Alex", "Lou", "Sam"])
      players.push(await newPlayer(browser, page, contexts, invitation, name));
    await prepareAndDeal(page);
    const one = players[0]!;
    const before = playerSessionSchema.parse(await readPrivate(one));
    // The private capability remains bound to its participant even if a different URL is supplied.
    const twoToken = await players[1]!.evaluate(() =>
      sessionStorage.getItem(
        `xt:access:${location.pathname.split("/")[2]}:player:${location.pathname.split("/")[4]}`,
      ),
    );
    const c = await browser.newContext({ viewport: page.viewportSize() });
    contexts.push(c);
    const wrong = await c.newPage();
    await wrong.goto(`${one.url()}#access=${twoToken}`);
    await expect(wrong.getByTestId("session-connection")).toHaveText(
      "Accès indisponible",
    );
    await expect(wrong.locator(".personal-card")).toHaveCount(0);
    const refusal = await one.evaluate(async () => {
      const [, , id, , person] = location.pathname.split("/");
      const token = sessionStorage.getItem(`xt:access:${id}:player:${person}`);
      const view = await (
        await fetch(`/api/server/sessions/${id}/private`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json();
      return (
        await fetch(`/api/server/sessions/${id}/commands`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commandId: crypto.randomUUID(),
            expectedVersion: view.version,
            command: { type: "session.rename", title: "Interdit" },
          }),
        })
      ).status;
    });
    expect(refusal).toBe(403);
    await one.route("**/private/events", (route) => route.abort());
    await one.reload();
    await expect(one.getByTestId("session-connection")).toContainText(
      "Reconnexion",
    );
    await expect(one.locator(".personal-card")).toHaveCount(0);
    await one.unroute("**/private/events");
    await expect(one.getByTestId("session-connection")).toHaveText(
      "Synchronisé",
    );
    expect(
      playerSessionSchema.parse(await readPrivate(one)).participantId,
    ).toBe(before.participantId);
    await completeClues(page);
    await page
      .getByRole("button", { name: "Ouvrir les votes", exact: true })
      .click();
    let pendingId = "";
    await one.route(
      "**/commands",
      (route) => {
        pendingId = route.request().postDataJSON().commandId;
        return route.abort();
      },
      { times: 1 },
    );
    await one.getByRole("radio", { name: "Lou", exact: true }).check();
    await one.getByRole("button", { name: "Voter", exact: true }).click();
    const dialog = one.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Confirmer mon vote", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    expect(
      playerSessionSchema.parse(await readPrivate(one)).game!.play!.ballot!
        .myVote,
    ).toBeUndefined();
    await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(one.getByRole("radio").first()).toBeDisabled();
    const response = one.waitForResponse(
      (r) => r.url().endsWith("/commands") && r.status() === 200,
    );
    await one
      .getByRole("button", { name: "Réessayer la commande", exact: true })
      .click();
    expect((await response).request().postDataJSON().commandId).toBe(pendingId);
    await expect(
      one.getByRole("heading", { name: "Vote enregistré", exact: true }),
    ).toBeVisible();
    const recorded = playerSessionSchema.parse(await readPrivate(one));
    expect(recorded.game!.play!.ballot!.voted).toEqual([before.participantId]);
    expect(recorded.game!.play!.ballot!.myVote).toBe(
      recorded.participants.find((p) => p.name === "Lou")!.id,
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

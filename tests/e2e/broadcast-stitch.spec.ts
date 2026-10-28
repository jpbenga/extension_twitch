import { randomBytes, randomUUID } from "node:crypto";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
  type BrowserContext,
} from "@playwright/test";
import {
  gmSessionSchema,
  type LobbyAction,
  type GmSessionView,
} from "@extension-twitch/contracts/sessions";
import { createUndercoverLayout } from "@extension-twitch/contracts/undercover-layout";

async function fixture(request: APIRequestContext, count = 6, limit = 2) {
  const gmToken = randomBytes(32).toString("base64url");
  const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
  const created = await request.post(
    "/api/server/official-games/undercover/sessions",
    {
      headers: headers(gmToken),
      data: {
        requestId: randomUUID(),
        broadcastTheme: "neon-show",
        settings: {
          "round-limit": limit,
          "civil-word": "PHARE PRIVÉ",
          "undercover-word": "FUSÉE PRIVÉE",
        },
      },
    },
  );
  expect(created.status()).toBe(201);
  const { sessionId: id } = (await created.json()) as { sessionId: string };
  const view = async () =>
    gmSessionSchema.parse(
      await (
        await request.get(`/api/server/sessions/${id}/private`, {
          headers: headers(gmToken),
        })
      ).json(),
    );
  const first = await view();
  const players: { id: string; token: string; name: string }[] = [];
  for (let i = 0; i < count; i++) {
    const token = randomBytes(32).toString("base64url");
    const name =
      count === 12
        ? `${i + 1} ${"Un nom long à lire ".repeat(2)}`.slice(0, 32)
        : ["Alex", "Lou", "Sami", "Noa", "Camille", "Inès"][i]!;
    const joined = await request.post(
      `/api/server/invitations/${first.invitationCode}/join`,
      { headers: headers(token), data: { requestId: randomUUID(), name } },
    );
    expect(joined.status()).toBe(201);
    const body = (await joined.json()) as { participantId: string };
    players.push({ id: body.participantId, token, name });
  }
  async function command(command: LobbyAction, token = gmToken) {
    const current = await view();
    const response = await request.post(`/api/server/sessions/${id}/commands`, {
      headers: headers(token),
      data: {
        commandId: randomUUID(),
        expectedVersion: current.version,
        command,
      },
    });
    expect(response.status()).toBe(200);
    return await view();
  }
  async function action(
    actionId: string,
    token = gmToken,
    parameters: Record<string, string> = {},
  ) {
    const current = await view();
    return command(
      { type: "game.action", runId: current.game!.runId, actionId, parameters },
      token,
    );
  }
  async function clues() {
    let current = await view();
    while (current.game!.play!.turns && !current.game!.play!.turns.complete)
      current = await action("confirm-clue");
    return current;
  }
  await command({ type: "game.use-prepared" });
  return { id, players, gmToken, view, command, action, clues };
}
const overlay = (page: Page) =>
  page.getByLabel("Overlay public de l’émission", { exact: true });
async function ready(page: Page) {
  await expect(page.getByTestId("broadcast-connection")).toHaveText(
    "Synchronisé",
  );
}
async function shot(
  page: Page,
  info: { outputPath: (name: string) => string },
  slug: string,
  transparent = false,
) {
  await expect(page.getByTestId("broadcast-cue")).toHaveCount(0, {
    timeout: 5000,
  });
  if (!transparent && !(await page.getByRole("dialog").isVisible()))
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
  await page.screenshot({
    path: info.outputPath(`${slug}.png`),
    fullPage: !transparent,
    omitBackground: transparent,
  });
}

test("approved broadcast states follow real public commands through elimination, victory, replay, tie and draw", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120000);
  const f = await fixture(page.request);
  const contexts: BrowserContext[] = [];
  const open = async (path: string, width = 1920, height = 1080) => {
    const context = await browser.newContext({ viewport: { width, height } });
    contexts.push(context);
    await context.addInitScript(() =>
      localStorage.setItem("xt:theme:application", "neon-show"),
    );
    const client = await context.newPage();
    await client.goto(path);
    return client;
  };
  try {
    const obs = await open(`/sessions/${f.id}/obs`);
    const preview = await open(
      `/sessions/${f.id}/stream`,
      page.viewportSize()!.width,
      page.viewportSize()!.height,
    );
    const spectator = await open(
      `/sessions/${f.id}/public`,
      page.viewportSize()!.width,
      page.viewportSize()!.height,
    );
    await ready(obs);
    await ready(preview);
    await expect(overlay(obs).locator("[data-widget]")).toHaveCount(7);
    await expect(obs.locator("button,input,select,textarea")).toHaveCount(0);
    expect(
      await obs.evaluate(() => [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.documentElement).backgroundColor,
      ]),
    ).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
    await shot(obs, info, "broadcast-obs-preparation", true);
    await f.action("deal");
    await expect(overlay(obs)).toHaveAttribute("data-phase", "discussion");
    await f.action("confirm-clue");
    await expect(obs.getByTestId("broadcast-turns")).toContainText(
      "1 / 6 passages confirmés",
    );
    await expect(spectator.locator(".spectator-phase")).toContainText(
      "1 / 6 passages confirmés",
    );
    for (const client of [obs, preview, spectator])
      await expect(client.locator("body")).not.toContainText(
        /PHARE PRIVÉ|FUSÉE PRIVÉE/,
      );
    const publicPayload = JSON.stringify(
      await (
        await page.request.get(`/api/server/sessions/${f.id}/public`)
      ).json(),
    );
    expect(publicPayload).not.toMatch(
      /PHARE PRIVÉ|FUSÉE PRIVÉE|preparedGame|invitationCode|management/,
    );
    await shot(obs, info, "broadcast-obs-discussion", true);
    await preview
      .getByText("Utiliser ce plateau dans OBS", { exact: true })
      .click();
    await shot(preview, info, `broadcast-stream-preview-${info.project.name}`);
    await shot(spectator, info, `broadcast-spectator-${info.project.name}`);
    await f.clues();
    await f.action("open-vote");
    const current = await f.view();
    const civilian = Object.entries(current.game!.management!.assignments).find(
      ([, role]) => role === "civil",
    )![0];
    const voters = f.players;
    for (let i = 0; i < voters.length; i++) {
      const actor = voters[i]!;
      await f.action("vote", actor.token, {
        target:
          actor.id === civilian
            ? voters.find((p) => p.id !== actor.id)!.id
            : civilian,
      });
      if (i === 2) {
        await expect(obs.getByTestId("broadcast-votes")).toHaveText(
          "3 / 6 votes reçus",
        );
        await shot(obs, info, "broadcast-obs-vote", true);
      }
    }
    await f.action("resolve");
    await expect(overlay(obs)).toHaveAttribute("data-phase", "result");
    await expect(overlay(obs)).toContainText(
      `${f.players.find((p) => p.id === civilian)!.name} est éliminé.`,
    );
    await expect(overlay(obs)).not.toContainText(/PHARE PRIVÉ|FUSÉE PRIVÉE/);
    await shot(obs, info, "broadcast-obs-elimination", true);
    await f.action("next");
    await f.clues();
    await f.action("open-vote");
    const second = await f.view();
    const intrus = Object.entries(second.game!.management!.assignments).find(
      ([, role]) => role === "undercover",
    )![0];
    const active = voters.filter((p) => p.id !== civilian);
    for (const actor of active)
      await f.action("vote", actor.token, {
        target:
          actor.id === intrus
            ? active.find((p) => p.id !== actor.id)!.id
            : intrus,
      });
    await f.action("resolve");
    await expect(overlay(obs)).toContainText("Victoire des civils");
    await expect(overlay(obs)).toContainText("PHARE PRIVÉ");
    await shot(obs, info, "broadcast-obs-victory", true);
    await f.command({
      type: "game.restart",
      runId: (await f.view()).game!.runId,
    });
    await expect(overlay(obs)).toHaveAttribute("data-phase", "preparation");
    await expect(overlay(obs)).not.toContainText(
      /PHARE PRIVÉ|FUSÉE PRIVÉE|Victoire des civils/,
    );
    await f.action("deal");
    for (let round = 1; round <= 2; round++) {
      await f.clues();
      await f.action("open-vote");
      for (let i = 0; i < voters.length; i++)
        await f.action("vote", voters[i]!.token, {
          target: voters[(i + 1) % voters.length]!.id,
        });
      await f.action("resolve");
      if (round === 1) {
        await expect(overlay(obs)).toContainText(
          "Égalité : personne n’est éliminé.",
        );
        await shot(obs, info, "broadcast-obs-tie", true);
        await f.action("next");
      }
    }
    await expect(overlay(obs)).toContainText("Partie nulle");
    await shot(obs, info, "broadcast-obs-draw", true);
    await expect
      .poll(
        async () =>
          (await overlay(obs).getAttribute("data-version")) ===
          (await overlay(preview).getAttribute("data-version")),
      )
      .toBe(true);
    const late = await open(`/sessions/${f.id}/obs`);
    await ready(late);
    await expect(late.getByTestId("broadcast-cue")).toHaveCount(0);
    await expect(overlay(late)).toContainText("Partie nulle");
    await obs.setViewportSize({ width: 1280, height: 800 });
    expect(
      await obs.getByTestId("broadcast-frame").boundingBox(),
    ).toMatchObject({ x: 0, y: 40, width: 1280, height: 720 });
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("twelve long public names keep oral counts visible for all four bounded presets and private app themes", async ({
  page,
}, info) => {
  const f = await fixture(page.request, 12);
  await f.action("deal");
  await page.goto(`/sessions/${f.id}/obs`);
  await ready(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const themeBefore = await overlay(page).evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--broadcast-highlight"),
  );
  await page.evaluate(() => {
    localStorage.setItem("xt:theme:application", "on-air-premium");
  });
  await page.reload();
  await ready(page);
  expect(
    await overlay(page).evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--broadcast-highlight"),
    ),
  ).toBe(themeBefore);
  for (const preset of ["balanced", "bottom", "lateral", "centered"] as const) {
    await f.command({
      type: "overlay.configure",
      layout: createUndercoverLayout(preset),
    });
    await expect(overlay(page).locator("[data-player]")).toHaveCount(12);
    const clipped = await page.locator("[data-widget=phase]").evaluate((el) => {
      const outer = el.getBoundingClientRect();
      return Array.from(
        el.querySelectorAll(".broadcast-progress-count,strong"),
      ).some((node) => {
        const r = node.getBoundingClientRect();
        return (
          r.bottom > outer.bottom + 1 ||
          r.top < outer.top - 1 ||
          r.right > outer.right + 1
        );
      });
    });
    expect(clipped).toBe(false);
  }
  await shot(page, info, "broadcast-long-names-1920", true);
  await page.goto(`/sessions/${f.id}/public`);
  await expect(page.locator(".spectator-roster article")).toHaveCount(12);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const player of f.players)
    await expect(page.locator(".spectator-roster")).toContainText(player.name);
});

test("layout conflicts keep local work on cancel and load only the confirmed server layout", async ({
  page,
  browser,
}, info) => {
  const f = await fixture(page.request);
  await page.addInitScript(() =>
    localStorage.setItem("xt:theme:application", "neon-show"),
  );
  await page.goto(`/sessions/${f.id}/overlay#access=${f.gmToken}`);
  await expect(page.getByTestId("layout-canvas")).toBeVisible();
  await shot(page, info, `broadcast-layout-${info.project.name}`);
  await page
    .getByLabel("Bloc à ajuster", { exact: true })
    .selectOption("header");
  await page.getByLabel("Titre · Hauteur", { exact: true }).fill("150");
  const remote = createUndercoverLayout();
  remote.widgets.header.height = 160;
  await f.command({ type: "overlay.configure", layout: remote });
  await expect(
    page.getByRole("button", {
      name: "Enregistrer la disposition",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Charger la disposition enregistrée",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await shot(page, info, `broadcast-layout-conflict-${info.project.name}`);
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByLabel("Titre · Hauteur", { exact: true })).toHaveValue(
    "150",
  );
  await page
    .getByRole("button", {
      name: "Charger la disposition enregistrée",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Charger la disposition", exact: true })
    .click();
  await expect(page.getByLabel("Titre · Hauteur", { exact: true })).toHaveValue(
    "160",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

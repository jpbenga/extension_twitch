import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseOptions,
  runStitch,
  stitchProject,
  syncScreen,
  type Runner,
  type SyncOptions,
} from "../scripts/stitch-sync.js";

// A generated 1×1 image, never a purported Stitch design or auth credential.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0ZkAAAAASUVORK5CYII=",
  "base64",
);
const initialRegistry = `# UX Redesign Screens

Notes manuelles à préserver.

<!-- stitch:screens:start -->
| Screen | Surface | Status | Stitch ID | Local reference |
| --- | --- | --- | --- | --- |
| Autre écran | Mobile | APPROVED | previous-id | [autre](autre/) |
<!-- stitch:screens:end -->

Fin du document à préserver.
`;
let root: string, base: string;
const options = (extra: Partial<SyncOptions> = {}): SyncOptions => ({
  screen: "test-screen-id",
  slug: "player-secret-mobile",
  surface: "Joueur · Mobile",
  approved: true,
  replace: false,
  ...extra,
});

interface Fixture {
  status?: Record<string, unknown>;
  project?: Record<string, unknown>;
  screen?: Record<string, unknown>;
  image?: Buffer;
  html?: string;
  failImage?: boolean;
  failHtml?: boolean;
  envelope?: boolean;
  version?: string;
}

function cli(fixture: Fixture = {}) {
  const calls: string[][] = [];
  const runner: Runner = async (args) => {
    calls.push(args);
    const result = (value: unknown) =>
      JSON.stringify(fixture.envelope ? { success: true, data: value } : value);
    if (args[0] === "--version") return fixture.version ?? "0.12.0";
    if (args[0] === "status")
      return result(
        fixture.status ?? { authenticated: true, canvas: { present: true } },
      );
    if (args[0] === "get" && args[1] === "project")
      return result(fixture.project ?? { name: `projects/${stitchProject}` });
    if (args[0] === "get" && args[1] === "screen")
      return result({
        id: args[2],
        title: "AFTER — Joueur — APPROVED",
        htmlCode: { name: "files/example" },
        ...fixture.screen,
      });
    if (args[0] === "download") {
      const destination = args[args.indexOf("--output") + 1]!;
      if (args.includes("png")) {
        if (fixture.failImage) throw new Error("download failed");
        await writeFile(destination, fixture.image ?? png);
      } else {
        if (fixture.failHtml) throw new Error("download failed");
        await writeFile(
          destination,
          fixture.html ??
            "<!doctype html><html lang='fr'><body><main>Référence de test</main></body></html>",
        );
      }
      return JSON.stringify({
        success: true,
        data: { imagePath: destination },
      });
    }
    throw new Error("unexpected CLI command");
  };
  return { runner, calls };
}

async function file(name: string, slug = options().slug) {
  return readFile(join(base, slug, name), "utf8");
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "xt-stitch-test-"));
  base = join(root, "docs", "ux", "redesign");
  await mkdir(base, { recursive: true });
  await writeFile(
    join(root, ".stitch.json"),
    JSON.stringify({ project: stitchProject }),
  );
  await writeFile(join(base, "SCREENS.md"), initialRegistry);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe("local read-only Stitch bridge", () => {
  it("requires an explicit human approval, bounds paths and rejects ambiguous CLI input", () => {
    expect(
      parseOptions([
        "--screen",
        "123",
        "--slug",
        "accueil-mobile",
        "--approved",
      ]).screen,
    ).toBe("123");
    for (const args of [
      ["--screen", "123", "--slug", "accueil-mobile"],
      ["--screen", "https://example.org/screen", "--slug", "ok", "--approved"],
      ["--screen", "123", "--slug", "../credentials", "--approved"],
      ["--screen", "123", "--slug", "a/b", "--approved"],
      ["--screen", "123", "--slug", "ok", "--approved", "--approved"],
      ["--screen", "123", "--slug", "ok", "--approved", "--token", "example"],
      ["--screen", "--slug", "ok", "--approved"],
    ])
      expect(() => parseOptions(args)).toThrow();
  });

  it("writes a real image fixture, the exact HTML and metadata using only read commands", async () => {
    const { runner, calls } = cli({ envelope: true });
    const result = await syncScreen(options(), root, runner);
    expect(result.warnings).toEqual([]);
    expect(await readFile(join(base, options().slug, "approved.png"))).toEqual(
      png,
    );
    expect(await file("approved.html")).toBe(
      "<!doctype html><html lang='fr'><body><main>Référence de test</main></body></html>",
    );
    const spec = await file("SPEC.md");
    expect(spec).toContain("Status: APPROVED");
    expect(spec).toContain(`Project ID: ${stitchProject}`);
    expect(spec).toContain("Screen ID: test-screen-id");
    expect(spec).toContain("À renseigner pendant la validation UX.");
    expect(spec).toContain("À renseigner avant l’implémentation.");
    expect(calls.map((c) => c[0])).toEqual([
      "--version",
      "status",
      "get",
      "get",
      "download",
      "download",
    ]);
    expect(
      calls
        .filter((c) => c[1] === "screen")
        .every((c) => c.includes(stitchProject)),
    ).toBe(true);
    expect(
      calls
        .filter((c) => c[0] === "download" || c[0] === "get")
        .every((c) => c.includes("--no-cache")),
    ).toBe(true);
    expect((await readdir(base)).sort()).toEqual([
      "SCREENS.md",
      options().slug,
    ]);
    expect(await readFile(join(root, ".stitch.json"), "utf8")).toBe(
      JSON.stringify({ project: stitchProject }),
    );
  });

  it("updates the target entry without deleting other screens, before images or manually written intentions", async () => {
    await syncScreen(options(), root, cli().runner);
    const original = await file("SPEC.md");
    await writeFile(
      join(base, options().slug, "SPEC.md"),
      original.replace(
        "À renseigner pendant la validation UX.",
        "Mon intention validée.",
      ),
    );
    await writeFile(join(base, options().slug, "before.png"), png);
    await syncScreen(
      options({ surface: "Compagnon privé" }),
      root,
      cli({ screen: { title: "Écran renommé" } }).runner,
    );
    expect(await file("SPEC.md")).toContain("Mon intention validée.");
    expect(await file("SPEC.md")).toContain("Screen title: Écran renommé");
    expect(await readFile(join(base, options().slug, "before.png"))).toEqual(
      png,
    );
    const registry = await readFile(join(base, "SCREENS.md"), "utf8");
    expect(registry).toContain("previous-id");
    expect(registry).toContain("Notes manuelles à préserver.");
    expect(registry).toContain("Fin du document à préserver.");
    expect(registry).toContain("Compagnon privé");
    expect(registry.match(/test-screen-id/g)).toHaveLength(1);
  });

  it("requires --replace to change the ID, preserves notes and removes obsolete optional HTML", async () => {
    await syncScreen(options(), root, cli().runner);
    const before = await file("SPEC.md");
    await expect(
      syncScreen(options({ screen: "another-screen" }), root, cli().runner),
    ).rejects.toThrow("autre écran");
    expect(await file("SPEC.md")).toBe(before);
    const result = await syncScreen(
      options({ screen: "another-screen", replace: true }),
      root,
      cli({ failHtml: true }).runner,
    );
    expect(result.warnings).toHaveLength(1);
    expect(await file("SPEC.md")).toContain("Screen ID: another-screen");
    expect(await file("SPEC.md")).not.toContain("approved.html");
    await expect(file("approved.html")).rejects.toThrow();
  });

  it("requires authentication without reading credentials or attempting a project request", async () => {
    const { runner, calls } = cli({
      status: { authenticated: false, canvas: { present: false } },
    });
    await expect(syncScreen(options(), root, runner)).rejects.toThrow(
      "n’est pas authentifié",
    );
    expect(calls).toHaveLength(2);
    expect(await readFile(join(base, "SCREENS.md"), "utf8")).toBe(
      initialRegistry,
    );
    expect(await readdir(base)).toEqual(["SCREENS.md"]);
  });

  it("supports locally configured Canvas authentication independently of OAuth status", async () => {
    await syncScreen(
      options(),
      root,
      cli({ status: { authenticated: false, canvas: { present: true } } })
        .runner,
    );
    expect(await file("SPEC.md")).toContain("Status: APPROVED");
  });

  it("refuses an unknown CLI version rather than guessing its commands", async () => {
    const { runner, calls } = cli({ version: "9.0.0" });
    await expect(syncScreen(options(), root, runner)).rejects.toThrow(
      "Version CLI",
    );
    expect(calls).toEqual([["--version"]]);
  });

  it.each([
    { project: { id: "different-project" } },
    { screen: { id: "different-screen" } },
    { screen: { name: "projects/different/screens/test-screen-id" } },
    { screen: { projectId: "different-project" } },
  ])(
    "refuses a resource from the wrong project or screen: %j",
    async (fixture) => {
      await expect(
        syncScreen(options(), root, cli(fixture).runner),
      ).rejects.toThrow("identité");
      expect(await readdir(base)).toEqual(["SCREENS.md"]);
    },
  );

  it.each([
    { project: "different-project" },
    { project: stitchProject, token: "fixture-never-used-as-auth" },
    { data: { project: stitchProject }, token: "fixture-never-used-as-auth" },
  ])(
    "refuses to rewrite or export an unsafe local binding: %j",
    async (binding) => {
      const text = JSON.stringify(binding);
      await writeFile(join(root, ".stitch.json"), text);
      const { runner, calls } = cli();
      await expect(syncScreen(options(), root, runner)).rejects.toThrow(
        ".stitch.json",
      );
      expect(calls).toHaveLength(0);
      expect(await readFile(join(root, ".stitch.json"), "utf8")).toBe(text);
    },
  );

  it.each([
    { failImage: true },
    { image: Buffer.from("<html>sign-in page</html>") },
  ])(
    "preserves approved references after a capture failure: %j",
    async (fixture) => {
      await syncScreen(options(), root, cli().runner);
      const spec = await file("SPEC.md"),
        registry = await readFile(join(base, "SCREENS.md"));
      await expect(
        syncScreen(options(), root, cli(fixture).runner),
      ).rejects.toThrow();
      expect(await file("SPEC.md")).toBe(spec);
      expect(await readFile(join(base, "SCREENS.md"))).toEqual(registry);
      expect(
        await readFile(join(base, options().slug, "approved.png")),
      ).toEqual(png);
      expect(await readdir(base)).not.toContain(".stitch-sync.lock");
    },
  );

  it("rejects sensitive metadata and drops an unsafe HTML export without persisting its URLs or CLI payload", async () => {
    await expect(
      syncScreen(
        options(),
        root,
        cli({
          screen: {
            title:
              "https://example.invalid/?access_token=fixture-not-a-credential",
          },
        }).runner,
      ),
    ).rejects.toThrow("sensible");
    const result = await syncScreen(
      options(),
      root,
      cli({
        html: '<html><img src="https://example.invalid/?X-Goog-Signature=fixture-not-a-credential"></html>',
      }).runner,
    );
    expect(result.warnings).toHaveLength(1);
    expect(await file("SPEC.md")).not.toContain("X-Goog");
    expect(await readdir(join(base, options().slug))).toEqual([
      "SPEC.md",
      "approved.png",
    ]);
  });

  it("allows screenshot-only screens without attempting to manufacture an HTML export", async () => {
    const { runner, calls } = cli({ screen: { htmlCode: undefined } });
    const result = await syncScreen(options(), root, runner);
    expect(result.warnings).toEqual([]);
    expect(calls.filter((c) => c[0] === "download")).toHaveLength(1);
    expect(await file("SPEC.md")).not.toContain("approved.html");
  });

  it("preserves malformed/manual documents instead of overwriting them", async () => {
    await syncScreen(options(), root, cli().runner);
    await writeFile(
      join(base, options().slug, "SPEC.md"),
      "# Mes notes\nScreen ID: test-screen-id\nTexte à préserver.",
    );
    const existing = await file("SPEC.md");
    await expect(syncScreen(options(), root, cli().runner)).rejects.toThrow(
      "balises",
    );
    expect(await file("SPEC.md")).toBe(existing);
    expect(await readdir(base)).not.toContain(".stitch-sync.lock");
  });

  it("does not replace another process’s lock or follow a symlink out of the repository", async () => {
    const lock = join(base, ".stitch-sync.lock");
    await writeFile(lock, "other process");
    await expect(syncScreen(options(), root, cli().runner)).rejects.toThrow(
      "déjà en cours",
    );
    expect(await readFile(lock, "utf8")).toBe("other process");
    await rm(lock);
    const outside = join(root, "outside");
    await mkdir(outside);
    await symlink(outside, join(base, options().slug));
    await expect(syncScreen(options(), root, cli().runner)).rejects.toThrow(
      "non sûr",
    );
    expect(await readdir(outside)).toEqual([]);
  });

  it("reports a missing executable without exposing raw process output", async () => {
    vi.stubEnv("PATH", root);
    await expect(runStitch(["--version"], root)).rejects.toThrow(
      "CLI Stitch absente",
    );
  });
});

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format } from "prettier";

export const stitchProject = "7117487747163082855";
const referenceStart = "<!-- stitch:reference:start -->";
const referenceEnd = "<!-- stitch:reference:end -->";
const registryStart = "<!-- stitch:screens:start -->";
const registryEnd = "<!-- stitch:screens:end -->";
const exec = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export class SyncError extends Error {}
export type Runner = (args: string[], cwd: string) => Promise<string>;
export interface SyncOptions {
  project?: string;
  screen: string;
  slug: string;
  surface: string;
  approved: boolean;
  replace: boolean;
}

const help = `Synchroniser un écran explicitement validé, sans modifier Stitch.

npm run stitch:sync -- --screen <ID> --slug <nom-du-dossier> --approved

Options :
  --project <ID>    Projet de cet écran (défaut : ${stitchProject}).
  --surface <texte>  Description dans le registre (ex. « Accueil · Mobile »).
  --replace          Autoriser un nouvel ID dans un dossier déjà synchronisé.
  --help             Afficher cette aide.

--approved atteste votre validation humaine de cet écran précis. Le script ne
déduit jamais une approbation de sa date ou de son titre. Aucun commit ni push
automatique. CLI locale @google/stitch 0.12.0 requise (syntaxe vérifiée).
`;

export function parseOptions(args: string[]): SyncOptions {
  const result: SyncOptions = {
    screen: "",
    slug: "",
    surface: "À préciser",
    approved: false,
    replace: false,
  };
  const used = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (used.has(arg)) throw new SyncError("Une option est répétée.");
    used.add(arg);
    if (arg === "--approved") result.approved = true;
    else if (arg === "--replace") result.replace = true;
    else if (["--screen", "--slug", "--surface", "--project"].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith("--"))
        throw new SyncError("Chaque option doit avoir une valeur.");
      if (arg === "--screen") result.screen = value;
      else if (arg === "--slug") result.slug = value;
      else if (arg === "--project") result.project = value;
      else result.surface = value;
    } else throw new SyncError("Option inconnue. Consultez --help.");
  }
  validateOptions(result);
  return result;
}

function validateOptions(options: SyncOptions) {
  if (options.project !== undefined && !/^\d{1,100}$/.test(options.project))
    throw new SyncError(
      "--project doit contenir un Project ID numérique, pas une URL.",
    );
  if (!options.approved)
    throw new SyncError(
      "Validez cet écran humainement, puis ajoutez --approved pour l’attester.",
    );
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(options.screen))
    throw new SyncError("--screen doit contenir un Screen ID, pas une URL.");
  if (
    options.slug.length > 80 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)
  )
    throw new SyncError(
      "--slug : utilisez des minuscules, chiffres et tirets.",
    );
  safeText(options.surface);
}

/** Never forward CLI stdout/stderr to the console: diagnostics can contain secrets. */
export const runStitch: Runner = async (args, cwd) => {
  try {
    const result = await exec("stitch", args, {
      cwd,
      encoding: "utf8",
      timeout: 90_000,
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    });
    return result.stdout;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new SyncError(
        "CLI Stitch absente. Sur la machine locale, installez @google/stitch@0.12.0, puis utilisez stitch login.",
      );
    throw new SyncError(
      "La commande Stitch a échoué ou expiré. Vérifiez localement stitch status et stitch --help. Aucune sortie brute n’a été enregistrée.",
    );
  }
};

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || parsed.success === false) throw new Error();
    return object(parsed.data) ? parsed.data : parsed;
  } catch {
    throw new SyncError(
      "Réponse JSON Stitch invalide. Aucun artefact modifié.",
    );
  }
}

/** Reject common credential material, including signed links, without printing it. */
function containsSecret(value: string): boolean {
  return [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:AIza[\w-]{30,}|ya29\.[\w.-]+|gh[pousr]_[\w]{20,})/,
    /\beyJ[\w-]+\.[\w-]{10,}\.[\w-]+\b/,
    /\bBearer\s+[\w.+/-]{12,}/i,
    /[?&](?:access_token|refresh_token|token|api_key|key|X-Goog-Signature|X-Amz-Signature)=([^\s"'<>]+)/i,
    /["'](?:access_token|refresh_token|client_secret|api_key|STITCH_API_KEY|STITCH_ACCESS_TOKEN)["']\s*:\s*["'][^"']+["']/i,
  ].some((pattern) => pattern.test(value));
}

function safeText(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 500 ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    containsSecret(value)
  )
    throw new SyncError(
      "Une métadonnée est invalide ou potentiellement sensible.",
    );
  return value.trim();
}

function markdown(value: string): string {
  return value.replace(/[\\`*_[\]<>|#]/g, "\\$&");
}

function resource(
  value: Record<string, unknown>,
  kind: string,
  expected: string,
  projectId = stitchProject,
) {
  const name = value.name;
  if (
    (value.id !== undefined && String(value.id) !== expected) ||
    (name !== undefined &&
      name !== expected &&
      name !==
        (kind === "project"
          ? `projects/${expected}`
          : `projects/${projectId}/screens/${expected}`)) ||
    (value.projectId !== undefined && String(value.projectId) !== projectId) ||
    (value.id === undefined && name === undefined)
  )
    throw new SyncError(
      "L’identité de la ressource Stitch ne correspond pas à la demande.",
    );
}

function replaceBlock(
  text: string,
  start: string,
  end: string,
  content: string,
) {
  const a = text.indexOf(start),
    b = text.indexOf(end);
  if (
    a < 0 ||
    b < a ||
    text.indexOf(start, a + start.length) >= 0 ||
    text.indexOf(end, b + end.length) >= 0
  )
    throw new SyncError(
      "Document sans balises de synchronisation valides. Conservez son contenu et rétablissez les balises décrites dans le guide.",
    );
  return text.slice(0, a) + start + "\n" + content + "\n" + text.slice(b);
}

async function optionalFile(path: string): Promise<Buffer | undefined> {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new SyncError(
        "Une référence locale n’est pas un fichier ordinaire.",
      );
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
}

/** No symlinked output ancestors: a slug must never write outside the repository. */
async function safeDirectories(root: string, paths: string[]) {
  let current = root;
  for (const segment of paths) {
    current = join(current, segment);
    try {
      const stat = await lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new SyncError(
          "Dossier de sortie non sûr : lien symbolique ou fichier.",
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(current);
    }
  }
}

function imageExtension(bytes: Buffer): string {
  if (bytes.length > 25 * 1024 * 1024)
    throw new SyncError("Capture trop volumineuse (maximum 25 Mo).");
  if (
    bytes.length >= 45 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString("ascii", 12, 16) === "IHDR" &&
    bytes.readUInt32BE(16) > 0 &&
    bytes.readUInt32BE(20) > 0 &&
    bytes.toString("ascii", bytes.length - 8, bytes.length - 4) === "IEND"
  )
    return "png";
  if (
    bytes.length > 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  )
    return "jpg";
  if (
    bytes.length > 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  throw new SyncError(
    "La capture téléchargée n’est pas une image PNG, JPEG ou WebP valide.",
  );
}

/** Read-only Stitch bridge; temporary downloads and failures never replace approved files. */
export async function syncScreen(
  options: SyncOptions,
  root = repositoryRoot,
  run: Runner = runStitch,
): Promise<{ directory: string; image: string; warnings: string[] }> {
  validateOptions(options);
  const projectId = options.project ?? stitchProject;
  const config = await optionalFile(join(root, ".stitch.json"));
  if (config) {
    let binding: unknown;
    try {
      binding = JSON.parse(config.toString("utf8"));
    } catch {
      throw new SyncError(".stitch.json n’est pas un JSON valide.");
    }
    if (
      !object(binding) ||
      Object.keys(binding).length !== 1 ||
      binding.project !== stitchProject
    )
      throw new SyncError(
        ".stitch.json doit contenir uniquement le projet attendu. Aucun contenu de ce fichier n’a été affiché ou réécrit.",
      );
  }
  const version = (await run(["--version"], root)).trim();
  if (version !== "0.12.0")
    throw new SyncError(
      "Version CLI non prise en charge. Utilisez @google/stitch@0.12.0 (syntaxe vérifiée).",
    );
  const status = json(await run(["status", "--json"], root));
  if (!(
    status.authenticated === true ||
    (object(status.canvas) && status.canvas.present === true)
  ))
    throw new SyncError(
      "Stitch n’est pas authentifié ici. Exécutez stitch login sur votre machine locale ; ne transférez pas les credentials vers le Cloud.",
    );
  const project = json(
    await run(["get", "project", projectId, "--json", "--no-cache"], root),
  );
  resource(project, "project", projectId, projectId);
  const payload = json(
    await run(
      [
        "get",
        "screen",
        options.screen,
        "--project",
        projectId,
        "--json",
        "--no-cache",
      ],
      root,
    ),
  );
  const screen = object(payload.screen) ? payload.screen : payload;
  resource(screen, "screen", options.screen, projectId);
  const title = safeText(screen.title);
  const base = join(root, "docs", "ux", "redesign");
  await safeDirectories(root, ["docs", "ux", "redesign"]);
  let lock;
  try {
    lock = await open(join(base, ".stitch-sync.lock"), "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new SyncError(
        "Une synchronisation est déjà en cours. Attendez sa fin ; voir le guide si le verrou est ancien.",
      );
    throw error;
  }
  const folder = join(base, options.slug);
  const warnings: string[] = [];
  let temp: string | undefined;
  let folderReady = false;
  try {
    temp = await mkdtemp(join(tmpdir(), "xt-stitch-sync-"));
    // Validate an existing folder before touching any files inside it.
    await safeDirectories(root, ["docs", "ux", "redesign", options.slug]);
    folderReady = true;
    const specPath = join(folder, "SPEC.md"),
      oldSpec = (await optionalFile(specPath))?.toString("utf8");
    if (oldSpec) {
      const previousId = oldSpec.match(/^Screen ID: (\S+)$/m)?.[1];
      const previousProject = oldSpec.match(/^Project ID: (\S+)$/m)?.[1];
      if (
        (previousId !== options.screen || previousProject !== projectId) &&
        !options.replace
      )
        throw new SyncError(
          "Ce dossier référence un autre écran. Choisissez un nouveau slug ou utilisez --replace après validation.",
        );
    }
    const png = join(temp, "capture.png");
    json(
      await run(
        [
          "download",
          "screen",
          options.screen,
          "--project",
          projectId,
          "--format",
          "png",
          "--output",
          png,
          "--json",
          "--no-cache",
        ],
        root,
      ),
    );
    const bytes = await optionalFile(png);
    if (!bytes)
      throw new SyncError("Stitch n’a pas produit la capture attendue.");
    const extension = imageExtension(bytes),
      image = `approved.${extension}`;
    if (containsSecret(bytes.toString("latin1")))
      throw new SyncError(
        "Capture potentiellement sensible : aucune référence remplacée.",
      );
    let html: string | undefined;
    if (
      object(screen.htmlCode) ||
      typeof screen.html === "string" ||
      typeof screen.content === "string"
    ) {
      try {
        const htmlPath = join(temp, "approved.html");
        json(
          await run(
            [
              "download",
              "screen",
              options.screen,
              "--project",
              projectId,
              "--format",
              "html",
              "--output",
              htmlPath,
              "--json",
              "--no-cache",
            ],
            root,
          ),
        );
        const file = await optionalFile(htmlPath);
        if (
          !file ||
          file.length > 5 * 1024 * 1024 ||
          !file.toString("utf8").trim()
        )
          throw new SyncError("Export HTML absent ou trop volumineux.");
        const content = file.toString("utf8");
        if (
          !/<(?:!doctype\s+html|html|body|div|main|section)\b/i.test(content) ||
          containsSecret(content)
        )
          throw new SyncError(
            "Export HTML invalide ou potentiellement sensible.",
          );
        html = content;
      } catch {
        warnings.push(
          "HTML non conservé : indisponible, non téléchargeable ou contrôle de sécurité non satisfait. La capture reste la référence.",
        );
      }
    }
    const reference = `Status: APPROVED\n\n## Stitch\n\nProject ID: ${projectId}\nScreen ID: ${options.screen}\nScreen title: ${markdown(title)}\nCLI version: ${version}\n\n## Reference\n\n- [${image}](${image})${html ? "\n- [approved.html](approved.html)" : ""}\n\nValidation: attestation humaine explicite par --approved ; aucun statut Stitch déduit.`;
    const initial = `# ${markdown(title)}\n\n${referenceStart}\n${referenceEnd}\n\n## Functional intent\n\nÀ renseigner pendant la validation UX.\n\n## Existing behaviour to preserve\n\nÀ renseigner avant l’implémentation.\n\n## Notes\n\nDesign explicitement validé avant implémentation.\n`;
    const spec = await format(
      replaceBlock(oldSpec ?? initial, referenceStart, referenceEnd, reference),
      { parser: "markdown" },
    );
    const registryPath = join(base, "SCREENS.md"),
      oldRegistry = (await optionalFile(registryPath))?.toString("utf8");
    if (!oldRegistry)
      throw new SyncError(
        "SCREENS.md absent : récupérez le dossier de workflow versionné avant de synchroniser.",
      );
    const a = oldRegistry.indexOf(registryStart),
      b = oldRegistry.indexOf(registryEnd);
    const block = oldRegistry.slice(a + registryStart.length, b);
    const rows = block.split("\n");
    const target = rows.findIndex((line) =>
      line.includes(`](${options.slug}/)`),
    );
    const row = `| ${markdown(title)} | ${markdown(options.surface)} | APPROVED | ${options.screen} | [${options.slug}](${options.slug}/) |`;
    if (target >= 0) rows[target] = row;
    else rows.push(row);
    const registry = await format(
      replaceBlock(
        oldRegistry,
        registryStart,
        registryEnd,
        rows.filter((line) => line.trim()).join("\n"),
      ),
      { parser: "markdown" },
    );

    // Only our generated files are replaced; before.png, assets and manual notes survive.
    const files = new Map<string, Buffer | undefined>();
    for (const name of [
      "approved.png",
      "approved.jpg",
      "approved.webp",
      "approved.html",
      "SPEC.md",
    ])
      files.set(join(folder, name), undefined);
    files.set(join(folder, image), bytes);
    files.set(
      join(folder, "approved.html"),
      html === undefined ? undefined : Buffer.from(html),
    );
    files.set(specPath, Buffer.from(spec));
    files.set(registryPath, Buffer.from(registry));
    const originals = new Map<string, Buffer | undefined>();
    for (const path of files.keys())
      originals.set(path, await optionalFile(path));
    try {
      for (const [path, content] of files) {
        if (content === undefined) await rm(path, { force: true });
        else {
          const next = join(dirname(path), `.stitch-next-${randomUUID()}`);
          await writeFile(next, content, { flag: "wx", mode: 0o600 });
          try {
            await rename(next, path);
          } finally {
            await rm(next, { force: true });
          }
        }
      }
    } catch {
      for (const [path, content] of originals) {
        if (content === undefined) await rm(path, { force: true });
        else await writeFile(path, content);
      }
      throw new SyncError(
        "Écriture interrompue ; les références précédentes ont été restaurées.",
      );
    }
    return { directory: `docs/ux/redesign/${options.slug}`, image, warnings };
  } finally {
    if (temp) await rm(temp, { recursive: true, force: true });
    // An unsuccessful first sync must not leave an empty APPROVED folder.
    if (
      folderReady &&
      (await readdir(folder).catch(() => ["preserved"])).length === 0
    )
      await rmdir(folder);
    await lock.close();
    await rm(join(base, ".stitch-sync.lock"), { force: true });
  }
}

async function main() {
  if (process.argv.slice(2).includes("--help")) {
    console.log(help);
    return;
  }
  try {
    const result = await syncScreen(parseOptions(process.argv.slice(2)));
    console.log(
      `Référence APPROVED synchronisée : ${result.directory}/${result.image}`,
    );
    for (const warning of result.warnings) console.warn(warning);
    console.log(
      "Complétez SPEC.md et relisez les artefacts avant de les committer/pousser. Les credentials et diagnostics d’authentification ne sont pas exportés.",
    );
  } catch (error) {
    console.error(
      error instanceof SyncError
        ? error.message
        : "Synchronisation interrompue. Vérifiez les droits locaux et les fichiers du workflow ; aucune sortie brute Stitch n’est affichée.",
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  await main();

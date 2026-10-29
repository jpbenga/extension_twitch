import { build, context } from "esbuild";
import { mkdir, writeFile, cp } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
export const twitchDist = resolve(root, "apps/twitch/dist");
export async function buildTwitch(watch = false) {
  await mkdir(twitchDist, { recursive: true });
  const options = {
    absWorkingDir: root,
    entryPoints: {
      viewer: "apps/twitch/src/viewer.tsx",
      config: "apps/twitch/src/config.tsx",
    },
    outdir: twitchDist,
    bundle: true,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    target: ["es2022"],
    minify: !watch,
    sourcemap: false,
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "portable-broadcast-fonts",
        setup(b) {
          b.onResolve({ filter: /^\/home\// }, (args) => ({
            path: "./home/" + args.path.slice(6),
            external: true,
          }));
        },
      },
    ],
  };
  await mkdir(resolve(twitchDist, "home"), { recursive: true });
  for (const name of ["spacegrotesk", "dmsans"])
    await cp(
      resolve(root, `apps/web/public/home/${name}.ttf`),
      resolve(twitchDist, `home/${name}.ttf`),
    );
  for (const [name, entry, title] of [
    ["panel", "viewer", "Plateau Undercover"],
    ["mobile", "viewer", "Undercover mobile"],
    ["video_overlay", "viewer", "Overlay Undercover"],
    ["config", "config", "Associer une partie Undercover"],
    ["live_config", "config", "Associer une partie Undercover"],
  ]) {
    const html = `<!doctype html>\n<html lang="fr" data-theme="broadcast-studio"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="referrer" content="no-referrer"><title>${title}</title><link rel="stylesheet" href="./${entry}.css"><script src="https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"></script><script type="module" src="./${entry}.js"></script></head><body><div id="root"></div></body></html>\n`;
    await writeFile(resolve(twitchDist, `${name}.html`), html);
  }
  await writeFile(
    resolve(twitchDist, "index.html"),
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Twitch Local Test</title></head><body><h1>Twitch Local Test</h1><p>Serveur HTTPS prêt. Les vues doivent être ouvertes depuis Twitch, avec Configuration Service activé.</p><ul><li>Panel Viewer : panel.html</li><li>Mobile : mobile.html (selon disponibilité Twitch)</li><li>Config : config.html</li><li>Live Config : live_config.html (facultatif)</li><li>Video Overlay : video_overlay.html (test vidéo séparé pouvant nécessiter un live)</li></ul><p>Aucun flux vidéo n’est émis par ce serveur.</p></body></html>`,
  );
  if (watch) {
    const c = await context(options);
    await c.watch();
    return c;
  }
  await build(options);
  return null;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildTwitch();

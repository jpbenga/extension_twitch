import { commandId } from "./session-client";
import { z } from "zod";
import {
  undercoverSettingsSchema,
  type UndercoverSettings,
} from "@extension-twitch/contracts/official-games";
import {
  createUndercoverTvLayout,
  undercoverLayoutSchema,
} from "@extension-twitch/contracts/undercover-layout";
import {
  applicationDefaultTheme,
  themeIdSchema,
} from "@extension-twitch/contracts/themes";
import { accessTokenSchema } from "@extension-twitch/contracts/sessions";

export const seriesDatabaseName = "extension-twitch-undercover-series";
const imageLimit = 2 * 1024 * 1024;
const name = z.string().max(80);
const content = z.strictObject({ name, imageId: z.uuid().optional() });
const editableSettings = z.strictObject({
  "civil-word": name,
  "undercover-word": name,
  "undercover-count": z.number().int().min(1).max(5),
  "clue-rounds": z.number().int().min(1).max(5),
  "round-limit": z.number().int().min(1).max(30),
});
export const preparationSchema = z.strictObject({
  id: z.uuid(),
  title: name,
  count: z.number().int().min(3).max(12),
  settings: editableSettings,
  overlayLayout: undercoverLayoutSchema,
  broadcastTheme: themeIdSchema,
  contents: z.strictObject({ a: content, b: content }),
  updatedAt: z.string(),
});
export type UndercoverPreparation = z.infer<typeof preparationSchema>;
export const seriesActiveSchema = z.strictObject({
  sessionId: z.uuid(),
  token: accessTokenSchema,
  preparationId: z.uuid(),
  index: z.number().int().nonnegative(),
  preparation: preparationSchema,
});
const seriesSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().min(1).max(80),
  token: accessTokenSchema.optional(),
  preparations: z.array(preparationSchema).max(100),
  draft: preparationSchema,
  active: seriesActiveSchema.optional(),
  pending: z.unknown().optional(),
});
export type UndercoverSeries = z.infer<typeof seriesSchema>;
export const seriesLibrarySchema = z.strictObject({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  selectedSeriesId: z.uuid(),
  series: z.array(seriesSchema).min(1).max(50),
  history: z.array(preparationSchema.extend({ seriesTitle: name })).max(500),
});
export type SeriesLibrary = z.infer<typeof seriesLibrarySchema>;
export const deviceImagesNotice =
  "Préparez et lancez cette série depuis le même appareil pour conserver vos images.";
export class SeriesStorageError extends Error {
  constructor(readonly kind: "unavailable" | "conflict" | "quota") {
    super(
      kind === "conflict"
        ? "Cette série a été modifiée dans un autre onglet. Vos changements sont conservés ici."
        : kind === "quota"
          ? "Cet appareil ne peut plus conserver cette image. Vos textes restent disponibles."
          : "Vos préparations ne peuvent pas être enregistrées sur cet appareil. Gardez cette page ouverte et réessayez.",
    );
  }
}
export function newPreparation(
  settings = undercoverSettingsSchema.parse({}),
): UndercoverPreparation {
  return {
    id: commandId(),
    title: "",
    count: 4,
    settings,
    overlayLayout: createUndercoverTvLayout(),
    broadcastTheme: applicationDefaultTheme,
    contents: {
      a: { name: settings["civil-word"] },
      b: { name: settings["undercover-word"] },
    },
    updatedAt: new Date().toISOString(),
  };
}
export function preparationName(p: UndercoverPreparation) {
  return p.title.trim() || `${p.contents.a.name} / ${p.contents.b.name}`;
}
export function validatedPreparation(p: UndercoverPreparation) {
  const settings: UndercoverSettings = {
    ...p.settings,
    "civil-word": p.contents.a.name,
    "undercover-word": p.contents.b.name,
  };
  return undercoverSettingsSchema.parse(settings);
}
export function copyPreparation(
  p: UndercoverPreparation,
): UndercoverPreparation {
  return {
    id: commandId(),
    title: p.title,
    count: p.count,
    settings: structuredClone(p.settings),
    overlayLayout: structuredClone(p.overlayLayout),
    broadcastTheme: p.broadcastTheme,
    contents: structuredClone(p.contents),
    updatedAt: new Date().toISOString(),
  };
}
export function newSeries(title = "Ma série Undercover"): UndercoverSeries {
  return {
    id: commandId(),
    title,
    preparations: [],
    draft: newPreparation(),
  };
}
export function newLibrary(): SeriesLibrary {
  const first = newSeries();
  return {
    version: 1,
    revision: 0,
    selectedSeriesId: first.id,
    series: [first],
    history: [],
  };
}
export function movePreparation(
  series: UndercoverSeries,
  from: number,
  to: number,
): UndercoverSeries {
  if (
    from < 0 ||
    to < 0 ||
    from >= series.preparations.length ||
    to >= series.preparations.length
  )
    return series;
  const preparations = [...series.preparations];
  const [item] = preparations.splice(from, 1);
  preparations.splice(to, 0, item!);
  return { ...series, preparations };
}
function opening(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(new SeriesStorageError("unavailable"));
    const request = indexedDB.open(seriesDatabaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("library");
      request.result.createObjectStore("images");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new SeriesStorageError("unavailable"));
    request.onblocked = () => reject(new SeriesStorageError("unavailable"));
  });
}
function value<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new SeriesStorageError("unavailable"));
  });
}
export async function loadSeriesLibrary(): Promise<SeriesLibrary> {
  const db = await opening();
  try {
    return await new Promise<SeriesLibrary>((resolve, reject) => {
      const tx = db.transaction("library", "readwrite");
      const store = tx.objectStore("library");
      const request = store.get("current");
      let library: SeriesLibrary;
      request.onsuccess = () => {
        try {
          library = request.result
            ? seriesLibrarySchema.parse(request.result)
            : { ...newLibrary(), revision: 1 };
          if (!request.result) store.put(library, "current");
        } catch {
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(library);
      tx.onabort = tx.onerror = () =>
        reject(new SeriesStorageError("unavailable"));
    });
  } catch (e) {
    if (e instanceof SeriesStorageError) throw e;
    throw new SeriesStorageError("unavailable");
  } finally {
    db.close();
  }
}
/** Compare-and-swap in one read/write transaction. Another tab can never be silently overwritten. */
export async function saveSeriesLibrary(
  library: SeriesLibrary,
  expectedRevision: number,
): Promise<SeriesLibrary> {
  const next = seriesLibrarySchema.parse({
    ...library,
    revision: expectedRevision + 1,
  });
  const db = await opening();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("library", "readwrite");
      const store = tx.objectStore("library");
      let conflict = false;
      const request = store.get("current");
      request.onsuccess = () => {
        const current = request.result as SeriesLibrary | undefined;
        if ((current?.revision ?? 0) !== expectedRevision) {
          conflict = true;
          tx.abort();
          return;
        }
        store.put(next, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () =>
        reject(new SeriesStorageError(conflict ? "conflict" : "unavailable"));
    });
    return next;
  } finally {
    db.close();
  }
}
export async function getSeriesImage(id: string): Promise<Blob | null> {
  const db = await opening();
  try {
    const raw: unknown = await value(
      db.transaction("images").objectStore("images").get(id),
    );
    return raw instanceof Blob && raw.type === "image/png" ? raw : null;
  } finally {
    db.close();
  }
}
export async function saveSeriesImage(blob: Blob): Promise<string> {
  if (blob.type !== "image/png" || blob.size > imageLimit)
    throw new SeriesStorageError("quota");
  const db = await opening(),
    id = commandId();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      tx.objectStore("images").add(blob, id);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new SeriesStorageError("quota"));
    });
    return id;
  } finally {
    db.close();
  }
}
/** Decode only user-selected raster images, reduce dimensions and encode a fresh PNG. */
export async function prepareSeriesImage(file: File): Promise<Blob> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error(
      "Choisissez une image PNG, JPEG ou WebP de moins de 15 Mo.",
    );
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      "Cette image ne peut pas être ouverte. Choisissez-en une autre.",
    );
  });
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width > 12000 ||
      bitmap.height > 12000
    )
      throw new Error(
        "Cette image est trop grande. Choisissez une image plus petite.",
      );
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "Cette image ne peut pas être préparée sur cet appareil.",
      );
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Choisissez une autre image.")),
        "image/png",
      ),
    );
    if (result.size > imageLimit)
      throw new Error(
        "Choisissez une image plus légère. Le texte peut être conservé sans image.",
      );
    return result;
  } finally {
    bitmap.close();
  }
}
/** Functional updates are safe for GM continuation and never overwrite a newer tab. */
export async function updateSeriesLibrary(
  update: (library: SeriesLibrary) => SeriesLibrary,
): Promise<SeriesLibrary> {
  const current = await loadSeriesLibrary();
  return saveSeriesLibrary(update(structuredClone(current)), current.revision);
}

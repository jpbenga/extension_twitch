"use client";
import { commandId } from "./session-client";
import { useEffect, useRef, useState } from "react";
import {
  loadSeriesLibrary,
  saveSeriesLibrary,
  SeriesStorageError,
  type SeriesLibrary,
  copyPreparation,
} from "./undercover-series";

export function useUndercoverSeries() {
  const [library, setLibrary] = useState<SeriesLibrary | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const current = useRef<SeriesLibrary | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef(false);
  const persistedRevision = useRef(0);
  useEffect(() => {
    let active = true;
    void loadSeriesLibrary()
      .then(async (value) => {
        if (active) {
          persistedRevision.current = value.revision;
          current.current = value;
          setLibrary(value);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Vos préparations ne peuvent pas être ouvertes.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!saving && !error) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving, error]);
  function update(
    change: (previous: SeriesLibrary) => SeriesLibrary,
  ): Promise<void> {
    const previous = current.current;
    if (!previous) return Promise.reject(new SeriesStorageError("unavailable"));
    const next = {
      ...change(structuredClone(previous)),
      revision: previous.revision + 1,
    };
    current.current = next;
    setLibrary(next);
    setSaving(true);
    const operation = queue.current.then(async () => {
      if (failed.current) throw new SeriesStorageError("unavailable");
      await saveSeriesLibrary(next, previous.revision);
      persistedRevision.current = next.revision;
    });
    queue.current = operation
      .catch((e) => {
        failed.current = true;
        setError(
          e instanceof Error
            ? e.message
            : "Vos changements restent affichés. Réessayez leur enregistrement.",
        );
      })
      .finally(() => setSaving(false));
    return operation;
  }
  async function reload() {
    const value = await loadSeriesLibrary();
    failed.current = false;
    persistedRevision.current = value.revision;
    current.current = value;
    setLibrary(value);
    setError("");
  }
  async function retry() {
    if (!current.current) return;
    const saved = await loadSeriesLibrary();
    await queue.current;
    if (saved.revision !== persistedRevision.current) {
      setError(
        "Une autre version est enregistrée. Conservez vos changements dans une nouvelle série avant de recharger.",
      );
      return;
    }
    const value = await saveSeriesLibrary(current.current, saved.revision);
    failed.current = false;
    current.current = value;
    persistedRevision.current = value.revision;
    setLibrary(value);
    setError("");
  }
  async function copyUnsaved() {
    if (!current.current) return;
    await queue.current;
    const stored = await loadSeriesLibrary();
    const ours = current.current.series.find(
      (s) => s.id === current.current!.selectedSeriesId,
    );
    if (!ours) return;
    const { active: _active, pending: _pending, token: _token, ...base } = ours;
    const copy = {
      ...structuredClone(base),
      id: commandId(),
      title: `${ours.title} (copie)`.slice(0, 80),
      preparations: ours.preparations.map(copyPreparation),
      draft: copyPreparation(ours.draft),
    };
    const value = await saveSeriesLibrary(
      {
        ...stored,
        selectedSeriesId: copy.id,
        series: [...stored.series, copy],
      },
      stored.revision,
    );
    failed.current = false;
    current.current = value;
    persistedRevision.current = value.revision;
    setLibrary(value);
    setError("");
  }
  return {
    library,
    update,
    saving,
    error,
    reload,
    retry,
    copyUnsaved,
    flush: () => queue.current,
  };
}

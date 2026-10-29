"use client";
import { useEffect, useRef, useState } from "react";
import {
  loadSeriesLibrary,
  saveSeriesLibrary,
  SeriesStorageError,
  type SeriesLibrary,
} from "./undercover-series";

export function useUndercoverSeries() {
  const [library, setLibrary] = useState<SeriesLibrary | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const current = useRef<SeriesLibrary | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef(false);
  useEffect(() => {
    let active = true;
    void loadSeriesLibrary()
      .then(async (value) => {
        if (active) {
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
    current.current = value;
    setLibrary(value);
    setError("");
  }
  async function retry() {
    if (!current.current) return;
    const saved = await loadSeriesLibrary();
    if (saved.revision !== current.current.revision - 1) {
      setError(
        "Une autre version est enregistrée. Conservez vos changements dans une nouvelle série avant de recharger.",
      );
      return;
    }
    const value = await saveSeriesLibrary(current.current, saved.revision);
    failed.current = false;
    current.current = value;
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
    flush: () => queue.current,
  };
}

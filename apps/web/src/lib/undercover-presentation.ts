/** Product vocabulary only. Persisted command IDs and official definitions keep their existing semantics. */
export function undercoverActionLabel(id: string, fallback: string) {
  return id === "next" ? "Commencer un nouveau cycle" : fallback;
}

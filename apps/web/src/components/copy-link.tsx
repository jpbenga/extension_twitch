"use client";

import { useRef, useState } from "react";

export function CopyLink({
  label,
  value,
  privateLink = false,
}: {
  label: string;
  value: string;
  privateLink?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Manual selection required");
      await navigator.clipboard.writeText(value);
      setFeedback("Lien copié.");
    } catch {
      input.current?.focus();
      input.current?.select();
      setFeedback(
        "Sélectionnez et copiez le lien avec le menu de votre appareil.",
      );
    }
  }
  return (
    <div className="copy-block">
      <label>
        {label}
        <input
          ref={input}
          value={value}
          readOnly
          type="text"
          autoComplete="off"
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
        />
      </label>
      <button
        type="button"
        className="secondary-button"
        onClick={() => void copy()}
      >
        Copier {privateLink ? "mon accès privé" : "le lien"}
      </button>
      {feedback && <small role="status">{feedback}</small>}
    </div>
  );
}

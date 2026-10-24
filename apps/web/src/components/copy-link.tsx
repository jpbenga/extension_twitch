"use client";

import { useRef, useState } from "react";

export function CopyLink({
  label,
  value,
  privateLink = false,
  compact = false,
  buttonLabel,
}: {
  label: string;
  value: string;
  privateLink?: boolean;
  compact?: boolean;
  buttonLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("Manual selection required");
      await navigator.clipboard.writeText(value);
      setFeedback("Lien copié.");
    } catch {
      // Clipboard API requires HTTPS; copying a temporary hidden field also works
      // on trusted HTTP LANs without displaying a private capability in the UI.
      const temporary = document.createElement("textarea");
      temporary.value = value;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      temporary.style.top = "0";
      temporary.style.left = "0";
      temporary.style.width = "1px";
      temporary.style.height = "1px";
      const previous = document.activeElement as HTMLElement | null;
      document.body.appendChild(temporary);
      temporary.readOnly = true;
      temporary.select();
      temporary.setSelectionRange(0, value.length);
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        /* Manual fallback. */
      }
      temporary.remove();
      previous?.focus();
      if (copied) {
        setFeedback("Lien copié.");
        return;
      }
      if (compact) {
        setFeedback(
          "Copie automatique indisponible. Utilisez le menu du lien d’ouverture (appui long sur iPhone) pour copier son adresse privée.",
        );
        return;
      }
      if (privateLink) {
        setFeedback(
          "Utilisez le menu du lien Ouvrir mon accès privé pour copier son adresse (appui long sur iPhone).",
        );
      } else {
        input.current?.focus();
        input.current?.select();
        setFeedback(
          "Sélectionnez et copiez le lien avec le menu de votre appareil.",
        );
      }
    }
  }
  return (
    <div className="copy-block">
      {!compact && (
        <label>
          {label}
          <input
            ref={input}
            value={value}
            readOnly
            type={privateLink ? "password" : "text"}
            autoComplete="off"
            spellCheck={false}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      )}
      <button
        type="button"
        className="secondary-button"
        onClick={() => void copy()}
      >
        {buttonLabel ??
          (privateLink ? "Copier mon accès privé" : "Copier le lien")}
      </button>
      {privateLink && !compact && (
        <a
          className="text-link"
          href={value}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir mon accès privé
        </a>
      )}
      {feedback && <small role="status">{feedback}</small>}
    </div>
  );
}

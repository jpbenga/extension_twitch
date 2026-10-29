"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Button, Alert } from "./primitives";
export type ConfirmOptions = {
  title: string;
  description: string;
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "neutral" | "warning" | "danger" | "vote";
  presentation?: "stitch";
  onConfirm?: () => void | boolean | Promise<unknown>;
};
type Confirm = (options: ConfirmOptions) => Promise<boolean>;
const Context = createContext<{
  confirm: Confirm;
  notify: (text: string) => void;
} | null>(null);
export function useConfirm() {
  const context = useContext(Context);
  if (!context) throw new Error("FeedbackProvider is required");
  return context.confirm;
}
export function useToast() {
  const context = useContext(Context);
  if (!context) throw new Error("FeedbackProvider is required");
  return context.notify;
}
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);
  const opener = useRef<HTMLElement | null>(null),
    flight = useRef(false);
  const originScope = useRef<HTMLElement | null>(null),
    lastPointer = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId(),
    descriptionId = useId();
  const confirm = useCallback<Confirm>((next) => {
    if (resolver.current) return Promise.resolve(false);
    opener.current =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : lastPointer.current;
    originScope.current =
      opener.current?.closest<HTMLElement>(
        "#game,.dedicated-editor,.session-shell,.experience-shell,.stitch-page",
      ) ?? null;
    setError("");
    setBusy(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);
  const notify = useCallback(
    (text: string) => setToast({ text, id: Date.now() }),
    [],
  );
  function finish(accepted: boolean) {
    dialog.current?.close();
    setOptions(null);
    setError("");
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(accepted);
    const target = opener.current;
    const scope = originScope.current;
    const key = target?.dataset.focusKey;
    const restore = (attempt = 0) => {
      // An async command may finish one render before its opener is re-enabled.
      // Do not steal focus if another confirmation has already been opened.
      if (resolver.current) return;
      const candidate = target?.isConnected
        ? target
        : key && scope?.isConnected
          ? scope.querySelector<HTMLElement>(
              `[data-focus-key="${CSS.escape(key)}"]`,
            )
          : null;
      if (candidate?.hasAttribute("disabled") && attempt < 3) {
        requestAnimationFrame(() => restore(attempt + 1));
        return;
      }
      if (candidate && !candidate.hasAttribute("disabled")) {
        candidate.focus({ preventScroll: true });
        if (document.activeElement === candidate) return;
      }
      const fallback =
        (scope?.isConnected
          ? scope.querySelector<HTMLElement>(".game-phase,h1,h2")
          : null) ?? document.querySelector<HTMLElement>("main h1");
      if (fallback) {
        fallback.tabIndex = -1;
        fallback.focus({ preventScroll: true });
      }
    };
    requestAnimationFrame(() => restore());
  }

  useEffect(() => {
    // Safari touch activation does not always focus a button before its click.
    const remember = (event: PointerEvent) => {
      lastPointer.current =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(
              "button,[href],summary,input,select,textarea",
            )
          : null;
    };
    document.addEventListener("pointerdown", remember, true);
    return () => document.removeEventListener("pointerdown", remember, true);
  }, []);
  useEffect(() => {
    if (resolver.current && !flight.current) finish(false);
  }, [pathname]);
  useEffect(() => {
    if (busy) dialog.current?.focus({ preventScroll: true });
  }, [busy]);
  useEffect(() => {
    if (!options || !dialog.current) return;
    dialog.current.showModal();
    cancel.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [options]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      resolver.current?.(false);
      resolver.current = null;
    },
    [],
  );
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      document.documentElement.style.setProperty(
        "--visual-viewport-height",
        `${viewport?.height ?? innerHeight}px`,
      );
      const editing = document.activeElement?.matches("input,select,textarea");
      document.body.dataset.keyboardOpen = String(
        !!editing && (viewport?.height ?? innerHeight) < innerHeight * 0.8,
      );
    };
    viewport?.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      viewport?.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);
  async function accept() {
    if (flight.current || !options) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await options.onConfirm?.();
      if (result === false || result === null) {
        setError(
          "L’action n’a pas été confirmée. Fermez cette fenêtre pour consulter le message et reprendre sans doubler la commande.",
        );
      } else finish(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "L’action a échoué. Votre travail est conservé. Réessayez après avoir vérifié la connexion.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ confirm, notify }}>
      {children}
      {options &&
        createPortal(
          <dialog
            ref={dialog}
            tabIndex={-1}
            className={`confirm-dialog tone-${options.tone ?? "neutral"}${options.presentation === "stitch" ? " stitch-dialog" : ""}`}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={busy}
            onCancel={(e) => {
              e.preventDefault();
              if (!flight.current) finish(false);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const nodes = Array.from(
                e.currentTarget.querySelectorAll<HTMLElement>(
                  "button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex='0']",
                ),
              );
              const first = nodes[0],
                last = nodes.at(-1);
              if (!first) {
                e.preventDefault();
                return;
              }
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="dialog-symbol" aria-hidden="true">
              {options.tone === "danger"
                ? "!"
                : options.tone === "warning"
                  ? "↻"
                  : "◇"}
            </div>
            <h2 id={titleId}>{options.title}</h2>
            <p id={descriptionId}>{options.description}</p>
            {options.consequences && (
              <ul className="dialog-consequences">
                {options.consequences.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="dialog-actions">
              <Button
                variant={
                  options.tone === "danger"
                    ? "danger"
                    : options.tone === "warning"
                      ? "warning"
                      : options.tone === "vote"
                        ? "vote"
                        : "primary"
                }
                loading={busy}
                onClick={() => void accept()}
              >
                {options.confirmLabel ?? "Confirmer"}
              </Button>
              <Button
                ref={cancel}
                variant="secondary"
                disabled={busy}
                onClick={() => finish(false)}
              >
                {options.cancelLabel ?? "Annuler"}
              </Button>
            </div>
            {busy && (
              <p role="status" className="dialog-pending">
                Confirmation en cours…
              </p>
            )}
          </dialog>,
          document.body,
        )}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="ui-toast" key={toast.id}>
            <span aria-hidden="true">✓</span>
            {toast.text}
            <button
              className="ui-icon-button"
              aria-label="Fermer la notification"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}

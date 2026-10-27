"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applicationDefaultTheme,
  officialThemes,
  themeIdSchema,
  type ThemeId,
} from "@extension-twitch/contracts/themes";
const themeKey = "xt:theme:application";
const ThemeContext = createContext({
  theme: applicationDefaultTheme,
  ready: false,
  error: "",
  choose: (_theme: ThemeId) => {},
});
export function ApplicationTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(applicationDefaultTheme),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const stored = themeIdSchema.safeParse(localStorage.getItem(themeKey));
      if (stored.success) setTheme(stored.data);
    } catch {
      setError(
        "Votre préférence ne peut pas être conservée dans ce navigateur.",
      );
    }
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key === themeKey) {
        const next = themeIdSchema.safeParse(e.newValue);
        setTheme(next.success ? next.data : applicationDefaultTheme);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function choose(next: ThemeId) {
    setTheme(next);
    try {
      localStorage.setItem(themeKey, next);
      setError("");
    } catch {
      setError(
        "Thème appliqué pour cet onglet. Le navigateur ne peut pas conserver votre préférence.",
      );
    }
  }
  return (
    <ThemeContext.Provider value={{ theme, ready, error, choose }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeControl({ icon }: { icon?: ReactNode }) {
  const context = useContext(ThemeContext);
  return (
    <details
      className="theme-control"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Apparence de l’application">{icon}Apparence</summary>
      <div>
        <label>
          Thème de l’application
          <select
            aria-label="Thème de l’application"
            value={context.theme}
            disabled={!context.ready}
            onChange={(e) =>
              context.choose(themeIdSchema.parse(e.target.value))
            }
          >
            {officialThemes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          Sur ce navigateur uniquement. Le plateau de l’émission garde son
          propre thème.
        </p>
        {context.error && <p role="status">{context.error}</p>}
      </div>
    </details>
  );
}
export function BroadcastThemeSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: ThemeId;
  onChange: (v: ThemeId) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      Thème de l’émission
      <select
        aria-label="Thème de l’émission"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(themeIdSchema.parse(e.target.value))}
      >
        {officialThemes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <small>
        Enregistré pour cette partie. Changer l’apparence de votre application
        ne changera pas OBS.
      </small>
    </label>
  );
}

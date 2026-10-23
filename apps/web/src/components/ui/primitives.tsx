"use client";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
export type Tone =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "vote"
  | "info"
  | "quiet";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Tone;
  loading?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        type={props.type ?? "button"}
        ref={ref}
        className={`ui-button ui-button-${variant} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading && <span className="ui-spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
export function IconButton({
  label,
  children,
  ...props
}: ButtonProps & { label: string }) {
  return (
    <Button
      {...props}
      aria-label={label}
      className={`ui-icon-button ${props.className ?? ""}`}
    >
      {children}
    </Button>
  );
}
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`ui-card ${className}`} />;
}
export function Panel({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`ui-panel ${className}`} />;
}
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`ui-badge tone-${tone}`}>{children}</span>;
}
export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <div
      className={`ui-alert tone-${tone}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ui-input ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`ui-input ${props.className ?? ""}`} />;
}
export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="checkbox"
      className={`ui-checkbox ${props.className ?? ""}`}
    />
  );
}
export function Accordion({
  title,
  children,
  open,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="ui-accordion" open={open}>
      <summary>{title}</summary>
      {children}
    </details>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function LoadingState({
  children = "Chargement…",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="ui-loading" role="status">
      <span className="ui-spinner" aria-hidden="true" />
      {children}
    </p>
  );
}
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav className="ui-segmented creator-tabs" aria-label={label}>
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          className="secondary-button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => {
            const index =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? options.length - 1
                  : e.key === "ArrowRight"
                    ? (i + 1) % options.length
                    : e.key === "ArrowLeft"
                      ? (i - 1 + options.length) % options.length
                      : -1;
            if (index < 0) return;
            e.preventDefault();
            onChange(options[index]!.value);
            (
              e.currentTarget.parentElement?.children[index] as
                HTMLElement | undefined
            )?.focus();
          }}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}

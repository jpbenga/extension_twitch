"use client";
import { cloneElement, isValidElement, type ReactNode } from "react";
import type {
  Scalar,
  ValueSpec,
} from "@extension-twitch/contracts/game-definition";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="studio-field">
      {label}
      {isValidElement<{ "aria-label"?: string }>(children)
        ? cloneElement(children, {
            "aria-label": children.props["aria-label"] ?? label,
          })
        : children}
    </label>
  );
}
export function TextField({
  label,
  value,
  onChange,
  max = 80,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        aria-label={label}
        value={value}
        maxLength={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
export function ScalarField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Scalar;
  onChange: (v: Scalar) => void;
}) {
  return (
    <Field label={label}>
      {typeof value === "boolean" ? (
        <select
          aria-label={label}
          value={String(value)}
          onChange={(e) => onChange(e.target.value === "true")}
        >
          <option value="true">Vrai</option>
          <option value="false">Faux</option>
        </select>
      ) : (
        <input
          aria-label={label}
          type={typeof value === "number" ? "number" : "text"}
          value={value}
          maxLength={240}
          onChange={(e) =>
            onChange(
              typeof value === "number"
                ? Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </Field>
  );
}
export const defaultSpec = (type: ValueSpec["type"]): ValueSpec =>
  type === "integer"
    ? { type, min: 0, max: 100000, initial: 0 }
    : type === "text"
      ? { type, maxLength: 80, initial: "" }
      : { type, initial: false };
export function ValueFields({
  value,
  onChange,
  prefix,
}: {
  value: ValueSpec;
  onChange: (v: ValueSpec) => void;
  prefix: string;
}) {
  return (
    <div className="studio-grid">
      <Field label={`Type · ${prefix}`}>
        <select
          aria-label={`Type · ${prefix}`}
          value={value.type}
          onChange={(e) =>
            onChange(defaultSpec(e.target.value as ValueSpec["type"]))
          }
        >
          <option value="integer">Nombre entier</option>
          <option value="text">Texte</option>
          <option value="boolean">Booléen</option>
        </select>
      </Field>
      <ScalarField
        label={`Valeur initiale · ${prefix}`}
        value={value.initial}
        onChange={(initial) => onChange({ ...value, initial } as ValueSpec)}
      />
      {value.type === "integer" && (
        <>
          <ScalarField
            label={`Minimum · ${prefix}`}
            value={value.min}
            onChange={(min) => onChange({ ...value, min: Number(min) })}
          />
          <ScalarField
            label={`Maximum · ${prefix}`}
            value={value.max}
            onChange={(max) => onChange({ ...value, max: Number(max) })}
          />
        </>
      )}
      {value.type === "text" && (
        <ScalarField
          label={`Longueur maximum · ${prefix}`}
          value={value.maxLength}
          onChange={(maxLength) =>
            onChange({ ...value, maxLength: Number(maxLength) })
          }
        />
      )}
    </div>
  );
}

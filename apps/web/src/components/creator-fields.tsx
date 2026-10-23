"use client";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
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
/** Keep incomplete numeric typing in the native control, without turning an empty field into zero. */
export function NumberInput({
  value,
  onChange,
  label,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current && document.activeElement !== input.current)
      input.current.value = String(value);
  }, [value]);
  return (
    <input
      ref={input}
      aria-label={label}
      type="number"
      required
      step={1}
      min={min}
      max={max}
      defaultValue={value}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== "" && Number.isFinite(Number(raw))) onChange(Number(raw));
      }}
    />
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
      ) : typeof value === "number" ? (
        <NumberInput label={label} value={value} onChange={onChange} />
      ) : (
        <input
          aria-label={label}
          type="text"
          value={value}
          maxLength={240}
          onChange={(e) => onChange(e.target.value)}
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
      <Field label={`Type de ${prefix}`}>
        <select
          aria-label={`Type de ${prefix}`}
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
        label={`Valeur de départ de ${prefix}`}
        value={value.initial}
        onChange={(initial) => onChange({ ...value, initial } as ValueSpec)}
      />
      {value.type === "integer" && (
        <>
          <ScalarField
            label={`Minimum pour ${prefix}`}
            value={value.min}
            onChange={(min) => onChange({ ...value, min: Number(min) })}
          />
          <ScalarField
            label={`Maximum pour ${prefix}`}
            value={value.max}
            onChange={(max) => onChange({ ...value, max: Number(max) })}
          />
        </>
      )}
      {value.type === "text" && (
        <ScalarField
          label={`Longueur maximale pour ${prefix}`}
          value={value.maxLength}
          onChange={(maxLength) =>
            onChange({ ...value, maxLength: Number(maxLength) })
          }
        />
      )}
    </div>
  );
}

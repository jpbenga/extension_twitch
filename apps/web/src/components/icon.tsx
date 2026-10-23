import type { CSSProperties } from "react";

type IconName =
  "grid" | "screen" | "people" | "spark" | "arrow" | "check" | "signal";
const paths: Record<IconName, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  screen: "M3 4h18v13H3zM8 21h8M12 17v4",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  arrow: "M5 12h14M12 5l7 7-7 7",
  check: "m5 12 4 4L19 6",
  signal: "M4 20v-4M10 20V10M16 20V4M22 20V1",
};

export function Icon({
  name,
  style,
}: {
  name: IconName;
  style?: CSSProperties;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}

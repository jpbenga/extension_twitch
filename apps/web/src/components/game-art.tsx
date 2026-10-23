export function GameArt({ symbol }: { symbol: "diamond" | "auction" | "eye" }) {
  return (
    <svg
      className="game-art"
      viewBox="0 0 160 120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="80" cy="60" r="48" stroke="currentColor" opacity=".12" />
      <circle
        cx="80"
        cy="60"
        r="36"
        stroke="currentColor"
        opacity=".18"
        strokeDasharray="2 6"
      />
      {symbol === "diamond" && (
        <>
          <path
            d="m80 18 34 42-34 42-34-42z"
            fill="currentColor"
            opacity=".15"
          />
          <path
            d="m80 18 34 42-34 42-34-42zM46 60h68M80 18 65 60l15 42 15-42z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </>
      )}
      {symbol === "auction" && (
        <>
          <rect
            x="57"
            y="29"
            width="49"
            height="24"
            rx="5"
            transform="rotate(-35 80 41)"
            fill="currentColor"
            opacity=".25"
          />
          <path
            d="m74 51 25 35M55 53l40-28 14 20-40 28zM59 96h51M66 88h37v8H66"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </>
      )}
      {symbol === "eye" && (
        <>
          <path
            d="M27 60s20-29 53-29 53 29 53 29-20 29-53 29-53-29-53-29Z"
            fill="currentColor"
            opacity=".13"
          />
          <path
            d="M27 60s20-29 53-29 53 29 53 29-20 29-53 29-53-29-53-29Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle
            cx="80"
            cy="60"
            r="17"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="80" cy="60" r="7" fill="currentColor" />
        </>
      )}
      <path
        d="M20 24h8M24 20v8M131 96h8M135 92v8"
        stroke="currentColor"
        opacity=".5"
      />
    </svg>
  );
}

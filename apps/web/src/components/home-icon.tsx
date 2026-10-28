const paths = {
  game: "M6 7h12a3 3 0 0 1 3 2l1 8a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-8a3 3 0 0 1 3-2ZM7 10v4m-2-2h4m7-1h.01M19 13h.01",
  key: "M14 10a5 5 0 1 0 0 4h7v-4h-7ZM7 12h.01",
  eye: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  gavel: "m7 3 7 7m-9-5 7 7m1-9 5 5-6 6-5-5 6-6Zm0 10 7 7M4 21h10",
  palette:
    "M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c-2-3-5-5-9-5ZM7 9h.01M10 6h.01M15 7h.01M6 13h.01",
  info: "M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  screen: "M3 4h18v13H3zM8 21h8M12 17v4",
  arrow: "M5 12h14M12 5l7 7-7 7",
  lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
  copy: "M9 9h12v12H9zM5 15H3V3h12v2",
  mic: "M9 3h6v11a3 3 0 0 1-6 0V3ZM5 10v4a7 7 0 0 0 14 0v-4M12 21v2",
  audio: "M10 5 5 9H2v6h3l5 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  hidden:
    "m3 3 18 18M10 5h2c7 0 10 7 10 7a17 17 0 0 1-3 4M6 6a17 17 0 0 0-4 6s3 7 10 7a12 12 0 0 0 5-1M9 9a4 4 0 0 0 6 6",
  check: "m5 12 4 4L19 6M22 12a10 10 0 1 1-5-9",
  ban: "M5 5l14 14M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  equal: "M5 8h14M5 16h14",
  trophy:
    "M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-5 1h10",
  sad: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM8 9h.01M16 9h.01M8 17q4-5 8 0",
  chart: "M5 20v-6M12 20V4M19 20V9",
  chevron: "m9 5 7 7-7 7",
};
export function HomeIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

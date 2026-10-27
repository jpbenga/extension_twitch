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

# Documentation check — accueil / accès animateur

At design-review time no canonical design-system file was changed. Human approval is now recorded in `APPROVAL.json`; this branch therefore merges only the approved durable rules into the existing `docs/ux/redesign/DESIGN.md`, without replacing its incumbent system.

## Sources checked

- `design/undercover-consolidation/DESIGN.md`
- `docs/ux/redesign/DESIGN.md`
- `design/home-host-access/prototype.html`
- `design/home-host-access/HANDOFF.md`
- the final desktop/mobile captures under `screens/`

## Five-line system summary

- **Palette:** Neon Show remains the proposal reference: ink `#0C0C1F`, card `#1A1A2D`, raised surface `#28283C`, text `#E2E0FB`, muted `#B7A8D4`, lilac `#CEBDFF`, citron `#C8F323`.
- **Type:** local Space Grotesk for display, labels and controls; local DM Sans for body copy; 40/48 desktop display maximum, 28/35 mobile display, and 16px mobile inputs.
- **Geometry:** 12–16px surface radii, 8px control radii, restrained borders, 44–48px minimum interactive targets and visible 3px focus treatment.
- **Named rules:** one contextual dominant action; permanent but compact host navigation; local theme is independent from public OBS theme; no fabricated GM access.
- **Responsive rule:** desktop keeps the game/host relationship; mobile puts the contextual host state first and renders Theme/Espace animateur as focused bottom sheets without horizontal scrolling.

## Approved extension rules carbonized by this branch

- Rename the current home control from `Apparence` to `Thème`.
- Selecting any theme, including the current one, applies it and closes the selector; outside click and Escape close it; focus returns to the trigger.
- `Espace animateur` is a compact navigation entry to prepared parties, an authorized current GM session and diffusion—not a new dashboard or account product.
- The host panel exposes only the one current action justified by real state: prepare, continue preparation, open lobby or open GM control.
- Device-local preparations remain reachable even when a remembered session is invalid or expired.

## Provenance and boundary

The spy illustration is the current application's public artwork, reused as the visual anchor. Fonts are the current application's local font assets. No new brand asset, backend, authentication model, route, persistence mechanism, React/Next.js code or OBS behavior was created. Stitch Screen IDs are recorded only after successful import. Human approval is recorded in `APPROVAL.json`; this document remains a design-system review, not application implementation.

## Not canonized

No defect or craft-floor refusal is canonized. The approved host navigation and Theme interaction are merged as an extension of the current home system; palette, typography, OBS theming and the other approved experiences remain unchanged.

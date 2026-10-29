> Archive de conception et de vérification. La validation visuelle du 29 octobre 2026 est acquise ; APPROVAL.json et manifest.json définissent le lot approuvé. Les anciens statuts AWAITING_APPROVAL décrivent les étapes précédentes.

# Undercover TV — Motion study

Status: AWAITING_APPROVAL. This is a motion-only extension of the approved lightweight Undercover TV renderer, not a visual redesign. No new screen inherits its source screen's human approval.

Preserve the existing 1920×1080 balanced TV v2 rectangles, local Space Grotesk and DM Sans, transparent centre, slender upper capsules and transient lower thirds. Source application commit: d27458974b4c763e2911952b5295b4b0deae893d. Existing approved Stitch source project: 17376000961075708568.

Neon Show public-session palette: background #0c0c1f, surface #1a1a2d, raised #28283c, ink #e2e0fb, secondary #b7a8d4, lilac #cebdff, outcome #c8f323. Never derive the public theme from a viewer's private preference.

Motion uses existing --duration-fast:140ms, --duration-enter:180ms and --ease-ui:cubic-bezier(.2,.8,.2,1). Rare card reveals use 240ms with the same curve. Animate opacity and transform only. Event hold times are not animation durations. No permanent pulse, aggressive glow, bounce, shake, flash or full-screen celebratory decoration.

Cards preserve size for 3,6 and12 players. Larger rosters use existing pages of three and stable player numbers. Pause/replay demo controls are outside OBS and do not imply backend pause support.

Anonymous duo, visible assignments, authorized final result and newly authorized next-pair prototypes are separate physical documents. Never embed private assignment/final fixtures in the anonymous document and hide them. Never load the next private prepared pair before public authorization. Anonymous votes contain only the number received.

Reduced motion: opacity-only100ms, no translation, stagger, glow or animated progress transform. A late opening shows the durable current state immediately rather than replaying historical effects. A new state cancels expired timers and obsolete effects; normal illustrative transitions retain short exits.

Partie means the prepared experience container. Manche means the prepared pair. Cycle d’élimination means new clues and vote with the same pair. No new game rules are defined.

Twelve static Storyboard sheets complement four real standalone interactive prototypes and seven video recordings. Stitch's static thumbnails alone cannot demonstrate motion. Prototypes and alpha proofs are local deliverables, with separate normal and actual prefers-reduced-motion checks. No physical OBS/iPhone testing is claimed.

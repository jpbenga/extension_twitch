> Historical finish review. Its targeted verdict at the end reached `ship`; human approval was subsequently recorded in `APPROVAL.json`.

disposition: fix

## disposition

Fix the illustration fidelity finding before importing the final proposal batch. This is an independent, file-only finish review. The proposal remains **AWAITING_APPROVAL**; this review grants no product approval or integration authorization.

## evidence

Inspected the supplied original `references/before-user.png`, all 14 final screenshots under `screens/` (live, empty, theme and host at desktop/mobile/user width, plus draft/lobby desktop), `BRIEF.en.md`, `HANDOFF.md`, `QA.json` and the prototype markup, styles and script. Captures show the claimed states, document tops and coherent rendered content. The mobile open-menu captures show complete sheets with all controls visible. No required capture is absent or blank.

| Element           | Finding                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TYPE              | Match: retained Space Grotesk/DM Sans character, lilac display hierarchy and readable mobile reflow.                                                                 |
| MATERIAL          | Contradicted in prominence: original raster spy scene becomes a shallow top strip; much of its central subject disappears.                                           |
| GROUND            | Match: ink-indigo page, lilac text and citron action remain coherent with the user reference.                                                                        |
| Composition       | Acceptable adaptation: same game/host/invitation relationships on desktop; host-first mobile stack is allowed by the brief.                                          |
| Host access       | Match: permanent named header entry, prepared parties, GM and diffusion navigation; contextual current item; no new dashboard or account flow.                       |
| Contextual resume | Match: live/lobby/draft labels are mutually exclusive; empty state has no active session claim or disabled pretend resume.                                           |
| Theme             | Match: named choices, swatches, selected check, immediate apply/close, same-choice close, Escape/outside close and focus return represented in code and reported QA. |
| Existing entries  | Match: preparation, discovery, invitation input/join, unavailable future games and catalog entry remain present.                                                     |

The code makes the mobile app background inert, traps sheet focus and provides explicit 44px close targets. GM links are visually disabled and removed from tab order for empty/draft fixtures. The handoff retains server authorization checks and device-local preparation limits. Prototype destination messages are explicitly simulated; they do not confer permissions.

## material findings

1. **Fidelity — illustration footprint.** In the original user capture, the spy scene fills most of the game card and the central detective remains visible behind the title. In `live-desktop.png` and `live-user.png`, the image fades out around the upper third, leaving a conspicuous empty field between the illustration and Undercover title. On mobile it becomes roughly a 90px strip. `.art .fallback` uses the shortened `1360/350` frame, while the card remains tall. Removing duplicated baked lettering is appropriate, but this crop materially reduces the retained premium gaming identity beyond the requested small refinement.

## fixes

1. Restore the same spy illustration's substantial presence across the game card using a clean existing artwork asset or a clean crop sized to fill the illustrated region; preserve the central detective and avoid baked UI lettering. Keep the current home structure, host access and theme behavior. Recapture the same desktop/mobile/user paths and score this finding before final import.

## limits

No browser, rendering, detector, generation, repository/Git or Stitch operation was performed by this reviewer. Interaction results in QA.json are builder-supplied and corroborated by code inspection, not independently exercised. The detector was unavailable because of the reported permission denial; no full mechanical audit is claimed. No formal comp-diff/state packet, QUALITY BAR card or concept-roll contract was supplied; this targeted proposal was judged against the actual user screenshot and pinned brief. Real routes, session permissions and persistence remain future integration work; static screenshots and fixtures cannot establish them. The superseded native Stitch output was excluded from the verdict.

## Targeted verdict after fix

- **Illustration footprint — resolved.** The same current-product spy artwork now fills the complete game card at desktop, mobile and the reported user width. The central detective and surrounding cast remain visible behind the content, with a bottom scrim preserving title and control contrast.
- **Regression check — clear.** The card topology, host access, invitation form, contextual action hierarchy and open Theme/Espace animateur panels remain intact in the recaptured views. No new crop, blank region, overflow or competing CTA was introduced by the fix.

## Remaining

Clear for import as a proposal. This verdict covers the scored illustration fix; it does not grant human approval or authorize application integration.

disposition: ship

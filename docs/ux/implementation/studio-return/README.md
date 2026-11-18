# Retour Studio — Undercover

Implementation of the APPROVED Studio Return for Stitch project
`1278031240213552869`.

## Architecture

- `/sessions/:id/studio`: anonymous, read-only Studio projection over HTTP/SSE.
- `/sessions/:id/studio/rehearsal`: local fixture-only rehearsal; it never opens a
  command connection and never writes to the referenced session.
- `projectStudioSession`: server-side allow-list projection. Before the final
  outcome it cannot serialize roles, secret content, assignments, individual
  votes, GM data, events, Broadcast themes or OBS layouts.
- `StudioReturnCanvas`: shared 16:9 renderer for the real projection and isolated
  rehearsal fixtures. Twitch/OBS keeps its existing `broadcast-v1` renderer,
  seven blocks, four layouts, themes and editor.

The implementation was compared against the approved Stitch HTML exports for
discussion (`6ad83dca2a344398bbf0c912c97c5250`,
`33493172cc044c5d9d4bc4f668ec49f5`), chat variants, public flow, continuity,
durable reveal, GM access, output separation and privacy boundaries.

## 1920×1080 captures

- `discussion-video-integrale-1920x1080.png`
- `discussion-chat-lateral-1920x1080.png`
- `avant-revelation-vote-1920x1080.png`
- `revelation-3-joueurs-1920x1080.png`
- `revelation-6-joueurs-1920x1080.png`
- `revelation-12-joueurs-1920x1080.png`
- `acces-gm-retour-studio-1920x1080.png`
- `repetition-avant-direct-1920x1080.png`

Production does not fabricate chat messages. When no authenticated chat source is
available, the lateral presentation shows the approved continuity state. Sample
messages exist only in the isolated rehearsal route.

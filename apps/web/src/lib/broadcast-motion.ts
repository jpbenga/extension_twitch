import type { PublicCue } from "./public-cues.js";
/** One interruptible moment, never a queue. Cancellation prevents obsolete callbacks after another projection. */
export function scheduleBroadcastMoment(
  cue: PublicCue,
  hold: number,
  exit: number,
  update: (cue: PublicCue | null) => void,
) {
  let active = true;
  update(cue);
  const leave = setTimeout(() => {
    if (active) update({ ...cue, stage: "exit" });
  }, hold);
  const finish = setTimeout(() => {
    if (active) update(null);
  }, hold + exit);
  return () => {
    active = false;
    clearTimeout(leave);
    clearTimeout(finish);
  };
}

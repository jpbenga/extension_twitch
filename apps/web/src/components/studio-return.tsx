"use client";

import { useSession } from "../lib/use-session";
import { StudioReturnCanvas } from "./studio-return-canvas";

export {
  StudioReturnCanvas,
  type StudioChatMessage,
} from "./studio-return-canvas";

export function StudioReturn({ id }: { id: string }) {
  const session = useSession(id, "studio");
  const view = session.view?.audience === "studio" ? session.view : null;
  return (
    <StudioReturnCanvas
      view={view}
      connection={session.connection}
      error={session.error}
    />
  );
}

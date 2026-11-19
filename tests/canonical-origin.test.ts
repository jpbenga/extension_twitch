import { describe, expect, it } from "vitest";
import { canonicalApplicationUrl } from "../apps/web/src/lib/canonical-origin";

describe("canonical application origin", () => {
  it("moves product workflows from localhost to the configured LAN origin", () => {
    expect(
      canonicalApplicationUrl(
        "http://192.168.0.46:3000",
        "http://localhost:3000/play/undercover?new=1",
      ),
    ).toBe("http://192.168.0.46:3000/play/undercover?new=1");
  });

  it("keeps the Twitch-compatible Studio local and leaves canonical pages alone", () => {
    expect(
      canonicalApplicationUrl(
        "http://192.168.0.46:3000",
        "http://localhost:3000/sessions/session-id/studio?chat=1",
      ),
    ).toBe("");
    expect(
      canonicalApplicationUrl(
        "http://192.168.0.46:3000",
        "http://192.168.0.46:3000/play/undercover",
      ),
    ).toBe("");
  });
});

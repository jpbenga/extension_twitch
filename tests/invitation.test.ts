import { describe, expect, it } from "vitest";
import { parseInvitationCode } from "../apps/web/src/lib/invitation.js";

describe("homepage and join share the existing invitation entry rules", () => {
  it("preserves case, underscores, hyphens and accepts a trimmed code or full LAN invitation", () => {
    const code = "Ab12_cD-3456";
    expect(parseInvitationCode(`  ${code}  `)).toBe(code);
    expect(parseInvitationCode(`http://192.168.0.46:3000/join/${code}`)).toBe(
      code,
    );
    expect(
      parseInvitationCode(
        `https://example.test/join/${code}?from=home#anything`,
      ),
    ).toBe(code);
  });
  it.each([
    "",
    "abc",
    "Ab12_cD-34567",
    "Ab12 cD-3456",
    "https://example.test/join/",
    "https://",
    "../Ab12_cD-3456",
    "<script>x</script>",
  ])("rejects malformed input without making an HTTP request: %s", (value) => {
    expect(parseInvitationCode(value)).toBeNull();
  });
});

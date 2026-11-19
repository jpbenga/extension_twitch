import { describe, expect, it } from "vitest";
import { studioReturnOrigin } from "../apps/web/src/lib/studio-return-url.js";

describe("studio return origin", () => {
  it("uses localhost for a LAN test opened from its canonical Wi-Fi origin", () => {
    expect(
      studioReturnOrigin(
        "http://192.168.0.46:3000",
        "http://192.168.0.46:3000",
      ),
    ).toBe("http://localhost:3000");
    expect(
      studioReturnOrigin("http://192.168.0.46:3000", "http://localhost:3000"),
    ).toBe("http://localhost:3000");
  });

  it("keeps hosted HTTPS and unrelated browser origins canonical", () => {
    expect(
      studioReturnOrigin(
        "https://studio.example.com",
        "https://studio.example.com",
      ),
    ).toBe("https://studio.example.com");
    expect(
      studioReturnOrigin(
        "http://192.168.0.46:3000",
        "http://192.168.0.99:3000",
      ),
    ).toBe("http://192.168.0.46:3000");
  });
});

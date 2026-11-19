import { describe, expect, it } from "vitest";
import {
  normalizeTwitchChannel,
  twitchChannelUrl,
  twitchChatEmbedUrl,
} from "@extension-twitch/contracts/twitch";

describe("Twitch live-test integration", () => {
  it("normalizes a channel name without accepting URLs or query injection", () => {
    expect(normalizeTwitchChannel(" @TwitchDev ")).toBe("twitchdev");
    expect(normalizeTwitchChannel("https://twitch.tv/twitchdev")).toBe("");
    expect(normalizeTwitchChannel("twitchdev?parent=evil.example")).toBe("");
  });

  it("builds the official chat embed with the current parent only", () => {
    expect(twitchChatEmbedUrl("TwitchDev", "localhost")).toBe(
      "https://www.twitch.tv/embed/twitchdev/chat?parent=localhost&darkpopout=true",
    );
    expect(twitchChatEmbedUrl("twitchdev", "studio.example.com")).toContain(
      "parent=studio.example.com",
    );
    expect(twitchChatEmbedUrl("twitchdev", "evil.example/path")).toBe("");
  });

  it("links only to a validated public channel", () => {
    expect(twitchChannelUrl("TwitchDev")).toBe(
      "https://www.twitch.tv/twitchdev",
    );
    expect(twitchChannelUrl("twitch.tv/twitchdev")).toBe("");
  });
});

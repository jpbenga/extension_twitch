/** Public Twitch identifiers and embed URLs. No OAuth or stream key belongs here. */
const twitchChannelPattern = /^[a-z0-9_]{1,25}$/;
const embedParentPattern = /^(?:localhost|[a-z0-9.-]+|\[[a-f0-9:]+\])$/i;

export function normalizeTwitchChannel(value: string) {
  const channel = value.trim().toLowerCase().replace(/^@/, "");
  return twitchChannelPattern.test(channel) ? channel : "";
}

export function twitchChatEmbedUrl(channelInput: string, parentInput: string) {
  const channel = normalizeTwitchChannel(channelInput);
  const parent = parentInput.trim().toLowerCase();
  if (!channel || !embedParentPattern.test(parent)) return "";
  const query = new URLSearchParams({ parent, darkpopout: "true" });
  return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${query}`;
}

export function twitchChannelUrl(channelInput: string) {
  const channel = normalizeTwitchChannel(channelInput);
  return channel ? `https://www.twitch.tv/${encodeURIComponent(channel)}` : "";
}

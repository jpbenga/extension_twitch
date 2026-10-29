export interface ExtensionConfiguration {
  broadcaster?: { version: string; content: string };
  onChanged(callback: () => void): void;
  set(segment: "broadcaster", version: string, content: string): void;
}
export interface ExtensionHelper {
  onAuthorized(
    callback: (auth: { channelId: string; clientId: string }) => void,
  ): void;
  configuration: ExtensionConfiguration;
}
export function helper(): ExtensionHelper | undefined {
  return (window as Window & { Twitch?: { ext?: ExtensionHelper } }).Twitch
    ?.ext;
}

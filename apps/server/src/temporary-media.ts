import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { SessionError } from "@extension-twitch/engine";
import {
  UNDERCOVER_IMAGE_MAX_BYTES,
  UNDERCOVER_IMAGE_MAX_DIMENSION,
  UNDERCOVER_MEDIA_TTL_MS,
} from "@extension-twitch/contracts/undercover-stream";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc(bytes: Buffer) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/** Only bounded, fully inflated, non-animated PNG. Never SVG/HTML or a remote URL. */
export function validateTemporaryPng(bytes: Buffer) {
  if (bytes.length > UNDERCOVER_IMAGE_MAX_BYTES)
    throw new SessionError("IMAGE_TOO_LARGE", 413);
  const invalid = () => {
    throw new SessionError("INVALID_IMAGE", 400);
  };
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(signature)) invalid();
  let offset = 8,
    width = 0,
    height = 0,
    channels = 0,
    ended = false;
  const compressed: Buffer[] = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) invalid();
    const length = bytes.readUInt32BE(offset),
      end = offset + 12 + length;
    if (end > bytes.length) invalid();
    const kind = bytes.toString("ascii", offset + 4, offset + 8),
      data = bytes.subarray(offset + 8, end - 4);
    if (
      crc(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4)
    )
      invalid();
    if (offset === 8 && kind !== "IHDR") invalid();
    if (kind === "IHDR") {
      if (width || length !== 13) invalid();
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (
        !width ||
        !height ||
        width > UNDERCOVER_IMAGE_MAX_DIMENSION ||
        height > UNDERCOVER_IMAGE_MAX_DIMENSION
      )
        throw new SessionError("IMAGE_TOO_LARGE", 413);
      if (
        data[8] !== 8 ||
        ![2, 6].includes(data[9]!) ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] !== 0
      )
        invalid();
      channels = data[9] === 6 ? 4 : 3;
    } else if (kind === "IDAT") compressed.push(data);
    else if (kind === "IEND") {
      if (length !== 0 || end !== bytes.length) invalid();
      ended = true;
    } else if (["acTL", "fcTL", "fdAT"].includes(kind) || /^[A-Z]/.test(kind))
      invalid();
    offset = end;
  }
  if (!ended || !compressed.length) invalid();
  const stride = width * channels + 1,
    expected = stride * height;
  try {
    const raw = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: expected,
    });
    if (raw.length !== expected) invalid();
    for (let row = 0; row < height; row++)
      if (raw[row * stride]! > 4) invalid();
  } catch {
    invalid();
  }
  return { width, height };
}
interface Entry {
  bytes: Buffer;
  expiresAt: number;
  digest: string;
  sessionId: string;
}
/** Process memory only: no disk/database writes and no media survives a restart. */
export class TemporaryMediaRelay {
  private entries = new Map<string, Entry>();
  private bytes = 0;
  private timer: ReturnType<typeof setInterval>;
  constructor(
    private readonly onExpire: (sessionId: string) => void = () => {},
    private readonly now: () => number = Date.now,
  ) {
    this.timer = setInterval(() => this.sweep(), 30_000);
    this.timer.unref();
  }
  put(sessionId: string, contentId: string, bytes: Buffer) {
    validateTemporaryPng(bytes);
    this.sweep();
    const key = `${sessionId}:${contentId}`,
      old = this.entries.get(key);
    const total = this.bytes - (old?.bytes.length ?? 0) + bytes.length;
    if (total > 64 * 1024 * 1024 || (!old && this.entries.size >= 128))
      throw new SessionError("MEDIA_UNAVAILABLE", 503);
    const entry = {
      sessionId,
      bytes: Buffer.from(bytes),
      expiresAt: this.now() + UNDERCOVER_MEDIA_TTL_MS,
      digest: createHash("sha256").update(bytes).digest("hex").slice(0, 12),
    };
    this.entries.set(key, entry);
    this.bytes = total;
    return entry;
  }
  get(sessionId: string, contentId: string) {
    const entry = this.entries.get(`${sessionId}:${contentId}`);
    return entry && entry.expiresAt > this.now() ? entry : undefined;
  }
  remove(sessionId: string, contentId: string) {
    const key = `${sessionId}:${contentId}`;
    const entry = this.entries.get(key);
    if (entry) {
      this.bytes -= entry.bytes.length;
      this.entries.delete(key);
    }
  }
  clearSession(id: string) {
    for (const [key, entry] of this.entries)
      if (entry.sessionId === id) {
        this.bytes -= entry.bytes.length;
        this.entries.delete(key);
      }
  }
  sweep() {
    const expired = new Set<string>();
    for (const [key, entry] of this.entries)
      if (entry.expiresAt <= this.now()) {
        this.bytes -= entry.bytes.length;
        this.entries.delete(key);
        expired.add(entry.sessionId);
      }
    for (const id of expired) this.onExpire(id);
  }
  close() {
    clearInterval(this.timer);
    this.entries.clear();
    this.bytes = 0;
  }
}

export const MAX_FILE_BYTES = 25_000_000;
export const MAX_PIXELS = 40_000_000;
export const MAX_DIMENSION = 12_000;
export const MIN_DIMENSION = 1;

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(bytes < 10_000 ? 1 : 0)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

export function validateDimension(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= MIN_DIMENSION && number <= MAX_DIMENSION ? number : null;
}

export function validateTargetKb(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 25_000 ? number : null;
}

export function targetBytes(kb: number): number {
  return Math.round(kb * 1_000);
}

export function isSafePixelCount(width: number, height: number): boolean {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 && width * height <= MAX_PIXELS;
}

export function extensionFor(type: OutputFormat): string {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[type];
}

export function outputName(original: string, type: OutputFormat): string {
  const stem = original.replace(/\.[^.]+$/, "") || "image";
  return `${stem}-맞춤.${extensionFor(type)}`;
}

export function fitDimensions(width: number, height: number, scale: number) {
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export type ImageHeader = { type: OutputFormat; width: number; height: number; animated: boolean };

/** Inspect encoded dimensions before the browser allocates a decoded bitmap. */
export function inspectImageHeader(buffer: ArrayBuffer): ImageHeader | null {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const text = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length >= 33 && bytes[0] === 137 && text(1, 7) === "PNG\r\n\x1a\n" && text(12, 4) === "IHDR" && view.getUint32(8) === 13) {
    let animated = false;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      if (offset + 12 + length > bytes.length) return null;
      if (text(offset + 4, 4) === "acTL") animated = true;
      if (text(offset + 4, 4) === "IEND") break;
      offset += 12 + length;
    }
    return { type: "image/png", width: view.getUint32(16), height: view.getUint32(20), animated };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    for (let offset = 2; offset + 3 < bytes.length;) {
      if (bytes[offset++] !== 0xff) return null;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 8) {
        return { type: "image/jpeg", height: view.getUint16(offset + 3), width: view.getUint16(offset + 5), animated: false };
      }
      offset += length;
    }
    return null;
  }
  if (bytes.length >= 20 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const type = text(offset, 4), length = view.getUint32(offset + 4, true), start = offset + 8;
      if (start + length > bytes.length) return null;
      if (type === "VP8X" && length >= 10) {
        const u24 = (index: number) => bytes[index] + (bytes[index + 1] << 8) + (bytes[index + 2] << 16);
        return { type: "image/webp", width: u24(start + 4) + 1, height: u24(start + 7) + 1, animated: !!(bytes[start] & 2) };
      }
      if (type === "VP8 " && length >= 10 && bytes[start + 3] === 0x9d && bytes[start + 4] === 0x01 && bytes[start + 5] === 0x2a) {
        return { type: "image/webp", width: view.getUint16(start + 6, true) & 0x3fff, height: view.getUint16(start + 8, true) & 0x3fff, animated: false };
      }
      if (type === "VP8L" && length >= 5 && bytes[start] === 0x2f) {
        const bits = view.getUint32(start + 1, true);
        return { type: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, animated: false };
      }
      offset = start + length + (length % 2);
    }
  }
  return null;
}

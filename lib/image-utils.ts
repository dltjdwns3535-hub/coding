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
  return Math.floor(kb * 1_000);
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

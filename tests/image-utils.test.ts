import test from "node:test";
import assert from "node:assert/strict";
import { extensionFor, fitDimensions, formatBytes, inspectImageHeader, isSafePixelCount, outputName, targetBytes, validateDimension, validateTargetKb } from "../lib/image-utils.ts";

function arrayBuffer(bytes: Buffer): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  // Header inspection does not decode pixels or validate CRCs.
  return Buffer.concat([length, Buffer.from(type), data, Buffer.alloc(4)]);
}

function pngHeader(width: number, height: number, animated = false) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const animation = Buffer.alloc(8); animation.writeUInt32BE(2);
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"), pngChunk("IHDR", header),
    ...(animated ? [pngChunk("acTL", animation)] : []), pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function jpegHeader(width: number, height: number, marker = 0xc0) {
  const frame = Buffer.alloc(19);
  frame[0] = 0xff; frame[1] = marker; frame.writeUInt16BE(17, 2);
  frame[4] = 8; frame.writeUInt16BE(height, 5); frame.writeUInt16BE(width, 7);
  frame[9] = 3; frame.set([1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0], 10);
  // Include APP1 metadata so inspection must skip a non-frame segment.
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0, 4, 0, 0]), frame, Buffer.from([0xff, 0xd9])]);
}

function webpHeader(type: "VP8 " | "VP8L" | "VP8X", width: number, height: number, animated = false) {
  const payload = Buffer.alloc(type === "VP8L" ? 5 : 10);
  if (type === "VP8X") {
    payload[0] = animated ? 2 : 0;
    payload.writeUIntLE(width - 1, 4, 3); payload.writeUIntLE(height - 1, 7, 3);
  } else if (type === "VP8L") {
    payload[0] = 0x2f;
    payload.writeUInt32LE(((height - 1) << 14) | (width - 1), 1);
  } else {
    payload.set([0x9d, 0x01, 0x2a], 3);
    payload.writeUInt16LE(width, 6); payload.writeUInt16LE(height, 8);
  }
  const chunk = Buffer.alloc(8); chunk.write(type); chunk.writeUInt32LE(payload.length, 4);
  const riff = Buffer.alloc(12); riff.write("RIFF"); riff.write("WEBP", 8);
  const bytes = Buffer.concat([riff, chunk, payload, ...(payload.length % 2 ? [Buffer.alloc(1)] : [])]);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  return bytes;
}

const inspect = (bytes: Buffer) => inspectImageHeader(arrayBuffer(bytes));

test("KB는 1,000바이트로 계산하며 소수 입력을 1바이트 작게 반올림하지 않는다", () => {
  assert.equal(targetBytes(100), 100_000);
  assert.equal(targetBytes(0.5), 500);
  for (const [kb, bytes] of [[2.01, 2010], [2.03, 2030], [4.02, 4020], [8.11, 8110], [25_000, 25_000_000]]) {
    assert.equal(targetBytes(kb), bytes, `${kb}KB`);
  }
  assert.equal(formatBytes(500_000), "500 KB");
});

test("픽셀 입력 범위와 정수 여부를 검증한다", () => {
  assert.equal(validateDimension("1"), 1);
  assert.equal(validateDimension("12000"), 12_000);
  assert.equal(validateDimension(" 320 "), 320);
  for (const invalid of ["", "0", "12001", "2.5", "abc", "-2", "1e3", "Infinity"]) assert.equal(validateDimension(invalid), null);
});

test("목표 용량 입력 범위를 검증한다", () => {
  assert.equal(validateTargetKb("100.25"), 100.25);
  assert.equal(validateTargetKb("2.01"), 2.01);
  assert.equal(validateTargetKb("25000"), 25_000);
  for (const invalid of ["", "0", "25001", "1.234", "1e2", "abc"]) assert.equal(validateTargetKb(invalid), null);
});

test("파일 형식과 확장자를 일치시킨다", () => {
  assert.equal(extensionFor("image/jpeg"), "jpg");
  assert.equal(extensionFor("image/png"), "png");
  assert.equal(extensionFor("image/webp"), "webp");
  assert.equal(outputName("vacation.photo.png", "image/jpeg"), "vacation.photo-맞춤.jpg");
});

test("비율을 유지해 픽셀을 축소한다", () => {
  assert.deepEqual(fitDimensions(1000, 500, 0.5), { width: 500, height: 250 });
  assert.deepEqual(fitDimensions(1, 1, 0.1), { width: 1, height: 1 });
});

test("총 픽셀 안전 상한을 검증한다", () => {
  assert.equal(isSafePixelCount(8_000, 5_000), true);
  assert.equal(isSafePixelCount(8_001, 5_000), false);
  for (const [width, height] of [[0, 100], [-1, 100], [1.5, 100], [Infinity, 100], [100, NaN]]) {
    assert.equal(isSafePixelCount(width, height), false);
  }
});

test("PNG 헤더에서 크기와 APNG 애니메이션 여부를 읽는다", () => {
  assert.deepEqual(inspect(pngHeader(320, 240)), { type: "image/png", width: 320, height: 240, animated: false });
  assert.deepEqual(inspect(pngHeader(320, 240, true)), { type: "image/png", width: 320, height: 240, animated: true });
  const huge = inspect(pngHeader(8_001, 5_000));
  assert.ok(huge);
  assert.equal(isSafePixelCount(huge.width, huge.height), false);
});

test("JPEG 메타데이터를 건너뛰고 기본·프로그레시브 프레임 크기를 읽는다", () => {
  for (const marker of [0xc0, 0xc1, 0xc2]) {
    assert.deepEqual(inspect(jpegHeader(640, 480, marker)), { type: "image/jpeg", width: 640, height: 480, animated: false });
  }
});

test("손실·무손실·확장 WebP 헤더와 애니메이션 플래그를 읽는다", () => {
  for (const type of ["VP8 ", "VP8L", "VP8X"] as const) {
    assert.deepEqual(inspect(webpHeader(type, 1024, 768)), { type: "image/webp", width: 1024, height: 768, animated: false });
  }
  assert.deepEqual(inspect(webpHeader("VP8X", 12, 8, true)), { type: "image/webp", width: 12, height: 8, animated: true });
});

test("알 수 없는 서명과 잘린 필수 헤더·청크를 예외 없이 거부한다", () => {
  const truncatedPng = pngHeader(320, 240).subarray(0, 24);
  const truncatedJpeg = jpegHeader(640, 480).subarray(0, 20);
  const truncatedWebp = webpHeader("VP8X", 320, 240).subarray(0, 27);
  const oversizedPngChunk = pngHeader(320, 240); oversizedPngChunk.writeUInt32BE(0xffffffff, 33);
  const invalidJpegLength = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0, 1]);
  for (const bytes of [Buffer.alloc(0), Buffer.from("not an image"), Buffer.from("<svg></svg>"), truncatedPng, truncatedJpeg, truncatedWebp, oversizedPngChunk, invalidJpegLength]) {
    assert.equal(inspect(bytes), null);
  }
});

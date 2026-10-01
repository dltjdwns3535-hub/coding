import test from "node:test";
import assert from "node:assert/strict";
import { extensionFor, fitDimensions, formatBytes, isSafePixelCount, outputName, targetBytes, validateDimension, validateTargetKb } from "../lib/image-utils.ts";

test("KB는 1,000바이트로 계산한다", () => {
  assert.equal(targetBytes(100), 100_000);
  assert.equal(targetBytes(0.5), 500);
  assert.equal(formatBytes(500_000), "500 KB");
});

test("픽셀 입력 범위와 정수 여부를 검증한다", () => {
  assert.equal(validateDimension("1"), 1);
  assert.equal(validateDimension("12000"), 12_000);
  for (const invalid of ["", "0", "12001", "2.5", "abc", "-2"]) assert.equal(validateDimension(invalid), null);
});

test("목표 용량 입력 범위를 검증한다", () => {
  assert.equal(validateTargetKb("100.25"), 100.25);
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
  assert.equal(isSafePixelCount(0, 100), false);
});

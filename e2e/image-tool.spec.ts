import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function png(width: number, height: number, pixel: (x: number, y: number) => [number, number, number, number]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4); row[0] = 0;
    for (let x = 0; x < width; x++) row.set(pixel(x, y), 1 + x * 4);
    rows.push(row);
  }
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

const transparentPng = () => png(8, 6, () => [0, 0, 0, 0]);
const noisyPng = (width = 256, height = 256) => png(width, height, (x, y) => {
  const n = (x * 73 + y * 151 + (x * y * 17)) & 255;
  return [n, (n * 47) & 255, (n * 89) & 255, 255];
});

function jpegDimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  let offset = 2;
  while (offset < bytes.length - 9) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    const marker = bytes[offset + 1];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error("JPEG 크기 정보를 찾지 못했습니다.");
}

async function upload(page: Page, name: string, buffer: Buffer) {
  await page.locator("input[type=file]").setInputFiles({ name, mimeType: "image/png", buffer });
}

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("목표 용량 성공 파일의 실제 바이트·형식·픽셀을 검증한다", async ({ page }) => {
  await upload(page, "noise.png", noisyPng());
  await page.getByLabel("가로 픽셀").fill("128");
  await page.getByText("목표 용량 이하로 줄이기").click();
  await page.getByLabel("목표 용량 KB").fill("10");
  await page.getByRole("button", { name: "사진 변환하기" }).click();
  await expect(page.getByText("변환 성공")).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "결과 파일 저장" }).click();
  const bytes = await readFile(await (await event).path() as string);
  expect(bytes.byteLength).toBeLessThanOrEqual(10_000);
  expect(jpegDimensions(bytes)).toEqual({ width: 128, height: 128 });
});

test("자동 축소하지 않은 PNG가 한도를 넘으면 목표 미달이다", async ({ page }) => {
  await upload(page, "noise.png", noisyPng(128, 128));
  await page.getByText("PNG", { exact: true }).click();
  await page.getByText("목표 용량 이하로 줄이기").click();
  await page.getByLabel("목표 용량 KB").fill("1");
  await page.getByRole("button", { name: "사진 변환하기" }).click();
  await expect(page.getByRole("status").getByText("목표 미달", { exact: true })).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "결과 파일 저장" }).click();
  const bytes = await readFile(await (await event).path() as string);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from("89504e470d0a1a0a", "hex"));
  expect(bytes.byteLength).toBeGreaterThan(1_000);
  expect(bytes.readUInt32BE(16)).toBe(128); expect(bytes.readUInt32BE(20)).toBe(128);
});

test("투명 PNG의 JPEG 픽셀에 지정 배경색을 적용한다", async ({ page }) => {
  await upload(page, "transparent.png", transparentPng());
  await page.getByLabel("JPEG 배경색").fill("#e02040");
  await page.getByRole("button", { name: "사진 변환하기" }).click();
  const pixel = await page.locator(".resultFigure img").evaluate(async (image: HTMLImageElement) => {
    await image.decode(); const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
    const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  });
  expect(pixel[0]).toBeGreaterThan(210); expect(pixel[1]).toBeLessThan(55); expect(pixel[2]).toBeLessThan(80); expect(pixel[3]).toBe(255);
});

test("직접 용량·프리셋·배경색·자동 축소 변경은 이전 결과를 무효화한다", async ({ page }) => {
  await upload(page, "first.png", transparentPng());
  const convert = async () => {
    await page.getByRole("button", { name: "사진 변환하기" }).click();
    await expect(page.getByRole("button", { name: "결과 파일 저장" })).toBeVisible();
  };
  const expectInvalidated = async () => {
    await expect(page.getByRole("button", { name: "결과 파일 저장" })).toHaveCount(0);
    await expect(page.getByText("변환 성공")).toHaveCount(0);
  };
  await convert(); await page.getByText("목표 용량 이하로 줄이기").click(); await expectInvalidated();
  await convert(); await page.getByRole("button", { name: "100KB" }).click(); await expectInvalidated();
  await convert(); await page.getByLabel("목표 용량 KB").fill("90"); await expectInvalidated();
  await convert(); await page.getByText("품질 조절로 부족하면 픽셀도 자동 축소").click(); await expectInvalidated();
  await convert(); await page.getByLabel("JPEG 배경색").fill("#000000"); await expectInvalidated();
});

test("빠른 파일 교체·초기화·잘못된 파일 입력을 안전하게 처리한다", async ({ page }) => {
  const input = page.locator("input[type=file]");
  await input.setInputFiles({ name: "first.png", mimeType: "image/png", buffer: noisyPng(512, 512) });
  await input.setInputFiles({ name: "latest.png", mimeType: "image/png", buffer: transparentPng() });
  await expect(page.getByText("latest.png")).toBeVisible();
  await page.getByRole("button", { name: "사진 변환하기" }).click();
  await page.getByRole("button", { name: "처음부터 다시" }).click();
  await expect(page.getByText("사진을 끌어다 놓으세요")).toBeVisible();
  await input.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not image") });
  await expect(page.getByText(/지원하지 않는 파일/)).toBeVisible();
  await expect(page.locator(".results")).toHaveCount(0);
});

test("변환 중 외부 요청이나 이미지 데이터 전송이 없다", async ({ page }) => {
  const requests: { url: string; body: string | null }[] = [];
  page.on("request", request => requests.push({ url: request.url(), body: request.postData() }));
  await upload(page, "private.png", noisyPng());
  requests.length = 0;
  await page.getByRole("button", { name: "사진 변환하기" }).dblclick();
  await expect(page.getByText("변환 성공")).toBeVisible();
  expect(requests.filter(item => new URL(item.url).origin !== new URL(page.url()).origin)).toEqual([]);
  expect(requests.filter(item => item.body?.includes("89504e47"))).toEqual([]);
  await expect(page.locator(".results")).toHaveCount(1);
});

for (const viewport of [{ name: "pc", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
  test(`${viewport.name} 화면에 가로 넘침이 없고 스크린샷을 생성한다`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: `screenshots/${viewport.name}.png`, fullPage: true });
  });
}

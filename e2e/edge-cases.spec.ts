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

function png(width = 12, height = 8, pixel: (x: number, y: number) => [number, number, number, number] = () => [40, 120, 200, 255]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    for (let x = 0; x < width; x++) row.set(pixel(x, y), 1 + x * 4);
    rows.push(row);
  }
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

function declaredPng(width: number, height: number) {
  // Deliberately change only declared dimensions, never allocating a huge bitmap.
  const bytes = png(); const header = Buffer.from(bytes.subarray(16, 29));
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  return Buffer.concat([bytes.subarray(0, 8), chunk("IHDR", header), bytes.subarray(33)]);
}

async function upload(page: Page, name = "sample.png", buffer = png(), mimeType = "image/png") {
  await page.getByLabel("사진 파일 선택").setInputFiles({ name, mimeType, buffer });
}

async function ready(page: Page, name = "sample.png") {
  await expect(page.locator(".fileInfo strong")).toHaveText(name);
  await expect(page.getByRole("button", { name: "사진 변환하기", exact: true })).toBeEnabled();
}

async function convert(page: Page) {
  await page.getByRole("button", { name: "사진 변환하기", exact: true }).click();
  await expect(page.getByRole("status").getByText("변환 성공", { exact: true })).toBeVisible();
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

type EncoderProbe = { calls: number; canvas: HTMLCanvasElement | null; release: () => Promise<void> };
type ProbeWindow = Window & { __encoderProbe: EncoderProbe };

async function delayFirstEncode(page: Page) {
  await page.evaluate(() => {
    const nativeToBlob = HTMLCanvasElement.prototype.toBlob;
    const probe: EncoderProbe = { calls: 0, canvas: null, release: async () => {} };
    (window as unknown as ProbeWindow).__encoderProbe = probe;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      probe.calls++;
      if (probe.calls !== 1) { nativeToBlob.call(this, callback, type, quality); return; }
      probe.canvas = this;
      probe.release = () => new Promise<void>(resolve => {
        nativeToBlob.call(this, blob => { callback(blob); resolve(); }, type, quality);
      });
    };
  });
}

test.beforeEach(async ({ page }) => { await page.goto("/"); });

for (const excessive of [
  { width: 12_001, height: 1, message: /이미지 한 변은 최대/ },
  { width: 8_001, height: 5_000, message: /총 픽셀 수는 최대/ },
]) {
  test(`${excessive.width}×${excessive.height} 선언 이미지를 디코딩 전에 거부한다`, async ({ page }) => {
    await page.evaluate(() => {
      const original = URL.createObjectURL;
      (window as unknown as Window & { __objectUrls: number }).__objectUrls = 0;
      URL.createObjectURL = function (object) {
        (window as unknown as Window & { __objectUrls: number }).__objectUrls++;
        return original.call(URL, object);
      };
    });
    await upload(page, "oversized.png", declaredPng(excessive.width, excessive.height));
    await expect(page.getByRole("status")).toContainText(excessive.message);
    expect(await page.evaluate(() => (window as unknown as Window & { __objectUrls: number }).__objectUrls)).toBe(0);
    await expect(page.locator(".sourceCard, .results")).toHaveCount(0);
  });
}

test("손상된 이미지·애니메이션 PNG를 거부하고 MIME 없는 정상 PNG는 연다", async ({ page }) => {
  await upload(page, "broken.png", png().subarray(0, 24));
  await expect(page.getByRole("status")).toContainText(/손상된 이미지/);
  const original = png(); const animation = Buffer.alloc(8); animation.writeUInt32BE(2);
  const animated = Buffer.concat([original.subarray(0, 33), chunk("acTL", animation), original.subarray(33)]);
  await upload(page, "animated.png", animated);
  await expect(page.getByRole("status")).toContainText(/움직이는 PNG·WebP는 지원하지 않습니다/);
  await upload(page, "without-mime.png", png(), "");
  await ready(page, "without-mime.png");
  await convert(page);
});

test("비율 잠금을 다시 켜면 현재 가로를 기준으로 원본 비율을 복원한다", async ({ page }) => {
  await upload(page, "wide.png", png(16, 8)); await ready(page, "wide.png");
  await page.getByLabel("원본 비율 유지", { exact: true }).uncheck();
  await page.getByLabel("가로 픽셀").fill("120");
  await page.getByLabel("세로 픽셀").fill("90");
  await page.getByLabel("원본 비율 유지", { exact: true }).check();
  await expect(page.getByLabel("세로 픽셀")).toHaveValue("60");
  await convert(page);
  const size = await page.locator(".resultFigure img").evaluate(async (image: HTMLImageElement) => {
    await image.decode(); return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(size).toEqual({ width: 120, height: 60 });
});

for (const action of ["replace", "cancel"] as const) {
  test(`지연된 인코딩 중 ${action === "replace" ? "파일 교체" : "취소"}하면 추가 인코딩과 오래된 결과가 없다`, async ({ page }) => {
    await upload(page); await ready(page);
    await page.getByLabel("목표 용량 이하로 줄이기", { exact: true }).check();
    await page.getByLabel("목표 용량 KB").fill("1");
    await delayFirstEncode(page);
    await page.getByRole("button", { name: "사진 변환하기", exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as ProbeWindow).__encoderProbe.calls)).toBe(1);
    if (action === "replace") {
      await upload(page, "replacement.png", png(6, 4)); await ready(page, "replacement.png");
    } else {
      await page.getByRole("button", { name: "작업 취소", exact: true }).click();
      await expect(page.getByText("사진을 끌어다 놓으세요", { exact: true })).toBeVisible();
    }
    await page.evaluate(async () => { await (window as unknown as ProbeWindow).__encoderProbe.release(); await Promise.resolve(); });
    await expect.poll(() => page.evaluate(() => {
      const probe = (window as unknown as ProbeWindow).__encoderProbe;
      return { calls: probe.calls, width: probe.canvas?.width, height: probe.canvas?.height };
    })).toEqual({ calls: 1, width: 0, height: 0 });
    await expect(page.locator(".results")).toHaveCount(0);
    if (action === "cancel") { await upload(page, "replacement.png", png(6, 4)); await ready(page, "replacement.png"); }
    else await page.getByLabel("목표 용량 이하로 줄이기", { exact: true }).uncheck();
    await convert(page);
    expect(await page.evaluate(() => (window as unknown as ProbeWindow).__encoderProbe.calls)).toBe(2);
    await expect(page.locator(".resultFigure")).toContainText("6 × 4px");
  });
}

for (const failure of ["fallback", "null"] as const) {
  test(`인코더 ${failure === "fallback" ? "형식 대체" : "null 결과"}를 실패로 표시하고 저장하지 않는다`, async ({ page }) => {
    await upload(page); await ready(page);
    await page.locator(".formatGroup").getByText("WebP", { exact: true }).click();
    await page.evaluate(mode => {
      const original = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        if (mode === "null") { queueMicrotask(() => callback(null)); return; }
        original.call(this, callback, "image/png");
      };
    }, failure);
    await page.getByRole("button", { name: "사진 변환하기", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("확인 필요");
    await expect(page.getByRole("status")).toContainText(failure === "null" ? "이미지 파일을 만들지 못했습니다" : "WebP 형식으로 생성되지 않아");
    await expect(page.getByRole("button", { name: "결과 파일 저장", exact: true })).toHaveCount(0);
  });
}

test("실제 WebP 다운로드의 서명·크기·투명도와 소수 KB 한도를 검증한다", async ({ page }) => {
  const transparent = png(12, 8, () => [0, 0, 0, 0]);
  await upload(page, "transparent.png", transparent); await ready(page, "transparent.png");
  await page.locator(".formatGroup").getByText("WebP", { exact: true }).click();
  await page.getByLabel("목표 용량 이하로 줄이기", { exact: true }).check();
  await page.getByLabel("목표 용량 KB").fill("2.01");
  await convert(page);
  await expect(page.getByLabel("결과 조건 확인")).toContainText("2,010바이트");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "결과 파일 저장", exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("transparent-맞춤.webp");
  const file = await download.path(); expect(file).not.toBeNull();
  const bytes = await readFile(file!);
  expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  expect(bytes.length).toBeLessThanOrEqual(2_010);
  // Decode the downloaded bytes, rather than relying only on the preview.
  const decoded = await page.evaluate(async encoded => {
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/webp" }));
    const image = new Image(); image.src = url;
    try {
      await image.decode(); const canvas = document.createElement("canvas"); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
      const alpha = [...context.getImageData(0, 0, canvas.width, canvas.height).data].filter((_, index) => index % 4 === 3);
      return { width: image.naturalWidth, height: image.naturalHeight, alpha };
    } finally { URL.revokeObjectURL(url); }
  }, bytes.toString("base64"));
  expect(decoded.width).toBe(12); expect(decoded.height).toBe(8);
  expect(decoded.alpha).toHaveLength(96); expect(decoded.alpha.every(alpha => alpha === 0)).toBe(true);
});

test("320px 화면에서 파일·목표 설정·결과가 가로로 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await upload(page, "a-very-long-photo-filename-that-must-not-widen-the-mobile-layout.png");
  await ready(page, "a-very-long-photo-filename-that-must-not-widen-the-mobile-layout.png");
  await expectNoOverflow(page);
  await page.getByLabel("목표 용량 이하로 줄이기", { exact: true }).check();
  await page.getByLabel("목표 용량 KB").fill("2.01");
  await page.getByLabel("품질 조절로 부족하면 픽셀도 자동 축소", { exact: true }).check();
  await expectNoOverflow(page);
  await convert(page); await expectNoOverflow(page);
  await expect(page.getByRole("button", { name: "결과 파일 저장", exact: true })).toBeVisible();
});

test("미리보기 위에 새 파일을 드롭하면 이동 없이 원본이 교체된다", async ({ page }) => {
  await upload(page); await ready(page); await convert(page);
  const url = page.url();
  const transfer = await page.evaluateHandle(encoded => {
    const data = new DataTransfer();
    data.items.add(new File([Uint8Array.from(atob(encoded), c => c.charCodeAt(0))], "dropped.png", { type: "image/png" }));
    return data;
  }, png(6, 4).toString("base64"));
  await page.locator(".sourceCard .imageFrame").dispatchEvent("dragover", { dataTransfer: transfer });
  await page.locator(".sourceCard .imageFrame").dispatchEvent("drop", { dataTransfer: transfer });
  await transfer.dispose();
  await ready(page, "dropped.png");
  expect(page.url()).toBe(url);
  await expect(page.getByLabel("가로 픽셀")).toHaveValue("6");
  await expect(page.getByLabel("세로 픽셀")).toHaveValue("4");
  await expect(page.locator(".results")).toHaveCount(0);
});

test("파일 로드부터 변환·저장까지 이미지 데이터를 네트워크로 전송하지 않는다", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on("request", request => {
    if (/^https?:/.test(request.url())) requests.push({ url: request.url(), method: request.method(), body: request.postData() });
  });
  await upload(page, "private-image.png"); await ready(page, "private-image.png");
  await convert(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "결과 파일 저장", exact: true }).click(); await event;
  // Same-origin page/static GET prefetches are harmless; uploads and external
  // requests are not. Start recording before the file is selected.
  for (const request of requests) {
    expect(new URL(request.url).origin).toBe(new URL(page.url()).origin);
    expect(request.method).toBe("GET");
    expect(request.body).toBeNull();
    expect(decodeURIComponent(request.url)).not.toContain("private-image.png");
    expect(request.url).not.toContain(png().toString("base64"));
    expect(request.url).not.toContain(png().toString("hex"));
  }
});

test("키보드 형식 선택의 초점이 보이고 파일 입력은 중복 탭 정류장이 아니다", async ({ page }) => {
  await upload(page); await ready(page);
  await expect(page.getByLabel("사진 파일 선택")).toHaveAttribute("tabindex", "-1");
  await page.getByLabel("원본 비율 유지", { exact: true }).focus();
  await page.keyboard.press("Tab");
  const jpeg = page.getByRole("radio", { name: "JPEG", exact: true });
  await expect(jpeg).toBeFocused();
  const focusStyle = await jpeg.evaluate(input => {
    const style = getComputedStyle(input.closest("label")!);
    return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
  });
  expect(focusStyle.outlineStyle).not.toBe("none");
  expect(focusStyle.outlineWidth).toBeGreaterThan(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "PNG", exact: true })).toBeChecked();
});

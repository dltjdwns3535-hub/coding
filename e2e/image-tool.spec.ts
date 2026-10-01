import { expect, test } from "@playwright/test";

function pngFixture() {
  return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHgQCAaW7Y8sAAAAASUVORK5CYII=", "base64");
}

test("투명 PNG를 JPEG로 변환하고 다운로드한다", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") requests.push(request.url()); });
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({ name: "transparent.png", mimeType: "image/png", buffer: pngFixture() });
  await expect(page.getByText("2 × 2px")).toBeVisible();
  await page.getByLabel("가로 픽셀").fill("1");
  await page.getByRole("button", { name: "사진 변환하기" }).click();
  await expect(page.getByText("변환 성공")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "결과 파일 저장" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("transparent-맞춤.jpg");
  expect(requests).toEqual([]);
});

test("PNG 목표 미달을 성공으로 표시하지 않고 반복 클릭을 막는다", async ({ page }) => {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({ name: "tiny.png", mimeType: "image/png", buffer: pngFixture() });
  await page.getByText("PNG", { exact: true }).click();
  await page.getByText("목표 용량 이하로 줄이기").click();
  await page.getByLabel("목표 용량 KB").fill("1");
  const button = page.getByRole("button", { name: "사진 변환하기" });
  await button.dblclick();
  await expect(page.locator(".status")).toContainText(/변환 성공|목표 미달/);
  await expect(page.locator(".results")).toHaveCount(1);
});

test("잘못된 파일을 한국어로 안내하고 모바일에서 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not image") });
  await expect(page.getByText(/지원하지 않는 파일/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

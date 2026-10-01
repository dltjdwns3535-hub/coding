import { expect, test } from "@playwright/test";

const paths = ["/", "/guides/target-kb-pixels/", "/guides/image-formats/", "/privacy/"];

test("자바스크립트 없이 한국어 제목·본문·내부 링크를 읽을 수 있다", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set<string>();
  for (const path of paths) {
    const response = await page.goto(`http://127.0.0.1:4173${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toContainText("사진");
    expect((await page.locator('meta[name="description"]').getAttribute("content"))?.length).toBeGreaterThan(35);
    titles.add(await page.title());
    for (const href of await page.locator('a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute("href")!))) {
      expect((await page.request.get(href.split("#")[0] || "/")).status()).toBe(200);
    }
  }
  expect(titles.size).toBe(paths.length);
  await context.close();
});

test("SEO 설정에 따라 색인 정책과 사이트맵 주소가 일치한다", async ({ page }) => {
  for (const path of paths) {
    await page.goto(path);
    if (process.env.SITE_URL) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(path, process.env.SITE_URL).href);
    } else {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
  }
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  if (process.env.SITE_URL) {
    for (const path of paths) expect(await sitemap.text()).toContain(`<loc>${new URL(path, process.env.SITE_URL).href}</loc>`);
  } else expect(await sitemap.text()).not.toContain("<loc>");
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Allow: /");
  if (process.env.SITE_URL) expect(await robots.text()).toContain(`Sitemap: ${new URL("/sitemap.xml", process.env.SITE_URL).href}`);
  else expect(await robots.text()).not.toContain("Sitemap:");
});

test("320px 안내 페이지와 공통 메뉴가 화면을 넘지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  for (const path of paths) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: "screenshots/mobile-privacy.png", fullPage: true });
});

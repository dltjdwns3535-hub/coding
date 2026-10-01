import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const script = `import { siteUrl, pageMetadata } from './lib/site.ts'; console.log(JSON.stringify({origin:siteUrl?.origin, metadata:pageMetadata('제목','설명','/privacy/')}));`;
const run = (url = "") => JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { env: { ...process.env, SITE_URL: url }, encoding: "utf8" }));

test("미리보기에는 가짜 canonical·OG 주소를 만들지 않는다", () => {
  const result = run();
  assert.equal(result.origin, undefined);
  assert.equal(result.metadata.alternates, undefined);
  assert.equal(result.metadata.openGraph.url, undefined);
});

test("정상 HTTPS origin으로만 페이지별 canonical을 만든다", () => {
  // A known public origin is used solely as a unit-test fixture, never as build configuration.
  const result = run("https://github.com");
  assert.equal(result.metadata.alternates.canonical, "https://github.com/privacy/");
  assert.equal(result.metadata.openGraph.url, result.metadata.alternates.canonical);
});

test("잘못된 주소·예시 도메인·인증 정보가 있는 SEO 설정은 거부한다", () => {
  for (const SITE_URL of ["not-a-url", "http://github.com", "https://localhost", "https://example.com", "https://github.com/path", "https://github.com:1234", "https://user:secret@github.com", "https://github.com?x=1"]) {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { env: { ...process.env, SITE_URL }, encoding: "utf8" });
    assert.notEqual(result.status, 0, SITE_URL);
    assert.match(result.stderr, /SITE_URL/);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { siteVerificationFor, verifiedProductionOrigin } from "../lib/site-verification.ts";

test("확인된 Google 소유 확인값은 해당 프로덕션 origin에만 적용한다", () => {
  assert.equal(siteVerificationFor(verifiedProductionOrigin, {}).google, "OHdM0gNiN40AS5fbbgnB8ypUor7BGI4CPb3H2Djh1ws");
  assert.equal(siteVerificationFor(undefined, {}).google, undefined);
  assert.equal(siteVerificationFor("https://github.com", {}).google, undefined);
});

test("명시적 소유 확인 환경 변수는 저장된 공개 기본값보다 우선한다", () => {
  assert.deepEqual(siteVerificationFor(verifiedProductionOrigin, { GOOGLE_SITE_VERIFICATION: " google-override ", NAVER_SITE_VERIFICATION: " naver-override " }), { google: "google-override", naver: "naver-override" });
});

test("확인된 네이버 소유 확인값은 해당 프로덕션 origin에만 적용한다", () => {
  assert.equal(siteVerificationFor(verifiedProductionOrigin, {}).naver, "f199c49445d16e90de0a50e30fba2839f9e3e0d2");
  assert.equal(siteVerificationFor(undefined, {}).naver, undefined);
  assert.equal(siteVerificationFor("https://github.com", {}).naver, undefined);
});

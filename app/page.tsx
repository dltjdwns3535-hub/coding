import Link from "next/link";
import ImageTool from "./image-tool";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { absoluteUrl, pageMetadata } from "../lib/site";

export const metadata = pageMetadata(
  "사진 용량 줄이기·픽셀 크기 조절",
  "JPEG·PNG·WebP 사진의 크기와 목표 KB를 설정하고 실제 결과를 비교하세요. 이미지 데이터를 서버로 전송하지 않는 무료 사진 변환 도구입니다.",
  "/",
);

export default function Home() {
  const url = absoluteUrl("/");
  return (
    <>
      {url && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "사진맞춤", url, inLanguage: "ko-KR" }).replace(/</g, "\\u003c") }} />}
      <a className="skipLink" href="#main-content">본문으로 건너뛰기</a>
      <SiteHeader />
      <main id="main-content">
        <section className="intro" aria-labelledby="title">
          <p className="eyebrow">무료 · 회원가입 없이 · 브라우저에서 처리</p>
          <h1 id="title">사진 용량 줄이기와 픽셀 크기 조절</h1>
          <p>JPEG·PNG·WebP 사진을 원하는 크기와 목표 KB로 변환하세요.</p>
          <p className="introNote">선택한 사진은 서버로 전송하지 않습니다. 변환 후 실제 용량·픽셀·화질을 확인하고 저장하세요.</p>
        </section>
        <div id="converter"><ImageTool /></div>
        <noscript><p className="contentNotice">사진 변환에는 JavaScript가 필요합니다. 아래 사용법과 가이드는 JavaScript 없이도 읽을 수 있습니다.</p></noscript>
        <section className="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">사진맞춤 사용법</h2>
          <ol className="steps">
            <li><strong>1. 사진 선택</strong><span>JPEG, PNG, WebP 사진 한 장을 선택하거나 끌어다 놓으세요. 최대 25MB·40MP까지 처리합니다.</span></li>
            <li><strong>2. 조건 설정</strong><span>가로·세로 픽셀과 파일 형식을 정하세요. 용량 제한이 있으면 목표 KB를 입력하세요.</span></li>
            <li><strong>3. 결과 확인·저장</strong><span>실제 용량과 픽셀, 미리보기를 확인하세요. 목표 미달 안내가 나오면 조건을 조정해 다시 변환하세요.</span></li>
          </ol>
          <div className="contentNotice"><strong>제출 규격이 있다면 먼저 확인하세요</strong><p>100KB·200KB·500KB는 용량 조건의 예시입니다. 제출처가 요구하는 파일 형식과 가로·세로 픽셀도 함께 확인하세요. 이 도구는 얼굴 크기, 배경, 촬영 시점 등 증명·여권사진의 적합성을 판정하지 않습니다.</p></div>
          <div className="guideLinks" aria-label="자세한 사용 가이드">
            <Link href="/guides/target-kb-pixels/"><strong>목표 KB와 픽셀, 둘 다 맞추려면</strong><span>용량 차이, 비율 유지, 목표 미달 해결 순서 →</span></Link>
            <Link href="/guides/image-formats/"><strong>JPG·PNG·WebP 중 무엇을 고를까요?</strong><span>투명 배경과 화질, 형식별 주의점 →</span></Link>
          </div>
          <div className="faq">
            <h2>자주 묻는 질문</h2>
            <details><summary>사진 크기와 파일 용량은 어떻게 다른가요?</summary><p>300×400px는 이미지의 가로·세로 픽셀 수이고, 100KB는 파일의 저장 용량입니다. 같은 픽셀 크기여도 사진 내용, 형식과 압축 품질에 따라 용량이 달라집니다.</p></details>
            <details><summary>100KB나 200KB로 정확히 맞출 수 있나요?</summary><p>목표값은 정확히 같은 크기를 만드는 값이 아니라 넘지 않도록 시도하는 상한입니다. JPEG·WebP는 품질을 조절하며, 결과는 목표보다 작을 수 있습니다. 모든 이미지에서 목표 달성을 보장하지는 않습니다. 1KB는 1,000바이트로 계산합니다.</p></details>
            <details><summary>목표 용량을 만족하지 못하면 어떻게 하나요?</summary><p>제출처가 허용한다면 픽셀을 더 작게 하거나 다른 파일 형식을 선택하세요. 자동 축소를 켜면 입력한 픽셀보다 작은 결과가 나올 수 있으므로 최소 해상도 조건을 다시 확인하세요. PNG에는 JPEG와 같은 품질 조절이 적용되지 않습니다.</p></details>
            <details><summary>가로·세로를 입력하면 사진이 잘리나요?</summary><p>이 도구는 사진을 자동으로 자르지 않습니다. 원본 비율 유지를 켜면 한쪽 값에 맞춰 다른 쪽 값이 계산됩니다. 끄고 원본과 다른 비율을 입력하면 사진이 늘어나거나 납작해질 수 있습니다.</p></details>
            <details><summary>투명 배경을 JPG로 바꾸면 어떻게 되나요?</summary><p>JPG와 JPEG는 같은 이미지 형식이며 투명도를 지원하지 않습니다. JPEG 출력에서는 선택한 배경색으로 투명 영역을 채웁니다. 기본값은 흰색입니다. 투명도를 유지하려면 PNG 또는 WebP를 선택하세요.</p></details>
            <details><summary>사진이 외부로 전송되거나 저장되나요?</summary><p>현재 도구는 이미지 파일과 파일명을 서버에 보내지 않고 브라우저의 Canvas·Blob 기능으로 처리합니다. 사이트를 열기 위한 페이지 요청은 발생하며, 내려받은 파일은 기기에 남습니다. <Link href="/privacy/">개인정보와 처리 방식 안내</Link>에서 범위를 확인하세요.</p></details>
            <details><summary>HEIC나 움직이는 이미지도 사용할 수 있나요?</summary><p>입력 형식은 JPEG·PNG·WebP입니다. HEIC, GIF, SVG는 지원하지 않습니다. 정지 이미지 변환용입니다. 애니메이션 PNG·WebP도 지원하지 않으며, 감지되면 처리를 중단합니다.</p></details>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

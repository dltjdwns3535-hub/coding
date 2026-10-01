import { GuideLayout } from "../../site-chrome";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata(
  "JPG·PNG·WebP 차이와 투명 배경 변환",
  "사진 제출용 JPEG, 투명 배경 PNG·WebP의 차이를 확인하세요. JPG 변환 시 배경색, PNG 용량 조절과 화질 한계를 설명합니다.",
  "/guides/image-formats/",
);

export default function FormatGuide() {
  return <GuideLayout title="JPG·PNG·WebP, 어떤 형식을 고를까요?" description="가장 작은 형식은 이미지마다 다릅니다. 제출처의 지원 형식과 투명 배경 필요 여부부터 확인하세요.">
    <section><h2>JPEG: 일반 사진과 JPG 제출 조건</h2>
      <p>JPG와 JPEG는 같은 이미지 형식입니다. 사진맞춤에서는 JPEG로 표시하며 .jpg 파일로 저장합니다. 손실 압축을 사용하므로 용량을 낮추는 과정에서 얼굴, 작은 글자와 선의 세부 표현이 줄어들 수 있습니다.</p>
      <p>JPEG는 투명도를 저장하지 못합니다. 투명 PNG·WebP를 JPEG로 바꿀 때 사진맞춤은 선택한 배경색 위에 이미지를 합성합니다. 기본 배경색은 흰색입니다. JPEG를 다시 PNG로 바꾸더라도 없어진 투명도나 세부 정보가 자동 복원되지는 않습니다.</p>
    </section>
    <section><h2>PNG: 투명 배경과 또렷한 그래픽</h2>
      <p>PNG는 투명도를 지원하는 무손실 형식입니다. 다만 ‘무손실 형식’이라는 말이 크기 조절 전 원본 파일과 같다는 뜻은 아닙니다. 픽셀을 줄이는 리사이즈는 이미지 정보를 바꿉니다.</p>
      <p>브라우저 Canvas의 PNG 저장에는 JPEG와 같은 손실 품질 조절이 적용되지 않습니다. PNG 상태로 목표 KB를 줄이려면 픽셀 크기를 낮춰야 할 수 있습니다. 사진맞춤은 자동 축소를 켠 경우에만 용량을 맞추기 위해 픽셀을 추가로 줄입니다.</p>
      <p>이미 최적화된 PNG를 다시 저장하면 더 커질 수 있습니다. 원본을 그대로 제출할 수 있다면 변환 결과와 비교해 필요에 맞는 파일을 선택하세요.</p>
    </section>
    <section><h2>WebP: 투명도를 지원하는 또 하나의 선택</h2>
      <p>WebP 형식은 손실·무손실 압축과 투명도를 지원합니다. 하지만 사진맞춤은 브라우저가 제공하는 Canvas 인코더를 사용하므로 WebP 형식 자체의 모든 기능이나 무손실 출력을 제공하는 것은 아닙니다.</p>
      <p>사진맞춤에서는 JPEG처럼 품질을 탐색해 목표 용량 이하로 만들기를 시도합니다. 투명도를 유지하면서 용량을 줄이고 싶을 때 비교해 볼 수 있습니다. 모든 사진에서 PNG·JPEG보다 작아지는 것은 아니며 제출처가 WebP 파일을 받는지도 확인해야 합니다.</p>
    </section>
    <section><h2>변환 전에 알아둘 제한</h2>
      <ul>
        <li>지원 입력은 JPEG·PNG·WebP 한 장입니다. HEIC, GIF, SVG는 지원하지 않습니다.</li>
        <li>정지 이미지용 도구입니다. 애니메이션 PNG·WebP는 지원하지 않으며, 감지되면 처리를 중단합니다.</li>
        <li>확장자만 .jpg로 바꾸는 것은 변환이 아닙니다. 파일 내용을 실제 형식으로 다시 저장해야 합니다.</li>
        <li>Canvas로 다시 그려 저장하므로 원본 메타데이터, 색상 프로필, 인쇄용 DPI의 보존을 보장하지 않습니다. 인쇄 제출에는 별도 확인이 필요합니다.</li>
        <li>브라우저가 선택한 출력 형식을 지원하지 않으면 변환이 중단될 수 있습니다. 최신 브라우저에서 지원 형식을 확인하세요.</li>
      </ul>
    </section>
    <section className="articleSources"><h2>기술 근거</h2>
      <ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob">MDN: Canvas toBlob의 출력 형식, 품질과 해상도 메타데이터</a></li><li><a href="https://www.w3.org/TR/png/">W3C: PNG 형식 명세</a></li><li><a href="https://developers.google.com/speed/webp/docs/riff_container">Google: WebP 형식과 투명도 명세</a></li><li><a href="https://developers.google.com/speed/webp/faq">Google: WebP 변환 후 용량이 커질 수 있는 경우</a></li></ul>
    </section>
  </GuideLayout>;
}

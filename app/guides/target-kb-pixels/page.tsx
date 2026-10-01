import Link from "next/link";
import { GuideLayout } from "../../site-chrome";
import { pageMetadata } from "../../../lib/site";

export const metadata = pageMetadata(
  "사진 목표 KB와 픽셀 맞추는 방법",
  "사진 100KB·200KB·500KB 용량 제한과 픽셀 크기는 다른 조건입니다. 비율 유지, 자동 축소와 목표 미달 해결 순서를 확인하세요.",
  "/guides/target-kb-pixels/",
);

export default function TargetGuide() {
  return <GuideLayout title="사진 목표 KB와 픽셀 맞추는 방법" description="용량은 줄었는데 업로드가 안 되나요? 파일 형식, 픽셀 크기, 용량 제한을 각각 확인해 보세요.">
    <section><h2>1. px와 KB는 서로 다른 조건입니다</h2>
      <p>px는 이미지의 가로·세로를 이루는 픽셀 수입니다. KB는 저장된 파일의 바이트 크기입니다. 가로 300px·세로 400px인 사진이라도 내용과 저장 형식, 압축 품질에 따라 파일 용량은 달라집니다.</p>
      <p>예를 들어 제출 조건이 ‘300×400px, JPEG, 100KB 이하’라면 세 가지를 모두 맞춰야 합니다. 이 숫자는 설명을 위한 예시이며 특정 기관의 제출 규격이 아닙니다.</p>
      <div className="contentNotice"><strong>용량 단위 기준</strong><p>사진맞춤은 1KB = 1,000바이트, 1MB = 1,000,000바이트로 계산합니다. 따라서 100KB는 100,000바이트 이하입니다. 1KiB = 1,024바이트와는 다르므로 다른 앱의 표시 숫자와 차이가 날 수 있습니다.</p></div>
    </section>
    <section><h2>2. 제출 조건부터 설정하세요</h2>
      <ol>
        <li><strong>원본 보관:</strong> 줄인 파일을 계속 다시 압축하기보다 원본에서 시작하세요.</li>
        <li><strong>형식 확인:</strong> 제출처가 JPG만 받는다면 JPEG를 선택하세요. 투명 배경을 유지해야 한다면 PNG·WebP 허용 여부를 먼저 확인하세요.</li>
        <li><strong>픽셀 입력:</strong> 원본 비율 유지를 켜고 필요한 가로나 세로를 입력하세요. 반대쪽 값은 원본 비율로 계산되므로 두 치수가 제출 조건과 맞는지 확인하세요.</li>
        <li><strong>용량 입력:</strong> 목표 용량을 켜고 100·200·500KB 등 실제 안내받은 상한을 입력하세요.</li>
        <li><strong>결과 검수:</strong> 실제 파일 용량, 가로·세로 픽셀과 얼굴·글자의 선명함을 확인하고 저장하세요.</li>
      </ol>
      <p>원본과 목표의 가로세로 비율이 다른 경우 이 도구는 자동으로 자르거나 여백을 만들지 않습니다. 비율 유지를 끄면 사진이 늘어나거나 납작해질 수 있습니다. 비율 변경을 위해 자르기가 필요하면 먼저 별도 편집기에서 처리하세요.</p>
    </section>
    <section><h2>3. 목표보다 작아도 정상입니다</h2>
      <p>‘200KB 이하’는 상한을 뜻합니다. 결과가 187KB라면 그 용량 조건은 충족한 것입니다. 인코딩 결과가 모든 바이트 크기로 만들어지는 것은 아니므로 목표와 정확히 같은 크기로 맞추지는 않습니다.</p>
      <p>JPEG·WebP는 압축 품질을 탐색합니다. PNG는 이 방식의 품질 조절을 지원하지 않아 실제로 생성한 파일의 용량으로 판정합니다. 브라우저와 이미지 내용에 따라 결과가 달라지고, 다시 저장한 파일이 원본보다 커질 수도 있습니다.</p>
    </section>
    <section><h2>4. 목표 미달이면 이 순서로 확인하세요</h2>
      <ul>
        <li><strong>픽셀을 줄여도 되나요?</strong> 허용된다면 더 작은 크기로 변환하거나 픽셀 자동 축소를 켜세요.</li>
        <li><strong>정확한 픽셀 또는 최소 해상도가 필요한가요?</strong> 자동 축소를 끄세요. 용량을 맞추려다 픽셀 조건을 놓칠 수 있습니다.</li>
        <li><strong>PNG만 사용해야 하나요?</strong> 형식 변경이 허용될 때만 JPEG·WebP를 비교하세요. 투명 배경의 처리도 달라집니다.</li>
        <li><strong>여전히 너무 큰가요?</strong> 필요한 픽셀과 형식을 유지한 채 매우 작은 용량에 맞추는 데에는 한계가 있습니다. 미달 안내를 성공으로 보지 말고 제출 조건을 다시 확인하세요.</li>
      </ul>
      <p>작은 사진을 크게 늘려도 원본에 없던 세부 정보가 복원되지는 않습니다. 여권·증명사진은 픽셀과 용량 외에도 얼굴 크기, 배경, 촬영 시점 등 별도 조건이 있으므로 제출처의 최신 공식 안내를 확인하세요.</p>
    </section>
    <section className="articleSources"><h2>기술 근거와 함께 볼 내용</h2>
      <ul><li><a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob">MDN: 브라우저 이미지 저장 형식과 품질 매개변수</a></li><li><Link href="/guides/image-formats/">JPG·PNG·WebP 형식과 투명 배경 안내</Link></li></ul>
    </section>
  </GuideLayout>;
}

import ImageTool from "./image-tool";

export default function Home() {
  return (
    <>
      <header className="siteHeader"><div className="bar"><a className="brand" href="#top">사진맞춤</a><span>무료 이미지 변환 도구</span></div></header>
      <main id="top">
        <section className="intro" aria-labelledby="title">
          <p className="eyebrow">브라우저 이미지 도구</p>
          <h1 id="title">사진 용량과 크기, 한 번에 맞추세요</h1>
          <p>원하는 용량·픽셀·파일 형식으로 변환하고 저장하세요</p>
        </section>
        <ImageTool />
        <section className="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">사진맞춤 사용법</h2>
          <ol className="steps">
            <li><strong>사진 선택</strong><span>JPEG, PNG, WebP 사진 한 장을 선택하거나 끌어다 놓으세요.</span></li>
            <li><strong>조건 설정</strong><span>픽셀, 출력 형식과 필요하면 목표 용량을 정하세요.</span></li>
            <li><strong>변환 및 확인</strong><span>변환 후 원본과 결과를 비교하고 실제 파일을 저장하세요.</span></li>
          </ol>
          <div className="faq">
            <h2>자주 묻는 질문</h2>
            <details><summary>픽셀 크기와 파일 용량은 어떻게 다른가요?</summary><p>픽셀은 사진의 가로·세로 해상도이고, 파일 용량은 저장 공간의 크기입니다. 같은 픽셀이라도 형식, 품질, 사진 내용에 따라 용량은 달라집니다.</p></details>
            <details><summary>투명 배경을 JPEG로 바꾸면 어떻게 되나요?</summary><p>JPEG는 투명을 지원하지 않습니다. JPEG를 선택하면 지정한 배경색 위에 사진을 합성합니다. 기본 배경은 흰색입니다.</p></details>
            <details><summary>목표 용량을 만족하지 못할 수도 있나요?</summary><p>네. JPEG·WebP 품질을 낮춰도 목표보다 클 수 있습니다. 이때 픽셀 자동 축소를 허용하면 크기도 단계적으로 줄입니다. PNG는 품질 조절을 지원하지 않아 목표 달성을 보장하지 않습니다.</p></details>
            <details><summary>사진이 외부로 전송되나요?</summary><p>아니요. 현재 버전의 선택, 변환, 다운로드는 브라우저의 Canvas와 Blob 기능만 사용하며 이미지 데이터를 서버로 전송하는 코드가 없습니다. 페이지를 닫으면 작업 데이터도 유지하지 않습니다.</p></details>
          </div>
        </section>
      </main>
      <footer><strong>사진맞춤</strong><span>이미지는 기기 안에서만 처리됩니다.</span></footer>
    </>
  );
}

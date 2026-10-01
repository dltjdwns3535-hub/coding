import Link from "next/link";

export function SiteHeader() {
  return <header className="siteHeader"><div className="bar">
    <Link className="brand" href="/">사진맞춤</Link>
    <nav className="siteNav" aria-label="주요 메뉴">
      <Link href="/">사진 변환</Link>
      <Link href="/guides/target-kb-pixels/">용량·픽셀 안내</Link>
      <Link href="/guides/image-formats/">형식 선택</Link>
    </nav>
  </div></header>;
}

export function SiteFooter() {
  return <footer className="siteFooter">
    <div><strong>사진맞춤</strong><p>이미지 데이터는 현재 브라우저에서 처리됩니다.</p></div>
    <nav aria-label="하단 메뉴"><Link href="/guides/target-kb-pixels/">사용 가이드</Link><Link href="/privacy/">개인정보·처리 방식</Link></nav>
  </footer>;
}

export function GuideLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <><a className="skipLink" href="#main-content">본문으로 건너뛰기</a><SiteHeader />
    <main className="contentMain" id="main-content">
      <nav className="breadcrumbs" aria-label="현재 위치"><Link href="/">사진맞춤</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
      <article className="article"><header className="articleIntro"><p className="eyebrow">사진맞춤 안내</p><h1>{title}</h1><p>{description}</p></header>{children}
        <div className="articleCta"><Link href="/#converter">사진 변환 도구 열기 →</Link></div>
      </article>
    </main><SiteFooter /></>;
}

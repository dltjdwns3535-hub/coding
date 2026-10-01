import type { Metadata } from "next";
import { SITE_NAME, siteUrl } from "../lib/site";
import "./globals.css";
import "./content.css";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  title: { default: `${SITE_NAME} | 사진 용량 줄이기·픽셀 크기 조절`, template: `%s | ${SITE_NAME}` },
  description: "JPEG·PNG·WebP 사진의 픽셀 크기와 목표 KB를 한 번에 설정하세요. 이미지 데이터를 서버로 전송하지 않고 브라우저에서 변환하는 무료 도구입니다.",
  applicationName: SITE_NAME,
  robots: { index: Boolean(siteUrl), follow: true },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION?.trim() ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() } : {}),
    ...(process.env.NAVER_SITE_VERIFICATION?.trim() ? { other: { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION.trim() } } : {}),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

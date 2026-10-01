import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사진맞춤 | 사진 용량·픽셀·형식 변환",
  description: "사진을 브라우저에서 원하는 용량, 픽셀 크기, JPEG·PNG·WebP 형식으로 안전하게 변환하고 저장하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

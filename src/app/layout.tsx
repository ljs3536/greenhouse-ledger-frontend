import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "네 동의 장부",
  description: "네 동의 비닐하우스 작물 수량과 생장 단계를 기록합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

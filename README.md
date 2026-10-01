# 사진맞춤

사진 한 장을 원하는 픽셀, 형식, 목표 용량에 맞게 변환하는 한국어 웹 도구입니다. 기존 Next.js·TypeScript 프로젝트를 이어 개선했습니다. Canvas와 Blob으로 사용자의 브라우저 안에서 처리하며 이미지 업로드 서버, 유료 API, 계정, 광고·분석 SDK를 사용하지 않습니다.

## 실행

Node.js 22 LTS(22.14 이상), npm 10 또는 11이 필요합니다. 정적 미리보기·검증·ZIP 생성에는 Python 3를 사용합니다.

```bash
nvm install
nvm use
npm ci
npm run dev
```

`npm run build`는 `out/`에 정적 파일을 생성합니다. Node 서버 없이 Cloudflare Pages 등 정적 호스팅에 배포할 수 있습니다.

```bash
npm run build
python3 -m http.server 4173 --directory out
```

브라우저에서 http://127.0.0.1:4173 을 엽니다. `npm start`도 같은 정적 미리보기를 시작합니다.

## 실제 동작과 처리 제한

- 정지 JPEG, PNG, WebP 한 장. 파일 확장자나 브라우저가 전달한 MIME 대신 실제 헤더를 확인합니다
- HEIC, GIF, SVG, 움직이는 PNG·WebP는 지원하지 않습니다
- 입력 파일 최대 25,000,000바이트(25MB), 입력·출력 총 40MP, 각 변 1~12,000px
- 디코딩 전 헤더 크기를 검사합니다. 그 한도 이내라도 기기 메모리·브라우저 한계 때문에 실패할 수 있습니다
- 원본 비율을 켜면 반대쪽 치수를 계산합니다. 끄면 입력한 가로·세로에 맞게 늘이거나 줄입니다. 자르기·증명사진 규격 판정 기능은 없습니다
- JPEG의 투명 영역에는 지정한 배경색을 채웁니다. 기본은 흰색입니다
- 목표 용량은 1~25,000KB, 소수 둘째 자리까지. 1KB = 1,000바이트입니다
- JPEG·WebP는 품질을 탐색하고, 명시적으로 자동 축소를 켠 경우에만 픽셀도 줄입니다
- PNG는 품질 조절이 없습니다. 자동 축소를 허용하지 않으면 픽셀을 바꾸지 않고 실제 파일 크기로 목표 충족 여부를 판정합니다
- 용량 달성을 보장하지 않습니다. 목표 미달 파일도 미달 표시와 실제 바이트 수를 확인하고 저장할 수 있습니다. 자동 축소 시 입력한 픽셀과 결과 픽셀을 구분합니다
- 변환 과정에서 이미지는 네트워크로 보내지 않으며 원본 파일을 수정하지 않습니다. 브라우저 메모리의 미리보기 URL은 교체·초기화·종료 시 해제합니다. 직접 다운로드한 파일은 기기에 남습니다
- Canvas 재인코딩은 원본의 EXIF 등 메타데이터 보존, 색상 프로필 일치, 원본 품질 보존을 보장하지 않습니다

## 검증

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

한 번에 실행하려면 Chromium 설치 후 `npm run verify`를 사용합니다. 이미 설치된 Chromium을 써야 하는 환경에서는 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`로 지정할 수 있습니다. 이는 실제 Chromium 브라우저 테스트이며 iPhone·Android 실기기 검증을 대신하지 않습니다.

GitHub Actions는 잠금 파일로 설치 후 단위 테스트, 타입 검사, 정적 빌드, Chromium 테스트와 보안 감사를 수행합니다. `static-export`, `playwright-results`, `npm-audit-report` 아티팩트를 올립니다. 배포나 병합은 자동으로 하지 않습니다.

Next.js·React는 호환되는 보안 패치 버전을 고정했습니다. Next.js가 고정한 하위 PostCSS의 취약점을 피하기 위해 호환 8.x 패치를 override합니다. 향후 업데이트 시 lockfile과 전체 검증을 함께 갱신하세요.

## 확인된 배포 주소

프로덕션 origin은 https://sajinmatchum-tools.pages.dev 입니다. 개별 배포 주소인 `915c08c6.sajinmatchum-tools.pages.dev`를 canonical로 사용하지 않습니다.

```bash
npm ci
SITE_URL=https://sajinmatchum-tools.pages.dev npm run build
npm run package:static
```

같은 셸에서 전체 검증을 재현하려면 `SITE_URL=https://sajinmatchum-tools.pages.dev npm run verify`를 사용합니다. GitHub Actions에도 같은 `SITE_URL`을 고정해 빌드와 브라우저 검증을 함께 수행합니다. Cloudflare에서 직접 Git 빌드를 구성할 경우에도 Production 환경 변수에 같은 값을 지정하고, 빌드 명령은 `npm run build`, 출력 디렉터리는 `out`으로 설정하세요.

Google·네이버에서 발급된 공개 소유 확인 태그는 `lib/site-verification.ts`에 해당 origin 전용으로 보존합니다. 따라서 같은 명령으로 재빌드해도 두 태그가 유지됩니다. `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION` 환경 변수는 명시적인 변경이 필요할 때만 덮어씁니다. 도메인이나 소유 계정을 변경하면 새로 발급받은 값을 확인하고 갱신하세요.

현재 `sajin-matchum-production.zip`은 이 주소용입니다. 미리보기 `sajin-matchum-preview-noindex.zip`과 혼동하지 마세요. 도메인을 변경한다면 이 설정과 CI의 `SITE_URL`을 함께 갱신하고 재빌드해야 합니다. 실제 업로드·배포는 별도 승인/작업이며 이 명령만으로 사이트가 배포되지는 않습니다.

## 검색 노출 설정과 배포

실제 공개 주소를 아직 정하지 않은 빌드는 미리보기입니다. `SITE_URL` 없이 빌드하면 검색 수집을 막는 `noindex`를 출력하고 가짜 canonical·sitemap 주소를 만들지 않습니다. 이 미리보기 ZIP을 그대로 공개한 뒤 검색 등록만 하는 것으로는 검색에 노출되지 않습니다.

1. Cloudflare Pages 프로젝트 또는 도메인을 정하고 실제 HTTPS 루트 주소를 확인합니다
2. 그 주소를 `SITE_URL`로 지정해 다시 빌드합니다. 경로·쿼리·프래그먼트가 붙은 주소는 사용하지 않습니다
3. 선택적으로 Google Search Console과 네이버 서치어드바이저에서 받은 소유 확인 값을 각각 `GOOGLE_SITE_VERIFICATION`, `NAVER_SITE_VERIFICATION`에 지정합니다
4. 재빌드한 `out/` 또는 ZIP을 동일한 사이트에 배포합니다. Pages 빌드 명령은 `npm run build`, 출력 폴더는 `out`입니다
5. 공개 HTML의 canonical/robots와 `/robots.txt`, `/sitemap.xml`, 안내 페이지, 모바일 변환·저장을 확인합니다
6. 사이트 소유자가 검색 서비스에서 소유 확인·사이트맵 제출·색인 요청을 진행합니다

```bash
# 아래 값은 배포 후 확인한 실제 HTTPS 루트 주소로 설정하세요.
SITE_URL="$CONFIRMED_PRODUCTION_ORIGIN" npm run build
npm run package:static
```

ZIP은 `artifacts/`에 생성되며 `index.html`이 최상위에 있습니다. 파일명에 `preview-noindex` 또는 `production`을 표시하고 SHA-256을 출력합니다. 미리보기 아카이브에 실제 사이트 주소가 생기면 반드시 프로덕션 빌드로 교체하세요.

Google·네이버 검색 순위나 색인을 보장하지 않습니다. 고유한 한국어 설명, 실제 사용 가능한 도구, 페이지별 메타데이터·내부 링크·사이트맵 등 검색엔진이 내용을 이해할 수 있는 기본을 갖춥니다. 복제된 숫자별 페이지, 숨은 키워드, 허위 후기·평점은 만들지 않습니다.

상세 검색 설정과 공식 참고 문서는 [SEO.md](SEO.md)를 참고하세요.

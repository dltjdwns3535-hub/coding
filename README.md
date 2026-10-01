# 사진맞춤

사진 한 장을 원하는 픽셀, 형식, 목표 용량에 맞게 변환하는 한국어 웹 도구입니다. 이미지 처리는 외부 업로드 없이 브라우저 안에서 이루어지며, Next.js 정적 내보내기를 지원합니다.

## 실행

Node.js 22 LTS(22.14 이상)와 npm 10 또는 11이 필요합니다. `.nvmrc`를 사용하는 경우 다음과 같이 버전을 맞출 수 있습니다.

```bash
nvm install
nvm use
npm install
npm run dev
```

브라우저에서 터미널에 표시된 로컬 주소를 여세요. 프로덕션 정적 파일은 `npm run build` 후 `out/`에 생성됩니다. 빌드 결과를 로컬에서 확인하려면 다음 명령을 실행하고 표시된 로컬 주소를 여세요.

```bash
python3 -m http.server 4173 --directory out
```

## 검증

```bash
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

## 처리 제한

- 입력: JPEG, PNG, WebP 한 장
- 파일: 최대 25MB
- 총 픽셀: 최대 40MP
- 한 변: 1~12,000px
- 목표 용량: 1~25,000KB (1KB = 1,000바이트)

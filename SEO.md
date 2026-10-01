# 검색 노출 준비

검색 최적화는 수집·색인과 페이지 이해를 돕는 작업입니다. 검색 순위, 색인 여부나 방문자 수를 보장하지 않습니다. 유료 API는 필요하지 않습니다.

## 배포 시 반드시 설정

1. 실제 운영 주소가 정해지면 빌드 환경 변수 `SITE_URL`에 정확한 HTTPS origin을 설정합니다. 경로·포트·쿼리가 없는 주소만 지원합니다. 이 프로젝트는 루트 경로에 배포합니다.
2. `SITE_URL`을 설정한 상태에서 `npm run build`를 다시 실행하고 생성된 `out/`을 배포합니다. 정적 파일이므로 배포 후 환경 변수만 바꾸면 반영되지 않습니다.
3. 실제 주소가 없는 빌드는 미리보기용입니다. canonical·Open Graph URL을 만들지 않고, sitemap은 비어 있으며, 페이지에 `noindex, follow`를 넣습니다. 이 상태의 ZIP을 그대로 공개하면 검색 색인을 요청할 준비가 된 것이 아닙니다.
4. 운영 빌드는 네 개의 고유 URL에 self-canonical을 생성합니다. sitemap에는 실제 운영 URL만 포함하며, 확인되지 않은 lastmod·리뷰·평점·검색량은 넣지 않습니다.

## 무료 소유 확인과 수집 요청

- Google Search Console에 실제 운영 주소를 추가하고 소유 확인을 진행합니다. HTML 태그 방식을 사용하는 경우 발급된 content 값만 `GOOGLE_SITE_VERIFICATION`에 넣고 다시 빌드합니다.
- 네이버 서치어드바이저에 같은 운영 사이트를 추가합니다. HTML 태그 방식의 content 값만 `NAVER_SITE_VERIFICATION`에 넣고 다시 빌드합니다.
- `robots.txt`와 `sitemap.xml`이 실제 운영 호스트에서 200 응답을 반환하는지 확인합니다. 사이트맵의 URL, canonical, 내부 링크가 같은 운영 주소를 가리키는지 확인합니다.
- 두 서비스에 sitemap을 제출하고 주요 페이지의 수집·URL 검사를 진행합니다. 소유 계정 확인은 별도 작업이며 이 저장소가 자동 수행하지 않습니다.
- 제목·본문·가이드가 초기 HTML에 있는지, robots meta가 `index, follow`인지 확인합니다. preview와 production ZIP을 혼동하지 마세요.
- 유입 데이터가 쌓이면 실제 노출 검색어·클릭·색인 보고서를 기준으로 개선합니다. 수집 요청을 반복해도 순위가 보장되지 않습니다.

## 콘텐츠 구성과 조사 범위

2026-10-01에 ‘사진 용량 줄이기’, ‘사진 크기 조절’, ‘사진 용량 줄이기 100KB 픽셀 크기 조절’, ‘PNG JPG 변환 투명 배경 무료’ 한국어 웹 검색 결과와 공개 도구 페이지를 검토했습니다. 이는 검색 의도와 경쟁 기능을 파악하기 위한 표본이며 검색량 측정이나 Google·네이버의 확정 순위가 아닙니다. 네이버 직접 검색 결과는 조사 도구에서 접근되지 않아 순위를 검증하지 못했습니다.

- 홈페이지: 즉시 사진 변환, 실제 바이트와 픽셀 검수, 솔직한 실패 안내
- 목표 KB·픽셀 가이드: 서로 다른 조건 구분, 비율 왜곡, 자동 축소와 최소 해상도 충돌 해결
- 형식 가이드: JPG·PNG·WebP와 투명 배경·품질·파일 크기의 차이
- 개인정보 안내: 이미지 로컬 처리와 페이지 네트워크 요청·다운로드 파일 보관 구분

100·200·300KB별로 비슷한 페이지를 늘리지 않습니다. 수치별 예시는 한 가이드와 도구 안에서 해결합니다. FAQ는 사용자를 위한 화면 콘텐츠이며 FAQ 리치 결과나 평점을 얻기 위해 허위 스키마를 추가하지 않습니다. 여권사진 통과나 ‘화질 손실 없음’, 일정한 감소율을 보장하지 않습니다.

### 검색 의도 참고 페이지

- [iLoveIMG 이미지 크기 조절](https://www.iloveimg.com/ko/resize-image): 픽셀·퍼센트와 원본 비율 유지 옵션
- [Squoosh](https://squoosh.app/): 로컬 처리, 전후 비교와 실제 설정
- [FileTool 목표 KB 도구](https://filetools.co.kr/tools/image-compress): 목표 KB·품질 및 파일 형식 관련 검색 의도

### 공식 근거

- [네이버 SEO 기본 가이드](https://searchadvisor.naver.com/guide/seo-help): 고유한 제목·설명과 명확한 HTML 구조
- [네이버 robots.txt](https://searchadvisor.naver.com/guide/seo-basic-robots): 루트 robots와 리소스 수집 허용
- [네이버 수집 요청](https://searchadvisor.naver.com/guide/request-crawl): 요청 이후 수집까지 시간 소요
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): 초기 HTML, 고유 메타데이터와 canonical
- [Google 사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): 절대 URL과 canonical URL, 제출은 보장이 아닌 신호
- [Google 스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies): doorway·scaled content·키워드 과잉 회피
- [Google FAQ 노출 변경](https://developers.google.com/search/blog/2023/08/howto-faq-changes): 일반 도구 사이트의 FAQ 리치 결과를 약속하지 않음

콘텐츠의 기술 근거는 각 가이드에도 연결되어 있습니다. 개인정보 설명은 현재 코드에 대한 범위 설명입니다. 배포 이후 분석 도구·외부 스크립트·업로드 API 등을 추가하면 실제 동작에 맞게 안내도 수정해야 합니다.

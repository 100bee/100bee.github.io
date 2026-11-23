# 정지석 — Software Engineer

https://100bee.github.io/

## 소개 프로젝트

- [ITPT](https://github.com/CSInterviewProject/ITPT_PUBLIC): 음성 답변과 AI 피드백을 연결한 CS 면접 연습
- [Lawg](https://github.com/100bee/lawg): 게임·커뮤니티 온라인 사건 법령 안내 (개발 중)
- [GazeSignal API](https://github.com/100bee/gaze-signal-api): 로컬 웹캠 분석과 REST·WebSocket 이벤트
- [Chronote](https://github.com/100bee/Chronote): 관심사 기반 AI 매칭과 실시간 채팅

프로젝트 설명은 2026-09-09 공개 README 기준입니다. Lawg 이미지는 저장소의 리포트 화면 시안입니다. 기존 소개·학력·연락처와 Chronote UI 데모를 유지합니다.

## 버전

- `/` — v2: Three.js 중력 씬(구슬이 모이고 → 떨어지고 → `</>` 모양으로 조립되고 → 화면 밖으로 날아감) 뒤에 프로젝트·이력·연락처
- `/v1/` — 이전 포트폴리오. 그대로 보관하며 검색 노출은 막아 두었습니다(`noindex`).
- `/christmas/` — ASCII 크리스마스 트리 토이 프로젝트. 파일 하나(`christmas/index.html`)로 동작하며 빌드 과정이 필요 없습니다. 방명록은 Supabase `wishes` 테이블에 저장돼 모든 방문자가 함께 보고(글쓴이는 자기 글만 삭제 가능, `#admin`으로 로그인한 관리자는 모든 글 삭제 가능), 페이지에 넣은 DejaVu Sans Mono 폰트의 라이선스는 `christmas/FONT-LICENSE.txt`에 있습니다.

## 실행과 배포 준비

- `npm run dev`: http://127.0.0.1:4173
- `npm run build`: 내용 해시가 붙은 CSS·JS를 `assets/`에 생성하고 각 페이지(`index.html`, `v1/index.html`)의 참조를 갱신한 뒤, 동일한 공개 파일을 `dist/`에 복사합니다.
- GitHub Pages는 기존처럼 `main` 브랜치의 루트에서 배포합니다.
- 별도 의존성 설치 없이 Python 3와 Node.js 18 이상을 사용합니다. Three.js는 unpkg CDN에서 불러옵니다.

## 수정할 소스

v2 (루트)
- `index.html`: 본문
- `gravity.css`: 전체 스타일
- `gravity.js`: 스크롤 진행도, 스무스 스크롤, WebGL 씬·물리, 팔레트 설정 패널

v1 (`v1/`)
- `v1/index.html`, `v1/portfolio.css`, `v1/navigation.js`, `v1/hero.css`, `v1/hero-motion.js`, `v1/cursor-build.css`, `v1/cursor-build.js`
- `itpt-demo/`, `chronote-demo/`: 두 버전이 함께 쓰는 로고와 UI 데모

CSS·JS를 바꾼 뒤에는 반드시 `npm run build`를 실행하고, 갱신된 HTML과 생성된 해시 파일을 함께 반영합니다. 같은 파일명으로 다른 내용이 캐시되는 것을 방지하기 위한 구성입니다. 이전 해시 파일과 루트의 `styles.css`, `script.js`는 이전 HTML을 캐시한 방문자의 화면을 위해 유지합니다.

JavaScript나 WebGL이 없어도(또는 CDN이 막혀도) 7초 뒤 씬 없이 본문·링크·구현 내용 펼치기를 사용할 수 있습니다. `prefers-reduced-motion` 환경에서는 스무스 스크롤과 등장 애니메이션을 끕니다.

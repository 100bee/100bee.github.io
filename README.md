# 정지석 — Software Engineer

기존 Software Engineer 첫 화면과 회전·마우스 반응 그래픽을 유지하고, 아래에 새 프로젝트 카드와 소개·기술·이력을 연결한 포트폴리오입니다.

https://100bee.github.io/

## 소개 프로젝트

- [RAGOps Copilot](https://github.com/100bee/rag-ops-copilot): 운영 문서 검색, 출처 확인과 검색 평가
- [ITPT](https://github.com/CSInterviewProject/ITPT_PUBLIC): 음성 답변과 AI 피드백을 연결한 CS 면접 연습
- [GazeSignal API](https://github.com/100bee/gaze-signal-api): 로컬 웹캠 분석과 REST·WebSocket 이벤트
- [Chronote](https://github.com/100bee/Chronote): 관심사 기반 AI 매칭과 실시간 채팅

프로젝트 설명은 2026-09-09 공개 README 기준입니다. RAGOps 이미지는 해당 저장소의 실제 실행 화면입니다. 기존 소개·학력·연락처와 Chronote UI 데모를 유지합니다.

## 실행과 배포 준비

- `npm run dev`: http://127.0.0.1:4173
- `npm run build`: 내용 해시가 붙은 CSS·JS를 `assets/`에 생성하고 루트 HTML의 참조를 갱신한 뒤, 동일한 공개 파일을 `dist/`에 복사합니다.
- GitHub Pages는 기존처럼 `main` 브랜치의 루트에서 배포합니다.
- 별도 의존성 설치 없이 Python 3와 Node.js 18 이상을 사용합니다.

## 수정할 소스

- `index.html`: 본문
- `portfolio.css`: 프로젝트·소개·기술·이력·연락처 스타일
- `navigation.js`: 메뉴·현재 섹션 표시
- `hero.css`: 기존 첫 화면에만 적용하는 스타일
- `hero-motion.js`: 원본 Canvas 애니메이션, 동작 줄이기 및 비활성 화면 정지 로직
- `itpt-demo/`, `chronote-demo/`: 기존 로고와 UI 데모

CSS·JS를 바꾼 뒤에는 반드시 `npm run build`를 실행하고, 갱신된 HTML과 생성된 해시 파일을 함께 반영합니다. 같은 파일명으로 다른 내용이 캐시되는 것을 방지하기 위한 구성입니다. 이전 해시 파일과 루트의 `styles.css`, `script.js`는 이전 HTML을 캐시한 방문자의 화면을 위해 유지합니다. 이 두 루트 파일은 새 디자인의 소스가 아닙니다.

JavaScript 없이도 본문·링크·구현 내용 펼치기를 사용할 수 있습니다. Google Fonts가 로드되지 않으면 시스템 글꼴을 사용합니다.

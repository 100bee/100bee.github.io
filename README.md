# 정지석 — Software Engineer

서비스 개발과 AI 연동 경험을 소개하는 GitHub Pages 포트폴리오입니다.

https://100bee.github.io/

## 소개 프로젝트

- [RAGOps Copilot](https://github.com/100bee/rag-ops-copilot): 운영 장애 문서 검색, 출처 확인, 검색 방식 평가
- [ITPT](https://github.com/CSInterviewProject/ITPT_PUBLIC): 음성 답변과 AI 피드백을 연결한 CS 면접 연습
- [GazeSignal API](https://github.com/100bee/gaze-signal-api): 로컬 웹캠 분석과 REST·WebSocket 이벤트
- [Chronote](https://github.com/100bee/Chronote): 관심사 기반 AI 매칭과 실시간 그룹 채팅

흰색·코발트블루·네이비, 프로젝트 중심 첫 화면, 반응형 카드와 구현 내용 펼치기를 사용합니다.
기존 소개·학력·연락처와 Chronote UI 데모를 유지합니다. UI 데모는 과거 학습 관리 화면이며 현재 저장소의 전체 백엔드 기능을 실행하지 않습니다.

## 실행 및 빌드

- 로컬 미리보기: `npm run dev` → http://127.0.0.1:4173
- 정적 빌드: `npm run build` → `dist/`
- 별도 패키지 설치 없이 Python 3와 Node.js 18 이상을 사용합니다.

GitHub Pages는 저장소 루트의 정적 파일을 제공합니다.

## 파일

- `index.html`: 소개·프로젝트·기술·이력·연락처
- `styles.css`: 반응형 레이아웃과 색상
- `script.js`: 모바일 메뉴, 현재 섹션 표시
- `assets/rag-dashboard.png`: RAGOps 저장소의 실제 실행 화면
- `itpt-demo/`, `chronote-demo/`: 기존 로고와 UI 데모

프로젝트 설명은 2026-09-09의 공개 README를 기준으로 정리했습니다. RAG 검색 평가의 범위와 한계, GazeSignal의 관측 신호 범위를 프로젝트 상세에 함께 표시합니다.
JavaScript 없이도 본문·링크·구현 내용 펼치기를 사용할 수 있습니다. Google Fonts가 로드되지 않으면 시스템 글꼴을 사용하며, 동작 줄이기 설정을 지원합니다.

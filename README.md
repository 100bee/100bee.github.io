# 정지석 — Software Engineer

흰색·파란색·검정색의 기존 아이덴티티를 유지한 개발 포트폴리오입니다.
대형 타이포그래피, 넓은 여백, 반응형 프로젝트 레이아웃, Canvas 기반 기하학 모션을 적용했습니다.

## 미리보기

```sh
npm run dev
```

http://127.0.0.1:4173 에서 확인합니다. Python 3가 필요하며 별도의 패키지 설치는 없습니다.

## 배포

GitHub Pages는 기존과 같이 저장소 루트의 `index.html`을 그대로 제공합니다.
ITPT 서비스, 공개 저장소 및 `chronote-demo/` 링크를 유지합니다.

Sites용 정적 빌드:

```sh
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. Node.js 18 이상을 사용합니다.

## 편집

- `index.html`: 소개, 프로젝트, 기술, 학력, 연락처
- `styles.css`: 반응형 레이아웃과 색상
- `script.js`: 모바일 메뉴, 현재 섹션 표시, 입체 그래픽
- `chronote-demo/`: 기존 Chronote UI 데모

JavaScript 없이도 본문과 링크를 이용할 수 있습니다. 동작 줄이기를 설정하면
입체 그래픽은 정지 화면으로 표시되며, 화면 밖이나 비활성 탭에서는 애니메이션을 멈춥니다.

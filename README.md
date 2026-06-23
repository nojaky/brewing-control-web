# 브루잉 컨트롤 웹 버전

1985커피 로스터현의 브루잉 컨트롤 프로그램을 GitHub Pages에서 실행할 수 있도록 변환한 정적 웹앱입니다.

## 실행

`index.html`을 브라우저에서 열면 바로 사용할 수 있습니다. 별도의 설치나 서버가 필요하지 않습니다.

## GitHub Pages 공개

1. GitHub에서 새 공개 저장소를 만듭니다. 예: `brewing-control`
2. 이 폴더 안의 `index.html`, `styles.css`, `app.js`를 저장소 최상위에 업로드합니다.
3. 저장소의 `Settings` > `Pages`로 이동합니다.
4. `Build and deployment`의 소스를 `Deploy from a branch`로 선택합니다.
5. 브랜치는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
6. 잠시 후 표시되는 공개 주소를 네이버 블로그에 연결합니다.

예상 주소:

```text
https://사용자이름.github.io/brewing-control/
```

## 원본 대비 변경점

- Tkinter 화면을 반응형 웹 UI로 변경
- Matplotlib 차트를 브라우저 Canvas 차트로 변경
- 측정 기록은 현재 브라우저에만 저장
- 엑셀 저장은 Excel에서 바로 열 수 있는 CSV 다운로드로 변경
- 개인정보나 측정값을 외부 서버로 전송하지 않음

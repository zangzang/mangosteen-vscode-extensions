# 개발 가이드

이 문서는 확장 개발 및 배포와 관련된 내용을 안내합니다.

---

## 확장 개발 및 게시

### 1. 개발 환경 준비

- Node.js와 [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/)이 설치되어 있어야 합니다.
- VS Code 확장 개발을 위해 [yo code](https://code.visualstudio.com/api/get-started/your-first-extension) 및 [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) 설치 권장:
  ```
  npm install -g yo generator-code vsce
  ```

### 2. 의존성 설치

- 프로젝트 루트에서 다음 명령어로 의존성을 설치하세요:
  ```
  yarn install
  ```

### 3. 개발 서버 실행

- 코드 변경 시 자동 빌드를 위해 다음 명령어를 사용하세요:
  ```
  yarn watch
  ```

### 4. 확장 실행 및 디버깅

- VS Code에서 `F5`를 눌러 확장 개발 호스트를 실행할 수 있습니다.

### 5. 확장 패키징

- 확장 배포용 VSIX 파일 생성:
  ```
  yarn package
  ```
- 또는, 직접 `vsce` 명령어를 사용해 패키징할 수도 있습니다:
  ```
  vsce package
  ```

### 6. 확장 게시

- [Visual Studio Marketplace](https://marketplace.visualstudio.com/)에 게시하려면 [Azure DevOps Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)을 발급받아야 합니다.
- 게시 명령어:
  ```
  vsce publish
  ```

---

## 기타 개발 관련 참고

- `tasks.json`의 problemMatcher 오류 등은 [README의 개발 관련 섹션](./README.md#개발-관련)을 참고하세요.

---

## 참고 링크

- [VS Code 확장 개발 공식 문서](https://code.visualstudio.com/api)
- [VSCE 공식 문서](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
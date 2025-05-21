# 개발 가이드

이 문서는 확장 개발 및 배포와 관련된 내용을 안내합니다.

## 목차
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [빌드 및 테스트](#빌드-및-테스트)
- [설정 파일 관리](#설정-파일-관리)
- [내부 동작 및 주요 구현 기능](#내부-동작-및-주요-구현-기능)
- [배포 프로세스](#배포-프로세스)
- [기여 가이드](#기여-가이드)

## 주요 변경사항 (2025-05)

### 설정 파일(`quicktype.settings.json`) 구조 개선
- 언어별 옵션의 `default`와 `enum` 순서를 명확히 하여, `default`가 항상 첫 번째, `enum`이 두 번째로 오도록 정렬했습니다.
- 각 enum 배열에서 default 값이 항상 첫 번째로 오도록 자동 정렬했습니다.
- 예시:
  ```json
  "arrayType": {
    "default": "list",
    "enum": ["list", "array"],
    ...
  }
  ```

### 설정 파일 복사 자동화
- `yarn package` 시 `src/quicktype.settings.json`이 `dist/quicktype.settings.json`으로 자동 복사되도록 스크립트(`copyfiles` 사용) 추가
- `package.json`의 `files` 항목에도 포함되어 npm 배포 시 누락되지 않음

### 개발/디버깅 환경에서 설정 파일 경로 자동 탐색
- 확장 설치 전 디버깅 환경에서는 `__dirname`과 `process.cwd()`를 활용해 설정 파일을 자동 탐색하도록 개선
- 설치된 확장 환경과 개발 환경 모두에서 설정 파일을 안정적으로 찾을 수 있음

### 기타
- enum, default, description, type 등 설정 항목의 순서와 포맷을 일관성 있게 정리
- README에 최신 구조와 설정 예시 반영

---

## 개발 환경 설정

### 필수 도구 설치
- Node.js와 [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/)이 설치되어 있어야 합니다.
- VS Code 확장 개발을 위해 [yo code](https://code.visualstudio.com/api/get-started/your-first-extension) 및 [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) 설치:
  ```bash
  npm install -g yo generator-code vsce
  ```

### 의존성 설치
프로젝트 루트에서 다음 명령어를 실행하여 의존성을 설치하세요:
```bash
yarn install
```

## 프로젝트 구조

주요 디렉토리와 파일:
```
.
├── src/                    # 소스 코드
│   ├── extension.ts       # 확장의 진입점
│   └── quicktype.settings.json  # 언어별 설정 정의
├── dist/                   # 빌드된 파일들
├── test/                   # 테스트 파일들
└── package.json           # 확장 메타데이터 및 의존성
```

## 빌드 및 테스트

### 개발 모드 실행
1. VS Code에서 프로젝트를 엽니다
2. F5를 눌러 디버그 모드로 새 VS Code 창을 엽니다
3. 변경사항을 테스트합니다

### 빌드
다음 명령어로 프로젝트를 빌드합니다:
```bash
yarn build
```

### 테스트 실행
단위 테스트 실행:
```bash
yarn test
```

## 설정 파일 관리

설정 파일(`quicktype.settings.json`)은 다음 규칙을 따릅니다:

1. 구조:
   - 각 옵션은 `default`와 `enum` 순서로 정의
   - enum 배열에서 default 값이 항상 첫번째 위치
   - 포맷: default > enum > description > type 순서

2. 자동화된 복사:
   - `yarn package` 시 자동으로 dist 폴더로 복사
   - `package.json`의 `files` 항목에 포함되어 배포 시 누락 방지

3. 경로 탐색:
   - 개발 환경: `__dirname`과 `process.cwd()`로 자동 탐색
   - 배포 환경: 설치된 확장 경로에서 탐색

## 내부 동작 및 주요 구현 기능

### 1. JSON Data와 JSON Schema 자동 판별
- 파일명, 경로, 파일 내용의 `$schema` 키 존재 여부로 자동 판별
  - 예: `*.schema.json` 또는 경로에 `schema` 폴더가 포함되면 우선적으로 스키마로 간주
  - 파일 내용의 루트에 `$schema` 키가 있으면 JSON Schema, 없으면 일반 JSON Data로 처리

### 2. Java/C#의 패키지명 및 네임스페이스 자동 추출
- Java: 파일 경로 내 `java` 폴더 이후의 경로를 `.`으로 연결하여 패키지명으로 사용
  - 예: `/src/schema/java/com/example/user.json` → `com.example`
- C#: `schema` 폴더 이후의 경로를 파스칼케이스로 변환하여 네임스페이스로 사용
  - 예: `/src/schema/order/customer.schema.json` → `Order` 네임스페이스

### 3. schema 폴더 위치에 따른 출력 파일 경로 자동 결정
- Java: `schema/java` 구조를 감지하면, 동일한 위치의 `main/java`로 출력 경로를 자동 변환
  - 예: `/src/schema/java/com/example/user.json` → `/src/main/java/com/example/`
- C#: `schema` 폴더를 제외한 경로를 파스칼케이스로 변환하여 출력 디렉토리로 사용
  - 예: `/src/schema/order/customer.schema.json` → `/src/Order/`

### 4. 언어별 옵션 자동 적용 및 커스텀 입력 지원
- 각 언어별로 패키지명, 네임스페이스, 배열 타입, 프레임워크 등 옵션을 자동 적용
- 필요시 사용자 입력을 통해 옵션을 직접 지정 가능

## 배포 프로세스

1. 버전 업데이트:
   - CHANGELOG.md 업데이트
   - package.json의 version 수정

2. 패키지 생성:
   ```bash
   yarn package
   ```

3. 마켓플레이스 배포:
   ```bash
   vsce publish
   ```

## 기여 가이드

1. Fork 및 Clone
2. 브랜치 생성 (`feature/새기능` 또는 `fix/버그수정`)
3. 변경사항 구현
4. 테스트 추가 및 실행
5. Pull Request 생성

### 코딩 스타일
- ESLint 규칙을 따릅니다
- 커밋 메시지는 명확하고 자세하게 작성
- 새로운 기능은 테스트 코드 포함

---

## 설정 파일 및 빌드 자동화

- 언어별 옵션 설정 파일(`src/quicktype.settings.json`)의 구조가 개선되었습니다. 각 옵션의 `default`와 `enum` 순서가 명확해졌고, enum 배열에서 default 값이 항상 첫 번째로 오도록 정렬됩니다.
- 빌드/패키징 시(`yarn package`) 설정 파일이 dist 폴더로 자동 복사되도록 `copyfiles`를 활용한 스크립트가 추가되었습니다.
- 개발/디버깅 환경에서는 확장 설치 전에도 `__dirname`/`process.cwd()` 기준으로 설정 파일을 자동 탐색합니다.
- 실제 배포 시에는 `package.json`의 files 항목에 포함되어 npm 배포에도 누락되지 않습니다.

### 빌드/패키징 예시
```sh
# 개발 중 자동 빌드/감시
$ yarn watch

# 패키징(설정 파일 자동 복사)
$ yarn package
```

### 참고
- 설정 파일 구조 및 복사 방식은 README.md의 "주요 변경사항"과 "설정 파일 복사 자동화" 항목을 참고하세요.

---

## 기타 개발 관련 참고

- `tasks.json`의 problemMatcher 오류 등은 [README의 개발 관련 섹션](./README.md#개발-관련)을 참고하세요.

---

## 참고 링크

- [VS Code 확장 개발 공식 문서](https://code.visualstudio.com/api)
- [VSCE 공식 문서](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

---

## 개발 관련

### esbuild watch 작업 오류 해결

VS Code에서 `npm: watch:esbuild` 작업 실행 시 아래와 같은 오류가 발생할 수 있습니다.

```
오류: 잘못된 problemMatcher 참조: $esbuild-watch
```

이 오류는 `tasks.json`에서 `$esbuild-watch` problemMatcher가 등록되어 있지 않아 발생합니다.  
해결 방법:

- esbuild 관련 VS Code 확장 프로그램을 설치하거나,
- `tasks.json`에서 problemMatcher를 제거하거나, 지원되는 problemMatcher(예: `$tsc`, `$eslint-stylish`)로 변경하세요.

예시:
```json
// .vscode/tasks.json
{
  "label": "watch:esbuild",
  "type": "npm",
  "script": "watch:esbuild",
  "problemMatcher": []
}
```

### Quicktype 버전 호환성 안내(2025-05-21)

- Quicktype 최신 버전에서 오류가 발생할 수 있으므로, 오류 발생 시 최신 버전을 제거하고 안전한 권장 버전(23.2.4)을 설치하도록 개발/테스트 시 반드시 확인할 것.
- 관련 안내와 명령어는 README.md 상단에 추가되어 있음.
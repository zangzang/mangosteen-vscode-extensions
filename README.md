# JSON Model Generator

Visual Studio Code에서 JSON 스키마 파일로부터 다양한 프로그래밍 언어의 모델/엔티티 클래스를 자동 생성하는 확장 프로그램입니다.

## 주요 기능

- JSON 스키마 기반 다양한 언어의 모델/엔티티 클래스 자동 생성
- 지원 언어: Java, C#, TypeScript, Python, Go, Kotlin, Dart, Swift, Ruby, JavaScript, Flow, Rust, C++, Scala, Objective-C, Elm, JSON Schema, Pike, Prop-Types, Haskell, PHP
- 언어별 사용자 정의 옵션 제공 (예: Java의 패키지명, C#의 JSON 프레임워크 등)
- 생성된 모델 파일을 자동으로 열어 편집 가능
- 소스 파일 구조에 맞는 위치에 자동 저장
- JSON 파일 위치에 따라 패키지명/네임스페이스 자동 인식

## 내부 동작 및 구현 원리

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

## 설치 방법

1. VS Code 확장 마켓플레이스에서 "JSON Model Generator" 검색
2. 설치 버튼 클릭
3. (필요시) VS Code 재시작

### 요구 사항

- [Quicktype](https://quicktype.io/) 설치 필요 (내부적으로 `npx quicktype` 명령어 사용)
- Node.js 설치 필요
- Visual Studio Code 1.99.0 이상

## 사용법

1. JSON 스키마 파일을 마우스 오른쪽 버튼으로 클릭
2. **"Generate Model"** 명령 선택
3. 대상 프로그래밍 언어 선택
4. 언어별 추가 옵션 입력(필요시)
5. 생성된 모델 파일이 자동으로 열림

## 확장 설정

- 언어별 기본 옵션(패키지명, 네임스페이스 등)은 내부 설정 파일(`quicktype.settings.json`)로 관리
- 각 언어별 옵션은 자동 적용되며, 필요시 직접 수정 가능
- 생성 파일은 소스 구조에 맞게 자동 저장

## 지원 언어 및 주요 옵션 예시

| 언어         | 주요 옵션 예시           |
|--------------|-------------------------|
| Java         | 패키지명                |
| C#           | JSON 프레임워크 선택    |
| TypeScript   | 네임스페이스, strict    |
| Python       | 클래스명, 타입 힌트     |
| ...          | ...                     |

## 자주 발생하는 문제

- Quicktype 명령어가 올바르게 설정되지 않으면 모델 생성이 실패할 수 있습니다.
- 지원되지 않는 언어 선택 시 오류가 발생합니다.

## 기여 및 참고 자료

- [개발 및 기여 가이드](./DEVELOPMENT.md)
- [변경 이력](./CHANGELOG.md)
- [Quicktype 공식 문서](https://quicktype.io/)
- [Visual Studio Code의 Markdown 지원](http://code.visualstudio.com/docs/languages/markdown)

## 라이선스 및 서드파티 라이브러리

- [Quicktype](https://quicktype.io/) - Apache-2.0 라이센스
  - JSON 스키마에서 다양한 프로그래밍 언어로 타입 정의를 생성하는 데 사용
  - [Quicktype GitHub Repository](https://github.com/quicktype/quicktype)

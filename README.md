# JSON Model Generator

JSON 스키마 파일로부터 다양한 프로그래밍 언어의 모델/엔티티 클래스를 생성하는 Visual Studio Code 확장입니다.

## Features

- JSON 스키마 파일을 기반으로 다양한 언어의 모델 클래스 생성
- 지원 언어:
  - Java, C#, TypeScript, Python, Go, Kotlin, Dart, Swift, Ruby, JavaScript, Flow, Rust, C++, Scala, Objective-C, Elm, JSON Schema, Pike, Prop-Types, Haskell, PHP
- 언어별로 사용자 정의 옵션 제공 (예: Java의 패키지 이름, C#의 JSON 프레임워크 선택)
- 생성된 모델 파일을 자동으로 열어 편집 가능

## Requirements

- [Quicktype](https://quicktype.io/) 설치 필요
  - `npx quicktype` 명령어를 사용하므로 Node.js가 설치되어 있어야 합니다.
- Visual Studio Code 1.99.0 이상

## Extension Settings

이 확장은 다음 설정을 제공합니다:

- `jsonModelGenerator.default.command`: 기본 quicktype 실행 명령어
- `jsonModelGenerator.csharp.command`: C# 모델 생성을 위한 quicktype 명령어
- `jsonModelGenerator.typescript.command`: TypeScript 모델 생성을 위한 quicktype 명령어
- `jsonModelGenerator.java.command`: Java 모델 생성을 위한 quicktype 명령어
- `jsonModelGenerator.python.command`: Python 모델 생성을 위한 quicktype 명령어

## Usage

1. JSON 스키마 파일을 마우스 오른쪽 버튼으로 클릭하고 **"Generate Model"** 명령을 선택합니다.
2. 대상 프로그래밍 언어를 선택합니다.
3. 언어별로 필요한 추가 옵션을 입력합니다.
4. 생성된 모델 파일이 자동으로 열립니다.

## Known Issues

- Quicktype 명령어가 올바르게 설정되지 않은 경우 모델 생성이 실패할 수 있습니다.
- 지원되지 않는 언어를 선택하면 오류가 발생합니다.

## Release Notes

### 0.0.1

- 초기 릴리스: JSON 스키마를 기반으로 모델 생성 기능 추가

---

## Following extension guidelines

- 이 확장은 Visual Studio Code 확장 가이드라인을 따릅니다.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## For more information

- [Quicktype 공식 문서](https://quicktype.io/)
- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

## Third-party Libraries

- 이 확장 프로그램은 다음 오픈 소스 라이브러리를 사용합니다:

- [Quicktype](https://quicktype.io/) - Apache-2.0 라이센스
  - JSON 스키마에서 다양한 프로그래밍 언어로 타입 정의를 생성하는 데 사용됩니다.
  - [Quicktype GitHub Repository](https://github.com/quicktype/quicktype)

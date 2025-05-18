# Change Log

## [0.0.3] - 2025-05-18

### Added
- 내부 동작 및 주요 구현 기능 문서화: JSON/Schema 자동 판별, Java/C# 패키지명 및 네임스페이스 추출, schema 폴더 위치에 따른 출력 경로 자동 결정, 언어별 옵션 자동화 등
- README.md, DEVELOPMENT.md에 실제 동작 원리 및 자동화 로직 설명 추가

### Changed
- 문서 구조 개선: 개발자와 사용자가 실제 동작 방식을 쉽게 이해할 수 있도록 문서화 강화

## [0.0.2] - 2025-05-16

### Changed
- quicktype.settings.json 구조 개선: default/enum 순서 명확화 및 enum 배열 내 default 우선 정렬
- yarn package 시 설정 파일이 dist로 자동 복사되도록 스크립트 추가
- 개발/디버깅 환경에서 설정 파일 경로 자동 탐색 지원
- 설정 항목 포맷 및 순서 일관성 개선

## [0.0.1] - 2025-04-28

### Added
- 초기 릴리스: JSON 스키마를 기반으로 다양한 언어의 모델 생성 기능 추가
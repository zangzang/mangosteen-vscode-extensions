import * as vscode from 'vscode';
import { getJavaOptions } from './lang/javaOptions';
import { getCSharpOptions } from './lang/csharpOptions';
import { getTypeScriptOptions } from './lang/typescriptOptions';
import { getPythonOptions } from './lang/pythonOptions';

// 지원하는 프로그래밍 언어 목록
export const SUPPORTED_LANGUAGES = [
  'Java',
  'C#',
  'TypeScript',
  'Python',
  'Go',
  'Kotlin',
  'Dart',
  'Swift',
  'Ruby',
  'JavaScript',
  'Flow',
  'Rust',
  'C++',
  'Scala',
  'Objective-C',
  'Elm',
  'JSON Schema',
  'Pike',
  'Prop-Types',
  'Haskell',
  'PHP'
];

// quicktype에서 사용하는 언어 매핑
export function getQuicktypeLanguage(language: string): string {
  switch (language) {
    case 'Java':
      return 'java';
    case 'C#':
      return 'csharp';
    case 'TypeScript':
      return 'typescript';
    case 'Python':
      return 'python';
    case 'Go':
      return 'go';
    case 'Kotlin':
      return 'kotlin';
    case 'Dart':
      return 'dart';
    case 'Swift':
      return 'swift';
    case 'Ruby':
      return 'ruby';
    case 'JavaScript':
      return 'javascript';
    case 'Flow':
      return 'flow';
    case 'Rust':
      return 'rust';
    case 'C++':
      return 'cpp';
    case 'Scala':
      return 'scala';
    case 'Objective-C':
      return 'objective-c';
    case 'Elm':
      return 'elm';
    case 'JSON Schema':
      return 'schema';
    case 'Pike':
      return 'pike';
    case 'Prop-Types':
      return 'prop-types';
    case 'Haskell':
      return 'haskell';
    case 'PHP':
      return 'php';
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// 모델 파일 이름 및 확장자 결정
export function getModelFileName(baseName: string, language: string): string {
  // 파일 이름 케이스 변환 (snake_case -> PascalCase)
  const className = baseName.replace(/\.schema$/, '')
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  switch (language) {
    case 'Java':
      return `${className}.java`;
    case 'C#':
      return `${className}.cs`;
    case 'TypeScript':
      return `${className}.ts`;
    case 'Python':
      return `${className}.py`;
    case 'Go':
      return `${className}.go`;
    case 'Kotlin':
      return `${className}.kt`;
    case 'Dart':
      return `${className}.dart`;
    case 'Swift':
      return `${className}.swift`;
    case 'Ruby':
      return `${className}.rb`;
    case 'JavaScript':
      return `${className}.js`;
    case 'Flow':
      return `${className}.js.flow`;
    case 'Rust':
      return `${className}.rs`;
    case 'C++':
      return `${className}.cpp`;
    case 'Scala':
      return `${className}.scala`;
    case 'Objective-C':
      return `${className}.m`;
    case 'Elm':
      return `${className}.elm`;
    case 'JSON Schema':
      return `${className}.schema.json`;
    case 'Pike':
      return `${className}.pike`;
    case 'Prop-Types':
      return `${className}.prop-types.js`;
    case 'Haskell':
      return `${className}.hs`;
    case 'PHP':
      return `${className}.php`;
    default:
      return `${className}.txt`;
  }
}

// 언어별 옵션을 가져오는 함수
export async function getLanguageSpecificOptions(language: string, filePath?: string): Promise<{ [key: string]: string }> {
  switch (language) {
    case 'Java':
      return await getJavaOptions(filePath);
    case 'C#':
      return await getCSharpOptions();
    case 'TypeScript':
      return await getTypeScriptOptions();
    case 'Python':
      return await getPythonOptions();
    // 다른 언어에 대한 옵션 추가 가능
    default:
      return {};
  }
}



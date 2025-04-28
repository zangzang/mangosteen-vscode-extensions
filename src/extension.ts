// jsonmodel-generator.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

import { SUPPORTED_LANGUAGES, getLanguageSpecificOptions, getQuicktypeLanguage, getModelFileName  } from './languageSpecificOptions';

export function activate(context: vscode.ExtensionContext) {
  console.log('JSON Model Generator Extension is now active');

  // Explorer 컨텍스트 메뉴에 "Generate Model" 명령 등록
  let generateModelCommand = vscode.commands.registerCommand(
    'extension.generateModel',
    async (fileUri: vscode.Uri) => {
      if (!fileUri) {
        // 선택된 파일이 없을 경우 현재 열린 파일 사용
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          fileUri = editor.document.uri;
        } else {
          vscode.window.showErrorMessage('No JSON file selected or open');
          return;
        }
      }

      // JSON 파일인지 확인
      if (path.extname(fileUri.fsPath).toLowerCase() !== '.json') {
        vscode.window.showErrorMessage('Selected file is not a JSON file');
        return;
      }

      try {
        // JSON 파일 내용 읽기
        const fileContent = fs.readFileSync(fileUri.fsPath, 'utf8');
        
        // JSON 형식 검증
        JSON.parse(fileContent);
        
        // 언어 선택 퀵픽 표시
        const selectedLanguage = await vscode.window.showQuickPick(SUPPORTED_LANGUAGES, {
          placeHolder: 'Select target programming language'
        });
        
        if (!selectedLanguage) {
          return; // 사용자가 취소함
        }
        
        // 모델 생성
        await generateModelForLanguage(fileUri, selectedLanguage);
        
      } catch (error) {
        if (error instanceof SyntaxError) {
          vscode.window.showErrorMessage('Invalid JSON file');
        } else {
          vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  );

  context.subscriptions.push(generateModelCommand);
}

async function generateModelForLanguage(jsonUri: vscode.Uri, language: string) {
  const jsonFilePath = jsonUri.fsPath;
  const jsonFileName = path.basename(jsonFilePath, '.json');
  const modelFileName = getModelFileName(jsonFileName, language);
  const outputDir = path.dirname(jsonFilePath);
  const outputPath = path.join(outputDir, modelFileName);

  try {
    // 언어별 옵션 가져오기
    const languageOptions = await getLanguageSpecificOptions(language);

    const result = await runModelGenerator(jsonFilePath, outputPath, language, languageOptions);

    if (result.success) {
      if (!fs.existsSync(outputPath)) {
        vscode.window.showWarningMessage(`File not found: ${outputPath}, generation may have failed.`);
        return;
      }

      vscode.window.showInformationMessage(`Model generated successfully: ${modelFileName}`);
      const doc = await vscode.workspace.openTextDocument(outputPath);
      await vscode.window.showTextDocument(doc);
    } else {
      vscode.window.showErrorMessage(`Failed to generate model: ${result.error}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating model: ${error instanceof Error ? error.message : String(error)}`);
  }
}


// 외부 프로세스 실행하여 모델 생성
// quicktype을 사용하여 JSON 스키마를 변환
async function runModelGenerator(
  jsonFilePath: string,
  outputPath: string,
  language: string,
  options: { [key: string]: string }
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const config = vscode.workspace.getConfiguration('jsonModelGenerator');
      const langCode = getQuicktypeLanguage(language);
      const langSettingKey = `${langCode}.command`;
      const quicktypeBaseCommand = config.get(langSettingKey) || config.get('quicktypeCommand', 'npx quicktype');
      const jsonFileName = path.basename(jsonFilePath);
      const outputFileName = path.basename(outputPath);

      // 기본 quicktype 명령어
      let quicktypeCommand = `${quicktypeBaseCommand} --src-lang schema --src ${jsonFileName} --lang ${langCode} -o ${outputFileName}`;

      // options 객체의 모든 키-값 쌍을 명령어에 추가
      for (const [key, value] of Object.entries(options)) {
        if (value === '') {
          // 값이 빈 문자열인 경우 키만 추가
          quicktypeCommand += ` --${key}`;
        } else {
          // 값이 있는 경우 키와 값을 함께 추가
          quicktypeCommand += ` --${key} ${value}`;
        }
      }

      console.log(`Running command: ${quicktypeCommand}!!`);
      cp.exec(quicktypeCommand, { cwd: path.dirname(jsonFilePath) }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true });
        }
      });
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export function deactivate() {}

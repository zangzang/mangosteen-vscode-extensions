// jsonmodel-generator.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

import { SUPPORTED_LANGUAGES, getLanguageSpecificOptions, getQuicktypeLanguage, getModelFileName  } from './options/languageSpecificOptions';

// 출력 채널 생성
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  console.log('JSON Model Generator Extension is now active');

  // 출력 채널 초기화
  outputChannel = vscode.window.createOutputChannel('JSON Model Generator');
  context.subscriptions.push(outputChannel);

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

  // 출력 채널 표시
  outputChannel.clear();
  outputChannel.show(true); // true: 출력 채널에 포커스를 맞춥니다.
  outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Generating ${language} model from ${jsonFileName}...`);

  // 프로그레스 표시기로 진행 상황 표시
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Generating ${language} model`,
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0, message: "Starting..." });

    try {
      // 언어별 옵션 가져오기
      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Getting language options for ${language}...`);
      progress.report({ increment: 20, message: "Getting language options..." });
      const languageOptions = await getLanguageSpecificOptions(language, jsonFilePath);

      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Running model generator...`);
      progress.report({ increment: 40, message: "Running generator..." });
      const result = await runModelGenerator(jsonFilePath, outputPath, language, languageOptions);

      progress.report({ increment: 80, message: "Finishing..." });
      
      if (result.success) {
        if (!fs.existsSync(outputPath)) {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Warning: File not found - ${outputPath}`);
          vscode.window.showWarningMessage(`File not found: ${outputPath}, generation may have failed.`);
          return;
        }

        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Success: Model generated at ${outputPath}`);
        progress.report({ increment: 100, message: "Done!" });
        vscode.window.showInformationMessage(`Model generated successfully: ${modelFileName}`);
        const doc = await vscode.workspace.openTextDocument(outputPath);
        await vscode.window.showTextDocument(doc);
      } else {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error: ${result.error}`);
        vscode.window.showErrorMessage(`Failed to generate model: ${result.error}`);
      }
    } catch (error) {
      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : String(error)}`);
      vscode.window.showErrorMessage(`Error generating model: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
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
    try {      const config = vscode.workspace.getConfiguration('jsonModelGenerator');
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
          quicktypeCommand += ` ${key}`;
        } else {
          // 값이 있는 경우 키와 값을 함께 추가
          quicktypeCommand += ` ${key} ${value}`;
        }
      }

      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Running command: ${quicktypeCommand}`);
      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Working directory: ${path.dirname(jsonFilePath)}`);
      
      cp.exec(quicktypeCommand, { cwd: path.dirname(jsonFilePath) }, (error, stdout, stderr) => {
        if (stdout) {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Output:\n${stdout}`);
        }
        
        if (error) {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error: ${error.message}`);
          if (stderr) {
            outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error details:\n${stderr}`);
          }
          resolve({ success: false, error: stderr || error.message });
        } else {
          outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Command executed successfully`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : String(error)}`);
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export function deactivate() {}

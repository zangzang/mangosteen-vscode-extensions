// jsonmodel-generator.ts
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";

import {
  SUPPORTED_LANGUAGES,
  getLanguageSpecificOptions,
  getQuicktypeLanguage,
  getModelFileName,
} from "./options/languageSpecificOptions";
import { detectJsonTypeBySchemaKey } from "./detectJsonTypeBySchemaKey";

/**
 * 파일 경로와 이름에 따라 적절한 소스 언어를 판별합니다.
 * @param filePath 입력 파일 경로
 * @returns 소스 언어 (json, schema, graphql, postman, typescript 등)
 */
function getSrcLang(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  let srcLang: string;
  switch (ext) {
    case ".json":
      srcLang = detectJsonTypeBySchemaKey(filePath);
      break;
    case ".graphql":
    case ".gql":
      srcLang = "graphql";
      break;
    case ".ts":
    case ".tsx":
      srcLang = "typescript";
      break;
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
  return srcLang;
}

// 출력 채널 생성
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  console.log("JSON Model Generator Extension is now active");

  // 출력 채널 초기화
  outputChannel = vscode.window.createOutputChannel("JSON Model Generator");
  context.subscriptions.push(outputChannel);

  // Explorer 컨텍스트 메뉴에 "Generate Model" 명령 등록
  let generateModelCommand = vscode.commands.registerCommand(
    "extension.generateModel",
    async (fileUri: vscode.Uri) => {
      if (!fileUri) {
        // 선택된 파일이 없을 경우 현재 열린 파일 사용
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          fileUri = editor.document.uri;
        } else {
          vscode.window.showErrorMessage("No JSON file selected or open");
          return;
        }
      }

      // JSON 파일인지 확인
      if (path.extname(fileUri.fsPath).toLowerCase() !== ".json") {
        vscode.window.showErrorMessage("Selected file is not a JSON file");
        return;
      }

      try {
        // JSON 파일 내용 읽기
        const fileContent = fs.readFileSync(fileUri.fsPath, "utf8");

        // JSON 형식 검증
        JSON.parse(fileContent);

        // getSrcLang으로 우선 판별
        let detectedSrcLang = getSrcLang(fileUri.fsPath);
        let srcLang = detectedSrcLang;

        // 확장자가 .json일 경우, json인지 schema인지 사용자에게 확인
        if (path.extname(fileUri.fsPath).toLowerCase() === ".json") {
          const jsonTypeChoices = [
            {
              label: `자동 판별: ${
                detectedSrcLang === "schema" ? "JSON Schema" : "JSON Data"
              }`,
              value: detectedSrcLang,
            },
            { label: "JSON Data", value: "json" },
            { label: "JSON Schema", value: "schema" },
          ];
          const jsonTypePick = await vscode.window.showQuickPick(
            jsonTypeChoices,
            {
              placeHolder: "JSON Data 혹은 JSON Schema입니까?",
            }
          );
          if (!jsonTypePick) {
            return;
          }
          srcLang = jsonTypePick.value;
        }

        // 언어 선택 퀵픽 표시
        const selectedLanguage = await vscode.window.showQuickPick(
          SUPPORTED_LANGUAGES,
          {
            placeHolder: "Select target programming language",
          }
        );

        if (!selectedLanguage) {
          return; // 사용자가 취소함
        }

        // 모델 생성
        await generateModelForLanguage(fileUri, selectedLanguage, srcLang);
      } catch (error) {
        if (error instanceof SyntaxError) {
          vscode.window.showErrorMessage("Invalid JSON file");
        } else {
          vscode.window.showErrorMessage(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
  );

  context.subscriptions.push(generateModelCommand);
}

async function generateModelForLanguage(
  jsonUri: vscode.Uri,
  language: string,
  srcLang: string
) {
  const jsonFilePath = jsonUri.fsPath;
  const jsonFileName = path.basename(jsonFilePath, ".json");
  const modelFileName = getModelFileName(jsonFileName, language);
  const outputDir = path.dirname(jsonFilePath);
  const outputPath = path.join(outputDir, modelFileName);

  // 출력 채널 표시
  outputChannel.clear();
  outputChannel.show(true); // true: 출력 채널에 포커스를 맞춥니다.
  outputChannel.appendLine(
    `[${new Date().toLocaleTimeString()}] Generating ${language} model from ${jsonFileName}...`
  );

  // 프로그레스 표시기로 진행 상황 표시
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Generating ${language} model`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0, message: "Starting..." });

      try {
        // 언어별 옵션 가져오기
        outputChannel.appendLine(
          `[${new Date().toLocaleTimeString()}] Getting language options for ${language}...`
        );
        progress.report({
          increment: 20,
          message: "Getting language options...",
        });
        const languageOptions = await getLanguageSpecificOptions(
          language,
          jsonFilePath
        );

        outputChannel.appendLine(
          `[${new Date().toLocaleTimeString()}] Running model generator...`
        );
        progress.report({ increment: 40, message: "Running generator..." });
        const result = await runModelGenerator(
          jsonFilePath,
          outputPath,
          language,
          languageOptions,
          srcLang
        );
        progress.report({ increment: 80, message: "Finishing..." });
        if (result.success) {
          // 파일이 이동되었을 수 있으므로, 최종 출력 경로를 사용합니다
          let actualOutputPath = result.finalOutputPath || outputPath;

          // finalOutputPath가 없으면 사용자 정의 출력 디렉토리를 확인해보고 계산
          if (!result.finalOutputPath && languageOptions["--out"]) {
            actualOutputPath = path.join(
              languageOptions["--out"],
              modelFileName
            );
          }

          if (!fs.existsSync(actualOutputPath)) {
            outputChannel.appendLine(
              `[${new Date().toLocaleTimeString()}] Warning: File not found - ${actualOutputPath}`
            );
            vscode.window.showWarningMessage(
              `File not found: ${actualOutputPath}, generation may have failed.`
            );
            return;
          }

          outputChannel.appendLine(
            `[${new Date().toLocaleTimeString()}] Success: Model generated at ${actualOutputPath}`
          );
          progress.report({ increment: 100, message: "Done!" });
          vscode.window.showInformationMessage(
            `Model generated successfully: ${modelFileName}`
          );
          const doc = await vscode.workspace.openTextDocument(actualOutputPath);
          await vscode.window.showTextDocument(doc);
        } else {
          outputChannel.appendLine(
            `[${new Date().toLocaleTimeString()}] Error: ${result.error}`
          );
          vscode.window.showErrorMessage(
            `Failed to generate model: ${result.error}`
          );
        }
      } catch (error) {
        outputChannel.appendLine(
          `[${new Date().toLocaleTimeString()}] Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        vscode.window.showErrorMessage(
          `Error generating model: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );
}

// 외부 프로세스 실행하여 모델 생성
// quicktype을 사용하여 JSON 스키마를 변환
async function runModelGenerator(
  jsonFilePath: string,
  outputPath: string,
  language: string,
  options: { [key: string]: string },
  srcLang: string
): Promise<{ success: boolean; error?: string; finalOutputPath?: string }> {
  return new Promise((resolve) => {
    try {
      const langCode = getQuicktypeLanguage(language);
      // 설정값 직접 참조 대신 고정 값 사용
      const quicktypeBaseCommand = "npx quicktype";
      const jsonFileName = path.basename(jsonFilePath);
      const outputFileName = path.basename(outputPath);

      // 출력 디렉토리 설정
      const sourceDir = path.dirname(jsonFilePath);
      let targetDir = sourceDir;

      // 사용자 정의 출력 디렉토리가 있는지 확인
      const customOutDir = options["--out"];
      if (customOutDir) {
        // 출력 디렉토리를 저장하고, 명령어에서는 제거
        targetDir = customOutDir;
        delete options["--out"]; // '--out' 옵션 제거
      }

      // getSrcLang 호출 제거, srcLang 파라미터 사용
      outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] Using source language: ${srcLang} for file ${jsonFilePath}`
      );

      // 기본 quicktype 명령어
      let quicktypeCommand = `${quicktypeBaseCommand} --src-lang ${srcLang} --src ${jsonFileName} --lang ${langCode} -o ${outputFileName}`;

      // options 객체의 모든 키-값 쌍을 명령어에 추가
      for (const [key, value] of Object.entries(options)) {
        if (value === "") {
          // 값이 빈 문자열인 경우 키만 추가
          quicktypeCommand += ` ${key}`;
        } else {
          // 값이 있는 경우 키와 값을 함께 추가
          quicktypeCommand += ` ${key} ${value}`;
        }
      }

      outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] Running command: ${quicktypeCommand}`
      );
      outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] Working directory: ${sourceDir}`
      );

      cp.exec(quicktypeCommand, { cwd: sourceDir }, (error, stdout, stderr) => {
        if (stdout) {
          outputChannel.appendLine(
            `[${new Date().toLocaleTimeString()}] Output:\n${stdout}`
          );
        }

        if (error) {
          outputChannel.appendLine(
            `[${new Date().toLocaleTimeString()}] Error: ${error.message}`
          );
          if (stderr) {
            outputChannel.appendLine(
              `[${new Date().toLocaleTimeString()}] Error details:\n${stderr}`
            );
          }
          resolve({ success: false, error: stderr || error.message });
        } else {
          outputChannel.appendLine(
            `[${new Date().toLocaleTimeString()}] Command executed successfully`
          );

          // 사용자 정의 출력 디렉토리가 있고, 소스 디렉토리와 다른 경우에만 파일 이동
          if (customOutDir && sourceDir !== targetDir) {
            try {
              // 생성된 파일의 확장자 결정
              const fileExt = path.extname(outputFileName);

              // 해당 확장자를 가진 모든 파일을 찾아서 이동
              const files = fs
                .readdirSync(sourceDir)
                .filter((file) => path.extname(file) === fileExt);

              if (files.length === 0) {
                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Warning: No ${fileExt} files found to move`
                );
              }

              // 타겟 디렉토리가 존재하는지 확인하고 없으면 생성
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Created output directory: ${targetDir}`
                );
              }

              // 파일 이동
              files.forEach((file) => {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);

                // 파일 복사 후 원본 삭제
                fs.copyFileSync(sourcePath, targetPath);
                fs.unlinkSync(sourcePath);

                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Moved file from ${sourcePath} to ${targetPath}`
                );
              });
              // 출력 경로 업데이트
              outputPath = path.join(targetDir, outputFileName);
            } catch (moveError) {
              outputChannel.appendLine(
                `[${new Date().toLocaleTimeString()}] Error moving files: ${
                  moveError instanceof Error
                    ? moveError.message
                    : String(moveError)
                }`
              );
            }
          }

          resolve({ success: true, finalOutputPath: outputPath });
        }
      });
    } catch (error) {
      outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export function deactivate() {}

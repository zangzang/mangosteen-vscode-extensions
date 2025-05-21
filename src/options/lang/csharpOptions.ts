import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getQuicktypeSettings, getDefaultSettingValue, getSettingEnum } from '../quicktypeSettings';

/**
 * 문자열을 파스칼 케이스로 변환합니다.
 * @param str 변환할 문자열
 * @returns 파스칼 케이스로 변환된 문자열
 */
function toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 입력 파일 경로에서 schema 폴더를 찾고, 해당 폴더를 제외한 경로를 기반으로 출력 디렉토리를 결정합니다.
 * C# 관례에 맞게 출력 폴더명과 네임스페이스를 파스칼 케이스로 변환합니다.
 * @param inputFilePath 입력 파일 경로
 * @returns 출력 디렉토리 경로와 네임스페이스 정보를 포함한 객체 또는 찾을 수 없는 경우 undefined
 */
function getCSharpOutputInfo(inputFilePath: string): { outputDir?: string, namespace?: string } {
    if (!inputFilePath) {
        return {};
    }
    
    // 경로를 정규화
    const normalizedPath = path.normalize(inputFilePath);
    const parts = normalizedPath.split(path.sep);
    
    // schema 위치를 끝에서부터 찾기
    const schemaIdx = parts.findLastIndex(p => p.toLowerCase() === 'schema');
    
    if (schemaIdx === -1) {
        return {}; // schema 폴더가 없으면 빈 객체 반환
    }
    
    // schema 폴더 이후의 경로로 네임스페이스 생성 (파스칼 케이스)
    const namespaceParts = parts.slice(schemaIdx + 1, parts.length - 1);
    const namespace = namespaceParts.length > 0 
        ? namespaceParts.map(toPascalCase).join('.')
        : undefined;
    
    // schema 폴더를 제외한 경로로 출력 디렉토리 생성
    const outputParts = [...parts];
    outputParts.splice(schemaIdx, 1); // schema 폴더 제거
    
    // schema 이후의 폴더들을 파스칼 케이스로 변환
    for (let i = schemaIdx; i < outputParts.length - 1; i++) {
        outputParts[i] = toPascalCase(outputParts[i]);
    }
    
    // 파일 이름 제거하고 디렉토리 경로만 남기기
    const outputDirPath = outputParts.slice(0, outputParts.length - 1).join(path.sep);
    
    return {
        outputDir: outputDirPath,
        namespace: namespace
    };
}

export async function getCSharpOptions(filePath?: string): Promise<{ [key: string]: string }> {
    // C# 설정 불러오기
    const csharpSettings = getQuicktypeSettings("csharp");
    
    // 파일 경로를 기반으로 출력 정보 가져오기
    const outputInfo = filePath ? getCSharpOutputInfo(filePath) : {};
    
    // 출력 디렉토리 설정
    let outputDirectory: string | undefined = outputInfo.outputDir;
    
    // 네임스페이스 설정
    let defaultNamespace = getDefaultSettingValue(csharpSettings, "namespace") || "Models";
    if (outputInfo.namespace) {
        defaultNamespace = outputInfo.namespace;
    }
    
    const namespace = await vscode.window.showInputBox({
        prompt: 'Enter the namespace for the C# model',
        placeHolder: 'e.g., MyNamespace.Models',
        value: defaultNamespace,
        validateInput: (input) => input.trim() === '' ? 'Namespace cannot be empty' : null
    }) || '';

    if (!namespace) {
        vscode.window.showErrorMessage('Namespace is required for C# models');
        throw new Error('Namespace is required');
    }

    // 프레임워크 설정
    const defaultFramework = getDefaultSettingValue(csharpSettings, "framework") || "NewtonSoft";
    const frameworkOptions = getSettingEnum(csharpSettings, "framework") || ["NewtonSoft", "SystemTextJson"];
    const framework = await vscode.window.showQuickPick(frameworkOptions, {
        placeHolder: `Select the JSON framework (default: ${defaultFramework})`,
        canPickMany: false
    }) || defaultFramework;
    
    // 배열 타입 설정
    const defaultArrayType = getDefaultSettingValue(csharpSettings, "arrayType") || "list";
    const arrayTypeOptions = getSettingEnum(csharpSettings, "arrayType") || ["array", "list"];
    const arrayType = await vscode.window.showQuickPick(arrayTypeOptions, {
        placeHolder: `Use T[] or List<T>? (default: ${defaultArrayType})`,
        canPickMany: false
    }) || defaultArrayType;
    
    // 출력 디렉토리 설정 및 확인
    let outputDir = "";
    if (outputDirectory) {
        // 디렉토리가 존재하는지 확인하고, 없으면 생성할지 물어봄
        const dirExists = fs.existsSync(outputDirectory);
        let useOutputDir = "yes";
        
        if (!dirExists) {
            useOutputDir = await vscode.window.showQuickPick(['yes', 'no'], {
                placeHolder: `Output directory '${outputDirectory}' does not exist. Create it?`,
                canPickMany: false
            }) || "no";
            
            if (useOutputDir === "yes") {
                try {
                    // 디렉토리 재귀적으로 생성
                    fs.mkdirSync(outputDirectory, { recursive: true });
                    vscode.window.showInformationMessage(`Created output directory: ${outputDirectory}`);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to create output directory: ${err instanceof Error ? err.message : String(err)}`);
                    useOutputDir = "no";
                }
            }
        }
        
        if (useOutputDir === "yes") {
            outputDir = outputDirectory;
        }
    }
    
    // 결과 객체 생성
    const options: { [key: string]: string } = {};
    
    options['--namespace'] = namespace;
    options['--framework'] = framework;
    options['--array-type'] = arrayType;
    
    // 출력 디렉토리 설정
    if (outputDir) {
        options['--out'] = outputDir;
    }
    
    return options;
}
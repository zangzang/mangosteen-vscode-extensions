import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getQuicktypeSettings, getDefaultSettingValue, getSettingEnum, getSettingType } from '../quicktypeSettings';

function getDefaultJavaPackageName(filePath: string): string {
    // 경로를 분할
    const parts = filePath.split(path.sep);
    const javaIdx = parts.findIndex(p => p.toLowerCase() === 'java');
    if (javaIdx === -1 || javaIdx === parts.length - 1) {
        return '';
    }
    // java 폴더 이후의 경로에서 파일명 제거
    const packageParts = parts.slice(javaIdx + 1, parts.length - 1);
    return packageParts.join('.');
}

/**
 * 입력 파일 경로에서 schema/java 구조를 찾고, 동일한 위치에 main/java 구조로 변환된 출력 경로를 반환합니다.
 * schema 폴더가 java 폴더의 바로 위에 있는 경우에만 변환을 수행합니다.
 * @param inputFilePath 입력 파일 경로
 * @returns 출력 디렉토리 경로 또는 찾을 수 없는 경우 undefined
 */
function getJavaOutputDirectory(inputFilePath: string): string | undefined {
    if (!inputFilePath) {
        return undefined;
    }
    
    // 경로를 정규화
    const normalizedPath = path.normalize(inputFilePath);
    const parts = normalizedPath.split(path.sep);
    
    // schema와 java 위치 찾기
    const schemaIdx = parts.findIndex(p => p.toLowerCase() === 'schema');
    const javaIdx = parts.findIndex(p => p.toLowerCase() === 'java');
    
    // schema와 java가 모두 경로에 존재하는지 확인
    if (schemaIdx === -1 || javaIdx === -1) {
        return undefined;
    }
    
    // java가 schema 바로 다음에 있는지 확인 (schema 폴더가 java 폴더의 바로 위에 있어야 함)
    if (javaIdx !== schemaIdx + 1) {
        return undefined;
    }
    
    // schema를 main으로 변경한 경로 생성
    const outputParts = [...parts];
    outputParts[schemaIdx] = 'main';
    
    // 파일 이름 제거하고 디렉토리 경로만 남기기
    const outputDirPath = outputParts.slice(0, outputParts.length - 1).join(path.sep);
    
    return outputDirPath;
}

export async function getJavaOptions(filePath?: string): Promise<{ [key: string]: string }> {
    // Java 설정 불러오기
    const javaSettings = getQuicktypeSettings("java");
    
    // 출력 디렉토리 설정
    let outputDirectory: string | undefined;
    if (filePath) {
        outputDirectory = getJavaOutputDirectory(filePath);
    }
    
    // 패키지명 설정
    let defaultPackage = getDefaultSettingValue(javaSettings, "package") || "com.example.model";
    if (filePath) {
        const detectedPackage = getDefaultJavaPackageName(filePath);
        if (detectedPackage) {
            defaultPackage = detectedPackage;
        }
    }

    const packageName = await vscode.window.showInputBox({
        prompt: 'Enter the package name for the Java model',
        placeHolder: 'e.g., com.example.models',
        value: defaultPackage,
        validateInput: (input) => input.trim() === '' ? 'Package name cannot be empty' : null
    }) || '';

    if (!packageName) {
        vscode.window.showErrorMessage('Package name is required for Java models');
        throw new Error('Package name is required');
    }

    // 배열 타입 설정
    const defaultArrayType = getDefaultSettingValue(javaSettings, "arrayType") || "list";
    const arrayTypeOptions = getSettingEnum(javaSettings, "arrayType") || ["array", "list"];
    const arrayType = await vscode.window.showQuickPick(arrayTypeOptions, {
        placeHolder: `Use T[] or List<T>? (default: ${defaultArrayType})`,
        canPickMany: false
    }) || defaultArrayType;

    // Lombok 설정
    const defaultLombok = getDefaultSettingValue(javaSettings, "lombok") ? "yes" : "no";
    const useLombok = await vscode.window.showQuickPick(['no','yes'], {
        placeHolder: `Use Lombok? (default: ${defaultLombok})`,
        canPickMany: false
    }) || defaultLombok;

    // Lombok 복사 주석 설정
    let copyAnnotationsOption = '';
    if (useLombok === 'yes') {
        const defaultCopyAnnotations = getDefaultSettingValue(javaSettings, "lombokCopyAnnotations") ? "yes" : "no";
        const copyAnnotations = await vscode.window.showQuickPick(['no', 'yes'], {
            placeHolder: `Copy annotations to Lombok-generated methods? (default: ${defaultCopyAnnotations})`,
            canPickMany: false
        }) || defaultCopyAnnotations;

        copyAnnotationsOption =
            copyAnnotations === "yes"
                ? "--lombok-copy-annotations"
                : "--no-lombok-copy-annotations";
    }    // 출력 디렉토리 설정 및 확인
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
    
    options['--package'] = packageName;
    options[`--array-type`] = arrayType;

    if (useLombok === 'yes') {
        options['--lombok'] = "";
    } else {
        options['--no-lombok'] = "";
    }

    if (copyAnnotationsOption) {
        options[copyAnnotationsOption] = "";
    }
    
    // 출력 디렉토리 설정
    if (outputDir) {
        options['--out'] = outputDir;
    }

    return options;
}
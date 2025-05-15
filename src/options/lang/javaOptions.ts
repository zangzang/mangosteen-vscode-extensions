import * as vscode from 'vscode';
import * as path from 'path';
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

export async function getJavaOptions(filePath?: string): Promise<{ [key: string]: string }> {
    // Java 설정 불러오기
    const javaSettings = getQuicktypeSettings("java");
    
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

    return options;
}
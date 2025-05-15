import * as vscode from 'vscode';
import { getQuicktypeSettings, getDefaultSettingValue, getSettingEnum } from '../quicktypeSettings';

export async function getCSharpOptions(): Promise<{ [key: string]: string }> {
    // C# 설정 불러오기
    const csharpSettings = getQuicktypeSettings("csharp");
    
    // 네임스페이스 설정
    const defaultNamespace = getDefaultSettingValue(csharpSettings, "namespace") || "Models";
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
    
    // 결과 객체 생성
    const options: { [key: string]: string } = {};
    
    options['--namespace'] = namespace;
    options['--framework'] = framework;
    options['--array-type'] = arrayType;
    
    return options;
}
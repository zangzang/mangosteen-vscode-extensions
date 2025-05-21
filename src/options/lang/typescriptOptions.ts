import * as vscode from 'vscode';
import { getQuicktypeSettings, getDefaultSettingValue, getSettingEnum } from '../quicktypeSettings';

export async function getTypeScriptOptions(): Promise<{ [key: string]: string }> {
    // TypeScript 설정 불러오기
    const tsSettings = getQuicktypeSettings("typescript");
    
    // 인터페이스만 생성 여부 설정
    const defaultJustTypes = getDefaultSettingValue(tsSettings, "justTypes") ? "yes" : "no";
    const justTypes = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Interfaces only? (default: ${defaultJustTypes})`,
        canPickMany: false
    }) || defaultJustTypes;
    
    // 런타임 타입체크 설정
    const defaultRuntimeTypecheck = getDefaultSettingValue(tsSettings, "runtimeTypecheck") ? "yes" : "no";
    const runtimeTypecheck = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Verify JSON.parse results at runtime? (default: ${defaultRuntimeTypecheck})`,
        canPickMany: false
    }) || defaultRuntimeTypecheck;
    
    // 속성명 변환 설정
    const defaultNicePropertyNames = getDefaultSettingValue(tsSettings, "nicePropertyNames") ? "yes" : "no";
    const nicePropertyNames = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Transform property names to be JavaScripty? (default: ${defaultNicePropertyNames})`,
        canPickMany: false
    }) || defaultNicePropertyNames;
    
    // 읽기 전용 속성 설정
    const defaultReadonly = getDefaultSettingValue(tsSettings, "readonly") ? "yes" : "no";
    const readonly = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Use readonly type members? (default: ${defaultReadonly})`,
        canPickMany: false
    }) || defaultReadonly;
    
    // 결과 객체 생성
    const options: { [key: string]: string } = {};
    
    // boolean 옵션 설정
    if (justTypes === 'yes') {
        options['--just-types'] = "";
    } else {
        options['--no-just-types'] = "";
    }
    
    if (runtimeTypecheck === 'yes') {
        options['--runtime-typecheck'] = "";
    } else {
        options['--no-runtime-typecheck'] = "";
    }
    
    if (nicePropertyNames === 'yes') {
        options['--nice-property-names'] = "";
    } else {
        options['--no-nice-property-names'] = "";
    }
    
    if (readonly === 'yes') {
        options['--readonly'] = "";
    } else {
        options['--no-readonly'] = "";
    }
    
    return options;
}

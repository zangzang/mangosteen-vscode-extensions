import * as vscode from 'vscode';
import { getQuicktypeSettings, getDefaultSettingValue, getSettingEnum } from '../quicktypeSettings';

export async function getPythonOptions(): Promise<{ [key: string]: string }> {
    // Python 설정 불러오기
    const pySettings = getQuicktypeSettings("python");
    
    // Python 버전 설정
    const defaultPythonVersion = getDefaultSettingValue(pySettings, "pythonVersion") || "3.7";
    const versionOptions = getSettingEnum(pySettings, "pythonVersion") || ["3.5", "3.6", "3.7"];
    const pythonVersion = await vscode.window.showQuickPick(versionOptions, {
        placeHolder: `Select Python version (default: ${defaultPythonVersion})`,
        canPickMany: false
    }) || defaultPythonVersion;
    
    // 클래스만 생성 여부 설정
    const defaultJustTypes = getDefaultSettingValue(pySettings, "justTypes") ? "yes" : "no";
    const justTypes = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Classes only? (default: ${defaultJustTypes})`,
        canPickMany: false
    }) || defaultJustTypes;
    
    // Pythonic 속성명 변환 설정
    const defaultNicePropertyNames = getDefaultSettingValue(pySettings, "nicePropertyNames") ? "yes" : "no";
    const nicePropertyNames = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Transform property names to be Pythonic? (default: ${defaultNicePropertyNames})`,
        canPickMany: false
    }) || defaultNicePropertyNames;
    
    // Pydantic BaseModel 사용 여부
    const defaultPydanticBaseModel = getDefaultSettingValue(pySettings, "pydanticBaseModel") ? "yes" : "no";
    const pydanticBaseModel = await vscode.window.showQuickPick(['no', 'yes'], {
        placeHolder: `Use pydantic BaseModel? (default: ${defaultPydanticBaseModel})`,
        canPickMany: false
    }) || defaultPydanticBaseModel;
    
    // 결과 객체 생성
    const options: { [key: string]: string } = {};
    
    // 버전 설정
    options['--python-version'] = pythonVersion;
    
    // boolean 옵션 설정
    if (justTypes === 'yes') {
        options['--just-types'] = "";
    } else {
        options['--no-just-types'] = "";
    }
    
    if (nicePropertyNames === 'yes') {
        options['--nice-property-names'] = "";
    } else {
        options['--no-nice-property-names'] = "";
    }
    
    if (pydanticBaseModel === 'yes') {
        options['--pydantic-base-model'] = "";
    } else {
        options['--no-pydantic-base-model'] = "";
    }
    
    return options;
}

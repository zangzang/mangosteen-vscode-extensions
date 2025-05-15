import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 설정 파일에서 언어 관련 설정 불러오기
export function getQuicktypeSettings(language: string): any {
    try {
        // 사용자 지정 설정 파일 경로 확인
        const config = vscode.workspace.getConfiguration('jsonModelGenerator');
        const customSettingsPath = config.get('customSettingsPath') as string;
        
        let settingsPath = '';
        if (customSettingsPath && fs.existsSync(customSettingsPath)) {
            settingsPath = customSettingsPath;
        } else {
            // 디버깅/개발 환경에서는 __dirname 사용
            const tryPaths = [
                path.join(__dirname, 'quicktype.settings.json'),
                path.join(__dirname, 'src', 'quicktype.settings.json'),
                path.join(process.cwd(), 'quicktype.settings.json'),
                path.join(process.cwd(), 'src', 'quicktype.settings.json')
            ];
            settingsPath = tryPaths.find(p => fs.existsSync(p)) || '';
        }
        
        // 설정 파일이 없으면 빈 객체 반환
        if (!fs.existsSync(settingsPath)) {
            console.warn(`Settings file not found at: ${settingsPath}`);
            return {};
        }

        // 설정 파일 읽기
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsContent);
        
        // 요청한 언어의 설정 반환
        const langCode = language.toLowerCase();
        if (settings[langCode]) {
            return settings[langCode];
        }
        
        console.warn(`No settings found for language: ${language}`);
        return {};
    } catch (error) {
        console.error(`Error loading quicktype settings: ${error instanceof Error ? error.message : String(error)}`);
        return {};
    }
}

// 설정에서 default 값 가져오기
export function getDefaultSettingValue(settings: any, settingName: string): any {
    if (settings && settings[settingName] && 'default' in settings[settingName]) {
        return settings[settingName].default;
    }
    return null;
}

// 설정의 설명 가져오기
export function getSettingDescription(settings: any, settingName: string): string {
    if (settings && settings[settingName] && 'description' in settings[settingName]) {
        return settings[settingName].description;
    }
    return '';
}

// 설정의 가능한 값 목록 가져오기
export function getSettingEnum(settings: any, settingName: string): string[] | null {
    if (settings && settings[settingName] && 'enum' in settings[settingName]) {
        return settings[settingName].enum;
    }
    return null;
}

// 설정 타입 가져오기
export function getSettingType(settings: any, settingName: string): string {
    if (settings && settings[settingName] && 'type' in settings[settingName]) {
        return settings[settingName].type;
    }
    return 'string';
}

// 설정 값을 quicktype 명령줄 옵션으로 변환
export function convertSettingToOption(settingName: string, value: any, type: string): string {
    // 대시를 추가하여 옵션 이름으로 변환
    const optionName = `--${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    
    // 타입에 따라 적절한 형식으로 변환
    if (type === 'boolean') {
        return value ? optionName : `--no-${settingName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^--/, '')}`;
    } else {
        // 문자열이나 다른 타입은 값과 함께 반환
        return `${optionName} ${value}`;
    }
}

// 언어별 설정에서 명령줄 옵션 생성
export function generateOptionsFromSettings(language: string, userSettings: { [key: string]: any }): { [key: string]: string } {
    const settings = getQuicktypeSettings(language);
    const options: { [key: string]: string } = {};

    // 설정의 각 항목에 대해
    for (const [settingName, settingValue] of Object.entries(userSettings)) {
        const type = getSettingType(settings, settingName);
        
        // boolean 타입인 경우 특별 처리
        if (type === 'boolean') {
            if (settingValue === true) {
                options[`--${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = '';
            } else {
                options[`--no-${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = '';
            }
        } else {
            // 문자열이나 다른 타입은 값과 함께 저장
            options[`--${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = String(settingValue);
        }
    }

    return options;
}

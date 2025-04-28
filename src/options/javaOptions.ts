import * as vscode from 'vscode';

export async function getJavaOptions(): Promise<{ [key: string]: string }> {
    const packageName = await vscode.window.showInputBox({
        prompt: 'Enter the package name for the Java model',
        placeHolder: 'e.g., com.example.models',
        validateInput: (input) => input.trim() === '' ? 'Package name cannot be empty' : null
    }) || '';

    if (!packageName) {
        vscode.window.showErrorMessage('Package name is required for Java models');
        throw new Error('Package name is required');
    }

    const useLombok = await vscode.window.showQuickPick(['no','yes'], {
        placeHolder: 'Use Lombok? (default: no)',
        canPickMany: false
    }) || 'no';

    let copyAnnotationsOption = '';
    if (useLombok === 'yes') {
        const copyAnnotations = await vscode.window.showQuickPick(['no', 'yes'], {
            placeHolder: 'Copy annotations to Lombok-generated methods? (default: no)',
            canPickMany: false
        }) || 'no';

        copyAnnotationsOption = copyAnnotations === 'yes' ? '--lombok-copy-annotations' : '';
    }

    // 옵션이 'yes'일 경우 키만 반환
    const lombokOption = useLombok === 'yes' ? '--lombok' : '';

    // 결과 객체 생성
    const options: { [key: string]: string } = { package: packageName };
    if (lombokOption) {
        options['lombok'] = '';
    }
    if (copyAnnotationsOption) {
        options['lombok-copy-annotations'] = '';
    }

    return options;
}
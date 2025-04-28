import * as vscode from 'vscode';

export async function getCSharpOptions(): Promise<{ [key: string]: string }> {
    const namespace = await vscode.window.showInputBox({
        prompt: 'Enter the namespace for the C# model',
        placeHolder: 'e.g., MyNamespace.Models',
        validateInput: (input) => input.trim() === '' ? 'Namespace cannot be empty' : null
    }) || '';

    if (!namespace) {
        vscode.window.showErrorMessage('Namespace is required for C# models');
        throw new Error('Namespace is required');
    }

    const framework = await vscode.window.showQuickPick(['SystemTextJson', 'NewtonSoft'], {
        placeHolder: 'Select the JSON framework for the C# model',
        canPickMany: false
    }) || 'SystemTextJson';

    return { namespace, framework };
}
import * as vscode from 'vscode';
import {API} from './api/api';
import {Edit} from './content/Edit';
import {DevDocumentContentProvider} from './content/DevDocumentContentProvider';
import {DevTreeDataProvider} from './view/DevTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
		console.log('Congratulations, your extension "vscode-devto" is now active!');

	// let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
	// 	vscode.window.showInformationMessage('Hello World!');
	// });

	// context.subscriptions.push(disposable);

	// devto-explorer
	const apiKey = 'fcaqnKdj3hxdrowfVQAQdA5n';
	// const apiKey = context.globalState.get<string>('apiKey');
	const api = apiKey ? new API(apiKey) : null;
		
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('devto', new DevDocumentContentProvider(api)),
		vscode.commands.registerCommand('devto.edit', Edit.showMarkdown),
		vscode.window.createTreeView('devto', {
			treeDataProvider: new DevTreeDataProvider(context, api),
		})
	);
	
}

export function deactivate() {}

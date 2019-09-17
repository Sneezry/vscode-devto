import * as vscode from 'vscode';
import {ApiKeyManager} from './ApiKeyManager';
import {API} from './api/api';
import {Edit} from './content/Edit';
import {titleParser} from './content/TitleParser';
import {DevArticleVirtualFSProvider} from './content/DevArticleVirtualFSProvider';
import {DevTreeDataProvider} from './view/DevTreeDataProvider';

export async function activate(context: vscode.ExtensionContext) {
	const api = new API();
	const apiKeyManager = new ApiKeyManager(context, api);
	const apiKey = await apiKeyManager.getApiKey();
	if (apiKey) {
		api.updateApiKey(apiKey);
	}
	const treeDataProvider = new DevTreeDataProvider(context, api);
		
	context.subscriptions.push(
		vscode.commands.registerCommand('devto.signin', () => {
			apiKeyManager.updateApiKeyCommand(treeDataProvider.refresh.bind(treeDataProvider));
		}),
		vscode.commands.registerCommand('devto.refresh', async () => {
			if (!api.hasApiKey) {
				return;
			}
			await api.list(true);
			treeDataProvider.refresh();
		}),
		vscode.commands.registerCommand('devto.signout', () => {
			apiKeyManager.removeApiKeyCommand(treeDataProvider.refresh.bind(treeDataProvider));
		}),
		vscode.commands.registerCommand('devto.create', Edit.createNewArticle),
		vscode.workspace.registerFileSystemProvider('devto', new DevArticleVirtualFSProvider(api), { isCaseSensitive: true, isReadonly: false }),
		vscode.commands.registerCommand('devto.edit', Edit.showMarkdown),
		vscode.window.createTreeView('devto', {
			treeDataProvider,
		}),
		vscode.workspace.onDidSaveTextDocument(async (document) => {
			if (document.uri.scheme === 'devto') {
				const markdown = document.getText();
				const title = titleParser(markdown);
				if (title) {
					const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(title) + '.md?' + document.uri.query);
					const doc = await vscode.workspace.openTextDocument(uri);
					await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
					await vscode.window.showTextDocument(doc, { preview: false });
				}
				treeDataProvider.refresh();
			}
		})
	);
}

export function deactivate() {}

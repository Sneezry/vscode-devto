import * as vscode from 'vscode';
import {ApiKeyManager} from './ApiKeyManager';
import {API, Article} from './api/Api';
import {Edit} from './content/Edit';
import {titleParser} from './content/MetaParser';
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
	const devArticleVirtualFSProvider = new DevArticleVirtualFSProvider(api);
		
	context.subscriptions.push(
		vscode.commands.registerCommand('devto.signin', () => {
			apiKeyManager.updateApiKeyCommand(treeDataProvider.refresh.bind(treeDataProvider));
		}),
		vscode.commands.registerCommand('devto.view', (article: Article) => {
			if (article.url) {
				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url));
			}
		}),
		vscode.commands.registerCommand('devto.editOnline', (article: Article) => {
			if (article.url) {
				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url + '/edit'));
			}
		}),
		vscode.commands.registerCommand('devto.publish', async (article: Article) => {
			const markdown = Edit.getPublishedMarkdown(article);
			if (markdown) {
				const title = titleParser(markdown);
				const id = article.id;
				if (!title || !id) {
					return;
				}

				const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(title) + '.md?' + id);
				const doc = await vscode.workspace.openTextDocument(uri);
				const docText = doc.getText();
				const startPosition = new vscode.Position(0, 0);
				const endPosition = doc.positionAt(docText.length);
				const edit = new vscode.WorkspaceEdit();
				const range = new vscode.Range(startPosition, endPosition);
				edit.replace(uri, range, markdown);
				await vscode.window.withProgress({
					title: `Publishing ${title}`,
					location: vscode.ProgressLocation.Notification,
				}, async () => {
					await api.updateList(id, markdown);
					treeDataProvider.refresh();
					await vscode.workspace.applyEdit(edit);
					await doc.save();
				});
			}
		}),
		vscode.commands.registerCommand('devto.delete', (article: Article) => {
			if (article.url) {
				vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url +'/delete_confirm'));
			}
		}),
		vscode.commands.registerCommand('devto.key', () => {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://dev.to/settings/account'));
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
		vscode.workspace.registerFileSystemProvider('devto', devArticleVirtualFSProvider, { isCaseSensitive: true, isReadonly: false }),
		vscode.commands.registerCommand('devto.edit', Edit.showMarkdown),
		vscode.window.createTreeView('devto', {
			treeDataProvider,
		}),
		vscode.workspace.onWillSaveTextDocument(async (event) => {
			const document = event.document;
			if (document.uri.scheme === 'devto') {
				const id = Number(document.uri.query);
				const markdown = document.getText();
				const title = titleParser(markdown);

				if (id > 0) {
					if (title) {
						await api.updateList(id, markdown);
						treeDataProvider.refresh();
						const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(title) + '.md?' + id);
						const doc = await vscode.workspace.openTextDocument(uri);
						await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
						await vscode.window.showTextDocument(doc, { preview: false });
					}
				}
			}
		}),
		vscode.workspace.onDidSaveTextDocument(async (document) => {
			if (document.uri.scheme === 'devto') {
				treeDataProvider.refresh();
			}
		})
	);
}

export function deactivate() {}

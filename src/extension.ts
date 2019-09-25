import * as vscode from 'vscode';
import {ApiKeyManager} from './ApiKeyManager';
import {API, Article} from './api/Api';
import {Edit} from './content/Edit';
import {resourceUriBuilder} from './content/ResourceUriBuilder';
import {DevArticleVirtualFSProvider} from './content/DevArticleVirtualFSProvider';
import {DevTreeDataProvider} from './view/DevTreeDataProvider';

async function getArticleByFileName(fileName: string) {
	const uri = resourceUriBuilder({
    resourcePath: fileName,
    raw: true,
  });
  const articleRaw = (await vscode.workspace.fs.readFile(uri)).toString();
  const article: Article = JSON.parse(articleRaw);
  return article;
}

export async function activate(context: vscode.ExtensionContext) {
  const api = new API();
  const apiKeyManager = new ApiKeyManager(context, api);
  const apiKey = await apiKeyManager.getApiKey();
  if (apiKey) {
    api.updateApiKey(apiKey);
  }
  const treeDataProvider = new DevTreeDataProvider(context, api);
	const devArticleVirtualFSProvider = new DevArticleVirtualFSProvider(api);
	await devArticleVirtualFSProvider.initialize();
    
  context.subscriptions.push(
    vscode.commands.registerCommand('devto.signin', () => {
      apiKeyManager.updateApiKeyCommand(treeDataProvider.refresh.bind(treeDataProvider));
    }),
    vscode.commands.registerCommand('devto.view', async (fileName: string) => {
			const uri = resourceUriBuilder({
				resourcePath: fileName,
				raw: true,
			});
			const articleRaw = (await vscode.workspace.fs.readFile(uri)).toString();
			const article: Article = JSON.parse(articleRaw);
      if (article.url) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url));
      }
    }),
    vscode.commands.registerCommand('devto.editOnline', async (fileName: string) => {
			const article = await getArticleByFileName(fileName);
      if (article.url) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url + '/edit'));
      }
    }),
    vscode.commands.registerCommand('devto.publish', async (fileName: string) => {
      const article = await getArticleByFileName(fileName);
			await vscode.window.withProgress({
        title: `Publishing ${article.title}`,
        location: vscode.ProgressLocation.Notification,
      }, async () => {
        await Edit.publish(article);
        treeDataProvider.refresh();
      });
    }),
    vscode.commands.registerCommand('devto.delete', async (fileName: string) => {
			const article = await getArticleByFileName(fileName);
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
      devArticleVirtualFSProvider.clearCache();
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
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.uri.scheme === 'devto') {
        treeDataProvider.refresh();
      }
    })
  );
}

export function deactivate() {}

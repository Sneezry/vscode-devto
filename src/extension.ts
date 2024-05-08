import * as vscode from 'vscode';
import {DevApiKeyManager} from './ApiKeyManager';
import {DevAPI, Article} from './api/DevApi';
import {Edit} from './content/Edit';
import {resourceUriBuilder} from './content/ResourceUriBuilder';
import {DevArticleVirtualFSProvider} from './content/DevArticleVirtualFSProvider';
import {DevTreeDataProvider} from './view/DevTreeDataProvider';
import {ImageUploadManager} from './ImageUploadManager';
import { TextDecoder } from 'util';

async function getArticleByFileName(fileName: string) {
  const uri = resourceUriBuilder({
    resourcePath: fileName,
    raw: true,
  });
  const decoder = new TextDecoder()
  const articleRaw = decoder.decode(await vscode.workspace.fs.readFile(uri));
  const article: Article = JSON.parse(articleRaw);
  return article;
}

export async function activate(context: vscode.ExtensionContext) {
  const api = new DevAPI();
  const apiKeyManager = new DevApiKeyManager(context, api);
  const apiKey = await apiKeyManager.getApiKey();
  if (apiKey) {
    api.updateApiKey(apiKey);
  }
  const treeDataProvider = new DevTreeDataProvider(api);
  const devArticleVirtualFSProvider = new DevArticleVirtualFSProvider(api);
  await devArticleVirtualFSProvider.initialize();
  
  const uploadImageButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  uploadImageButton.command = 'devto.uploadImage';
  uploadImageButton.text = '$(file-media) Upload images';
  uploadImageButton.tooltip = 'DEV Community: upload images to GitHub';

  const imageUploadManager = new ImageUploadManager(context);

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider('devto', devArticleVirtualFSProvider, { isCaseSensitive: true, isReadonly: false }),
    vscode.commands.registerCommand('devto.signin', async () => {
      await apiKeyManager.updateApiKeyCommand(() => {
        devArticleVirtualFSProvider.clearCache();
        treeDataProvider.refresh();
      });
    }),
    vscode.commands.registerCommand('devto.uploadImage', async () => {
      await imageUploadManager.uploadImage();
    }),
    vscode.commands.registerCommand('devto.updateGitHubPersonalToken', async () => {
      await imageUploadManager.updateGitHubPersonalToken();
      vscode.window.showInformationMessage('Your GitHub personal access token has been updated.');
    }),
    vscode.commands.registerCommand('devto.removeGitHubPersonalToken', async () => {
      await imageUploadManager.removeGitHubPersonalToken();
      vscode.window.showInformationMessage('Your GitHub personal access token has been removed.');
    }),
    vscode.commands.registerCommand('devto.view', async (fileName: string) => {
      const uri = resourceUriBuilder({
        resourcePath: fileName,
        raw: true,
      });
      const decoder = new TextDecoder()
      const articleRaw = decoder.decode(await vscode.workspace.fs.readFile(uri));
      const article: Article = JSON.parse(articleRaw);
      if (article.url) {
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url));
      }
    }),
    vscode.commands.registerCommand('devto.editOnline', async (fileName: string) => {
      const article = await getArticleByFileName(fileName);
      if (article.url) {
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url + '/edit'));
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
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(article.url +'/delete_confirm'));
      }
    }),
    vscode.commands.registerCommand('devto.key', async () => {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://dev.to/settings/extensions#api'));
    }),
    vscode.commands.registerCommand('devto.refresh', () => {
      if (!api.hasApiKey) {
        return;
      }
      devArticleVirtualFSProvider.clearCache();
      treeDataProvider.refresh();
    }),
    vscode.commands.registerCommand('devto.signout', async () => {
      await apiKeyManager.removeApiKeyCommand(treeDataProvider.refresh.bind(treeDataProvider));
    }),
    vscode.commands.registerCommand('devto.create', Edit.createNewArticle),
    vscode.commands.registerCommand('devto.edit', Edit.showMarkdown),
    vscode.window.createTreeView('devto', {
      treeDataProvider,
    }),
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.uri.scheme === 'devto') {
        treeDataProvider.refresh();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.uri.scheme === 'devto') {
        uploadImageButton.show();
      } else {
        uploadImageButton.hide();
      }
    }),
    uploadImageButton
  );
}

export function deactivate() {}

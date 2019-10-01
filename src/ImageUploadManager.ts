import * as vscode from 'vscode';
import {GitHubAPI} from './api/GitHubApi';
import * as path from 'path';

export class ImageUploadManager {
  private _personalToken: string|undefined;
  private _gitHubAPI: GitHubAPI;

  constructor(private _context: vscode.ExtensionContext) {
    this._personalToken = this._getGitHubPersonalToken();
    this._gitHubAPI = new GitHubAPI(this._personalToken);
  }

  private _getGitHubPersonalToken() {
    const token = this._context.globalState.get<string>('devto:gitHubToken');
    return token;
  }

  async updateGitHubPersonalToken() {
    const personalToken = this._getGitHubPersonalToken();
    const newPersonalToken = await vscode.window.showInputBox({
      value: personalToken,
      prompt: 'GitHub personal access token',
      ignoreFocusOut: true,
    });

    if (newPersonalToken === undefined) {
      return undefined;
    }

    await this._context.globalState.update('devto:gitHubToken', newPersonalToken);
    return newPersonalToken;
  }

  async removeGitHubPersonalToken() {
    await this._context.globalState.update('devto:gitHubToken', '');
  }

  async uploadImage() {
    if (!this._personalToken) {
      this._personalToken = await this.updateGitHubPersonalToken();

      if (!this._personalToken) {
        return;
      }

      this._gitHubAPI.updatePersonalToken(this._personalToken);
    }

    const imageFileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: {
        'Images': ['png', 'jpg', 'gif', 'bmp', 'webp', 'svg'],
      }
    });

    if (imageFileUri) {
      const uri = imageFileUri[0];
      const imageFileName = path.basename(uri.fsPath);
      vscode.window.withProgress({
        title: `Uploading ${imageFileName}`,
        location: vscode.ProgressLocation.Notification,
      }, async () => {
        const response = await this._gitHubAPI.upload(uri);
        const url = response.content.download_url;
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.uri.scheme === 'devto') {
          const position = editor.selection.active;
          const snippet = new vscode.SnippetString(`![](${url})`);
          editor.insertSnippet(snippet, position);
        }
      });
    }
  }
}
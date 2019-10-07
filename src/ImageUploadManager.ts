import * as vscode from 'vscode';
import {GitHubAPI} from './api/GitHubApi';
import {ImgurAPI} from './api/ImgurApi';
import * as path from 'path';

export class ImageUploadManager {
  private _gitHubAPI: GitHubAPI;

  constructor(private _context: vscode.ExtensionContext) {
    const personalToken = this._getGitHubPersonalToken();
    this._gitHubAPI = new GitHubAPI(personalToken);
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
    const imageFileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: {
        'Images': ['png', 'jpg', 'gif', 'bmp', 'webp', 'svg'],
      }
    });

    if (imageFileUri) {
      const personalToken = this._getGitHubPersonalToken();
      const uri = imageFileUri[0];
      const imageFileName = path.basename(uri.fsPath);
      vscode.window.withProgress({
        title: `Uploading ${imageFileName} to ${personalToken ? 'GitHub' : 'Imgur'}`,
        location: vscode.ProgressLocation.Notification,
      }, async () => {
        let url:string;

        if (!personalToken) {
          const response = await ImgurAPI.upload(uri);
          url = response.data.link;
        } else {
          const response = await this._gitHubAPI.upload(uri);
          url = response.content.download_url;
        }
        
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
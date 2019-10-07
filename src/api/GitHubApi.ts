import * as rq from 'request-promise';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface GitHubUserInfo {
  login: string;
}

interface UploadResonse {
  content: {
    download_url: string;
  };
}

const DEFAULT_REPO_NAME = '_dev_community_post_images_';
const DEFAULT_REPO_DESCRIPTION = 'Auto created by DEV Community VS Code extension.';

export class GitHubAPI {
  constructor(private _personalToken?: string) {}

  private _userInfo: GitHubUserInfo|undefined;

  private _isRepoExist: {[repoName: string]: boolean} = {};

  private _buildRequestOptions(path: string, method: string, parameters?: {[key: string]: string|number}, body?: any) {
    let uri = `https://api.github.com${path}`;
    if (parameters) {
      let query: string[] = [];
      for (const parameterKey of Object.keys(parameters)) {
        query.push(`${parameterKey}=${parameters[parameterKey]}`);
      }
      uri += `?${query.join('&')}`;
    }
    const options: rq.Options =  {
      uri,
      headers: {
        'User-Agent': 'vscode-devto;https://marketplace.visualstudio.com/items?itemName=sneezry.vscode-devto',
        'Authorization': `token ${this._personalToken}`,
      },
      method,
      json: true,
    };

    if (body) {
      options.body = body;
    }

    return options;
  }

  get hasToken() {
    return !!this._personalToken;
  }

  updatePersonalToken(personalToken: string) {
    this._personalToken = personalToken;
  }

  private async _getUserInfo() {
    if (this._userInfo) {
      return this._userInfo;
    }
    const options = this._buildRequestOptions('/user', 'GET');
    const response: GitHubUserInfo = await rq(options);
    this._userInfo = response;
    return response;
  }

  private async _createRepo(repoName: string, repoDescription: string) {
    const options = this._buildRequestOptions('/user/repos', 'POST', undefined, {
      name: repoName,
      description: repoDescription,
      has_issues: false,
      has_wiki: false,
      auto_init: true,
    });

    const response = await rq(options);
    return response;
  }

  private async _getRepo(repoName: string) {
    const userInfo = await this._getUserInfo();
    const options = this._buildRequestOptions(`/repos/${userInfo.login}/${repoName}`, 'GET');
    const response = await rq(options);
    return response;
  }

  private async _ensureRepo(repoName: string, repoDescription: string) {
    if (this._isRepoExist[repoName]) {
      return;
    }
    try {
      await this._getRepo(repoName);
    } catch(error) {
      await this._createRepo(repoName, repoDescription);
    }
    this._isRepoExist[repoName] = true
  }

  private async _readFileAsBase64(uri: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(uri.fsPath, {encoding: 'base64'}, (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      });
    });
  }

  async upload(uri: vscode.Uri) {
    await this._ensureRepo(DEFAULT_REPO_NAME, DEFAULT_REPO_DESCRIPTION);
    const userInfo = await this._getUserInfo();
    const imageFileName = path.basename(uri.fsPath).replace(/\.([^\.]*?)$/, `.${Date.now().toString(36)}.$1`);
    const imageFileContent = await this._readFileAsBase64(uri);
    const options = this._buildRequestOptions(`/repos/${userInfo.login}/${DEFAULT_REPO_NAME}/contents/${imageFileName}`, 'PUT', undefined, {
      message: `Upload ${imageFileName}`,
      content: imageFileContent,
    });
    const response: UploadResonse = await rq(options);
    return response;
  }
}
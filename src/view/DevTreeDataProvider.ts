import * as vscode from 'vscode';
import * as path from 'path';
import {Article, API} from '../api/api';

export class DevTreeDataProvider implements vscode.TreeDataProvider<Article> {
  constructor(private _context: vscode.ExtensionContext, private _api: API) {}

  private onDidChangeTreeDataEvent: vscode.EventEmitter<null> = new vscode.EventEmitter<null>();
  public readonly onDidChangeTreeData: vscode.Event<null> = this.onDidChangeTreeDataEvent.event;

  refresh() {
    this.onDidChangeTreeDataEvent.fire();
  }

  getChildren() {
    if (this._api.hasApiKey) {
      return this._api.list();
    } else {
      return [{
        id: 0,
        title: 'Sign in',
      }, {
        id: -1,
        title: 'Create API key',
      }];
    }
  }

  getTreeItem(article: Article): vscode.TreeItem {
    let command: vscode.Command;
    if (article.id === 0) {
      command = {
        title: 'Sign in',
        command: 'devto.signin',
      };
    } else if (article.id === -1) {
      command = {
        title: 'Create API key',
        command: 'devto.key',
      };
    } else {
      command = {
        title: 'Edit',
        command: 'devto.edit',
        arguments: [article],
      }
    }

    return {
      label: article.title,
      id: `dev-${article.id}`,
      iconPath: (article.id && article.id > 0 ? this._context.asAbsolutePath(path.join('resources', `${article.published ? 'published' : 'unpublished'}.svg`)) : undefined),
      command,
    };
  }
}
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
      }];
    }
  }

  getTreeItem(artical: Article): vscode.TreeItem {
    let command: vscode.Command;
    if (artical.id === 0) {
      command = {
        title: 'Sign in',
        command: 'devto.signin',
      };
    } else {
      command = {
        title: 'Edit',
        command: 'devto.edit',
        arguments: [artical],
      }
    }

    return {
      label: artical.title,
      id: `dev-${artical.id}`,
      iconPath: this._context.asAbsolutePath(path.join('resources', `${artical.published ? 'published' : 'unpublished'}.svg`)),
      command,
    };
  }
}
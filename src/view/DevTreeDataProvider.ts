import * as vscode from 'vscode';
import * as path from 'path';
import {Article, API} from '../api/api';

export class DevTreeDataProvider implements vscode.TreeDataProvider<Article> {
  constructor(private context: vscode.ExtensionContext, private api: API|null) {}

  private async _editArticle(id: number) {
    if (!this.api) {
      return;
    }
    const articleList = await this.api.list();
    const article = articleList.find((item) => {
      return item.id === id;
    });
    if (!article) {
      return;
    }

    let uri = vscode.Uri.parse('devto:' + id);
    let doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: true });
  }

  getChildren() {
    if (this.api) {
      return this.api.list();
    } else {
      return [{
        id: 0,
        title: 'Sign in',
      }];
    }
  }

  getTreeItem(artical: Article): vscode.TreeItem {
    return {
      label: artical.title,
      id: `dev-${artical.id}`,
      iconPath: this.context.asAbsolutePath(path.join('resources', `${artical.published ? 'published' : 'unpublished'}.svg`)),
      command: {
        title: 'Edit',
        command: 'devto.edit',
        arguments: [vscode.Uri.parse('devto:' + artical.id)],
      }
    };
  }
}
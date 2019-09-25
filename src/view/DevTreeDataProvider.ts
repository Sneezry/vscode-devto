import * as vscode from 'vscode';
import * as path from 'path';
import {Article, API} from '../api/Api';
import {resourceUriBuilder} from '../content/ResourceUriBuilder';

export class DevTreeDataProvider implements vscode.TreeDataProvider<string> {
  constructor(private _context: vscode.ExtensionContext, private _api: API) {}

  private onDidChangeTreeDataEvent: vscode.EventEmitter<null> = new vscode.EventEmitter<null>();
  public readonly onDidChangeTreeData: vscode.Event<null> = this.onDidChangeTreeDataEvent.event;

  refresh() {
    this.onDidChangeTreeDataEvent.fire();
  }

  async getChildren() {
    if (this._api.hasApiKey) {
      const uri = resourceUriBuilder();
      const fileList = await vscode.workspace.fs.readDirectory(uri);
      return fileList.map((item) => {
        return item[0];
      });
    } else {
      return ['Sign in', 'Create API key'];
    }
  }

  async getTreeItem(fileName: string): Promise<vscode.TreeItem> {
    let command: vscode.Command;
    if (fileName === 'Sign in') {
      command = {
        title: 'Sign in',
        command: 'devto.signin',
      };
    } else if (fileName === 'Create API key') {
      command = {
        title: 'Create API key',
        command: 'devto.key',
      };
    } else {
      command = {
        title: 'Edit',
        command: 'devto.edit',
        arguments: [fileName],
      }
    }

    const uri = resourceUriBuilder({
      resourcePath: fileName,
      raw: true,
    });
    const articleRaw = (await vscode.workspace.fs.readFile(uri)).toString();
    const article: Article = JSON.parse(articleRaw);
    const commentCount = article.comments_count || 0;
    const positiveReactionsCount = article.positive_reactions_count || 0;
    const commentMeta = commentCount + (commentCount !== 1 ? ' comments' : ' comment');
    const positiveReactionsMeta = positiveReactionsCount + (positiveReactionsCount !== 1 ? ' reactions' : ' reaction');

    const treeItem: vscode.TreeItem = {
      label: article.title,
      tooltip: article.title + ' ・ ' + commentMeta + ' ・ ' + positiveReactionsMeta,
      id: `dev-${article.id}`,
      command,
    };

    if (article.id && article.id > 0 && !article.published) {
      treeItem.tooltip += ' ・ Unpublished';
      treeItem.contextValue = 'unpublished';
      treeItem.iconPath = this._context.asAbsolutePath(path.join('resources', 'draft.svg'));
    }

    return treeItem;
  }
}
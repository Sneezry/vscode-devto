import * as vscode from 'vscode';
import * as path from 'path';
import {Article, API} from '../api/Api';

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
      treeItem.iconPath = this._context.asAbsolutePath(path.join('resources', 'draft.svg'));
    }

    return treeItem;
  }
}
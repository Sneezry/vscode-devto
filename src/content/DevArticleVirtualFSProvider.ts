import * as vscode from 'vscode';
import {API} from '../api/Api';
import {titleParser, publishStateParser} from './MetaParser';

const emptyArray = new Uint8Array(0);

export class DevArticleVirtualFSProvider implements vscode.FileSystemProvider {
  private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

  constructor(private api: API) {}

  get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  watch(): vscode.Disposable {
    return {
      dispose: () => {
        // nothing to dispose
      }
    };
  }

  // no need to support dir
  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    return [];
  }

  // no need to support dir
  createDirectory(uri: vscode.Uri) {}

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (!this.api.hasApiKey) {
      return emptyArray;
    }

    const id = Number(uri.query);
    if (id < 0) {
      const buffer = Buffer.from(`---
title: Hello, World!
published: false
tags: discuss, help
date: 20190701T10:00Z
series: Hello series
canonical_url: https://example.com/blog/hello
cover_image: https://mywebsite.com/article_published_cover_image.png
---

`, 'utf8');
      return new Uint8Array(buffer);
    }

    const articleList = await this.api.list();
    const article = articleList.find((item) => {
      return item.id === id;
    });

    if (!article || !article.body_markdown) {
      return emptyArray;
    }

    const buffer = Buffer.from(article.body_markdown, 'utf8');
    return new Uint8Array(buffer);
  }

  // nothing to delete
  delete(uri: vscode.Uri, options: { recursive: boolean }) {}

  async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }) {
    const markdown = content.toString();
    const title = titleParser(markdown);
    const published = publishStateParser(markdown);
    if (title) {
      await vscode.window.withProgress({
        title: 'Saving ' + title,
        location: vscode.ProgressLocation.Notification,
      }, async () => {
        const id = Number(uri.query);
        let realId: number|undefined;
        try {
          if (id < 0) {
            const article = await this.api.create(title, markdown);
            realId = article.id as number;
            if (published) {
              await this.api.updateList(id, undefined, realId);
            } else {
              await this.api.list(true);
            }
            const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(title) + '.md?' + realId);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            await vscode.window.showTextDocument(doc, { preview: false });
          } else {
            await this.api.updateList(id, markdown);
            await this.api.update(id, title, markdown);
          }
        } catch(error) {
          vscode.window.showWarningMessage('Failed to save \'' + title + '\'.md: ' + error.message);
        }
      });
    } else {
      vscode.window.showWarningMessage('Failed to save \'' + title + '\'.md: Title is required.');
    }
  }

  // nothing to rename
  rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }) {}

  stat(uri: vscode.Uri) {
    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: 0,
      size: 0,
    };
  }
}
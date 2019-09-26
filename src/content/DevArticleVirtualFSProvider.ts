import * as vscode from 'vscode';
import {Article, API} from '../api/Api';
import {titleParser, publishStateParser} from './MetaParser';
import {resourceUriBuilder} from '../content/ResourceUriBuilder';

const emptyArray = new Uint8Array(0);

export class DevArticleVirtualFSProvider implements vscode.FileSystemProvider {
  private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _articleList: Article[] = [];
  private _articleListCached = false;

  constructor(private api: API) {}

  async initialize() {
    this._articleListCached = true;
    this._articleList = await this.api.list();
  }

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

  clearCache() {
    this._articleList = [];
    this._articleListCached = false;
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    if (/^[\\\/]$/.test(uri.path)) {
      if (!this._articleListCached) {
        this._articleListCached = true;
        this._articleList = await this.api.list();
      }

      return this._articleList.map((article) => {
        return [encodeURIComponent(article.title) + '-0' + article.id + '.md', vscode.FileType.File];
      });
    }
    return [];
  }

  // no need to support dir
  createDirectory(uri: vscode.Uri) {}

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (!this.api.hasApiKey) {
      return emptyArray;
    }

    const idMatched = uri.path.match(/0([\-]?[1-9]\d*)\.md$/);
    const id = idMatched ? Number(idMatched[1]) : 0;
    if (id < 0) {
      const buffer = Buffer.from(`---
title: 
published: false
description: 
tags: 
---

`, 'utf8');
      return new Uint8Array(buffer);
    }

    const article = this._articleList.find((item) => {
      return item.id === id;
    });

    if (!article || !article.body_markdown) {
      return emptyArray;
    }

    const buffer = uri.query === 'raw' ? 
        Buffer.from(JSON.stringify(article), 'utf8') :
        Buffer.from(article.body_markdown, 'utf8');
    return new Uint8Array(buffer);
  }

  async delete(uri: vscode.Uri, options: { recursive: boolean }) {
    const idMatched = uri.path.match(/0([\-]?[1-9]\d*)\.md$/);
    const id = idMatched ? Number(idMatched[1]) : 0;
    const article = this._articleList.find((article) => {
      return article.id === id;
    });

    if (article) {
      article.reserveTitle = undefined;
    };
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }) {
    const markdown = content.toString();
    const title = titleParser(markdown);
    const published = publishStateParser(markdown);
    const idMatched = uri.path.match(/0([\-]?[1-9]\d*)\.md$/);
    const id = idMatched ? Number(idMatched[1]) : 0;
    const titleMatched = uri.path.match(/^[\\\/]?(.*?)\-0[\-]?[1-9]\d*\.md/);
    const oldTitle = decodeURIComponent(titleMatched ? titleMatched[1] : '');

    if (title) {
      if (id < 0) {
        const article: Article = {
          id,
          title,
          body_markdown: markdown,
          published: published,
        };
        this._articleList.unshift(article);
      }
      await vscode.window.withProgress({
        title: 'Saving ' + title + '-0' + id + '\'.md',
        location: vscode.ProgressLocation.Notification,
      }, async () => {
        try {
          let newArticle: Article;
          if (id < 0) {
            newArticle = await this.api.create(title, markdown);
          } else {
            newArticle = await this.api.update(id, title, markdown);
          }
          // published property is missing in single update request response
          if (newArticle.published === undefined) {
            newArticle.published = published;
          }
          
          const newPostIndex = this._articleList.findIndex((article) => {
            return article.id === id;
          });
          
          const newUri = resourceUriBuilder({
            title: newArticle.title,
            id: newArticle.id,
          });

          newArticle.title = oldTitle;
          newArticle.reserveTitle = oldTitle;
          this._articleList[newPostIndex] = newArticle;
          setTimeout(() => {
            vscode.workspace.fs.rename(uri, newUri);
          }, 0);
        } catch(error) {
          vscode.window.showWarningMessage('Failed to save \'' + title + '-0' + id + '\'.md: ' + error.message);
        }
      });
    } else {
      vscode.window.showWarningMessage('😱 Heads up: title can\'t be blank.');
    }
  }

  async rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }) {
    const idMatched = newUri.path.match(/0([\-]?[1-9]\d*)\.md$/);
    const id = idMatched ? Number(idMatched[1]) : 0;
    const titleMatched = newUri.path.match(/^[\\\/]?(.*?)\-0[\-]?[1-9]\d*\.md/);
    const title = decodeURIComponent(titleMatched ? titleMatched[1] : '');

    const article = this._articleList.find((article) => {
      return article.id === id;
    });

    if (article) {
      article.title = title;
    }
  }

  async stat(uri: vscode.Uri) {
    if (/^[\\\/]$/.test(uri.path)) {
      return {
        type: vscode.FileType.Directory,
        ctime: 0,
        mtime: 0,
        size: 0,
      }
    }

    const idMatched = uri.path.match(/0([\-]?[1-9]\d*)\.md$/);
    const id = idMatched ? Number(idMatched[1]) : 0;
    const titleMatched = uri.path.match(/^[\\\/]?(.*?)\-0[\-]?[1-9]\d*\.md/);
    const title = decodeURIComponent(titleMatched ? titleMatched[1] : '');
    const article = this._articleList.find((article) => {
      return article.id === id;
    });

    if (id > 0 && (!article || article.title !== title &&  article.reserveTitle !== title)) {
      throw vscode.FileSystemError.FileNotFound();
    }

    return {
      type: vscode.FileType.File,
      ctime: 0,
      mtime: 0,
      size: 0,
    };
  }
}
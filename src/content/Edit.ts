import * as vscode from 'vscode';
import {Article} from '../api/Api';
import {publishStateParser} from './MetaParser';

export class Edit {
  static async showMarkdown(article: Article) {
    const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(article.title) + '.md?' + article.id);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: true });
  }

  static async createNewArticle() {
    const uri = vscode.Uri.parse('devto://article/Untitled.md?-' + Date.now());
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: true });
  }

  static getPublishedMarkdown(article: Article) {
    let markdown = article.body_markdown;
    if (!markdown) {
      return;
    }
    const published = publishStateParser(markdown);
    if (published) {
      return;
    }
    const yaml = markdown.match(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/);
    if (!yaml) {
      return;
    }
    const publishedState = yaml[1].match(/^\s*published:\s*(.*?)\s*$/m);
    if (!publishedState) {
      markdown = markdown.replace(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/, '---\n$1\npublished: true\n---');
    } else {
      markdown = markdown.replace(/^\s*published:\s*(.*?)\s*$/m, 'published: true');
    }

    return markdown;
  }
}
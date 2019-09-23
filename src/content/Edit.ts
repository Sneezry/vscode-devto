import * as vscode from 'vscode';
import {Article} from '../api/Api'

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
}
import * as vscode from 'vscode';
import {Article} from '../api/api'

export class Edit {
  static async showMarkdown(article: Article) {
    const uri = vscode.Uri.parse('devto://article/' + encodeURIComponent(article.title) + '.md?' + article.id);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  static async createNewArticle() {
    const uri = vscode.Uri.parse('devto://article/Untitled.md?-1');
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: true });
  }
}
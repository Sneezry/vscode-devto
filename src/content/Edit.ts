import * as vscode from 'vscode';

export class Edit {
  static async showMarkdown(id: number) {
    const uri = vscode.Uri.parse('devto:' + id);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
  }
}
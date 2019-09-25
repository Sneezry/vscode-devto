import * as vscode from 'vscode';
import {Article} from '../api/Api';
import {publishStateParser, titleParser} from './MetaParser';
import {resourceUriBuilder} from './ResourceUriBuilder';

export class Edit {
  static async showMarkdown(fileName: string) {
    const uri = resourceUriBuilder({resourcePath: fileName});
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: true });
  }

  static async createNewArticle() {
    const uri = resourceUriBuilder({
      title: 'Untitled',
      id: -Date.now(),
    });
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

  static async publish(article: Article) {
    const markdown = Edit.getPublishedMarkdown(article);
    if (markdown) {
      const title = titleParser(markdown);
      const id = article.id;
      if (!title || !id) {
        return;
      }

      const uri = resourceUriBuilder({title, id});
      const doc = await vscode.workspace.openTextDocument(uri);
      const docText = doc.getText();
      const startPosition = new vscode.Position(0, 0);
      const endPosition = doc.positionAt(docText.length);
      const edit = new vscode.WorkspaceEdit();
      const range = new vscode.Range(startPosition, endPosition);
      edit.replace(uri, range, markdown);
      await vscode.workspace.applyEdit(edit);
      await doc.save();
    }
  }
}
import * as vscode from 'vscode';
import {API} from '../api/api';

export class DevDocumentContentProvider implements vscode.TextDocumentContentProvider {
  eventEmitter = new vscode.EventEmitter<vscode.Uri>();

  constructor(private api: API|null) {}
  
  provideTextDocumentContent(uri: vscode.Uri): string {
    return JSON.stringify(uri);
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this.eventEmitter.event;
  }
}
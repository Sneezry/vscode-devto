import * as vscode from 'vscode';
import {API} from './api/api';

export class ApiKeyManager {
  constructor(private _context: vscode.ExtensionContext, private _api: API) {}

  async updateApiKey(apiKey: string) {
    await this._context.globalState.update('devto:apiKey', apiKey);
    return apiKey;
  }

  async getApiKey() {
    const apiKey = this._context.globalState.get<string>('devto:apiKey');
    if (apiKey) {
      await vscode.commands.executeCommand(
        'setContext',
        'devto:authorized',
        true
      );
    } else {
      await vscode.commands.executeCommand(
        'setContext',
        'devto:authorized',
        false
      );
    }
    return apiKey;
  }

  async updateApiKeyCommand(callback: () => void) {
    const apiKey = await this.getApiKey();
    const newApiKey = await vscode.window.showInputBox({
      value: apiKey,
      prompt: 'DEV Community API key',
      ignoreFocusOut: true,
    });

    if (newApiKey !== undefined) {
      await this.updateApiKey(newApiKey);
      this._api.updateApiKey(newApiKey);
      if (newApiKey) {
        await vscode.commands.executeCommand(
          'setContext',
          'devto:authorized',
          true
        );
      } else {
        await vscode.commands.executeCommand(
          'setContext',
          'devto:authorized',
          false
        );
      }
      callback();
    }
  }

  async removeApiKeyCommand(callback: () => void) {
    await this.updateApiKey('');
    this._api.updateApiKey('');
    await vscode.commands.executeCommand(
      'setContext',
      'devto:authorized',
      false
    );
    callback();
  }
}
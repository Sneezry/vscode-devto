import * as vscode from 'vscode';
import * as fs from 'fs';
import * as rq from 'request-promise';

export interface ImgurUploadResponse {
  data: {
    link: string;
  };
}

const CLIENT_ID = '7ad656873cab190';

export class ImgurAPI {
  private static async _readFileAsBase64(uri: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(uri.fsPath, {encoding: 'base64'}, (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      });
    });
  }

  static async upload(uri: vscode.Uri) {
    const imageFileContent = await ImgurAPI._readFileAsBase64(uri);
    const options: rq.Options =  {
      uri: 'https://api.imgur.com/3/upload',
      headers: {
        'User-Agent': 'vscode-devto;https://marketplace.visualstudio.com/items?itemName=sneezry.vscode-devto',
        'Authorization': `Client-ID ${CLIENT_ID}`,
      },
      method: 'POST',
      json: true,
      formData: {
        image: imageFileContent,
        type: 'base64',
      },
    };

    const response: ImgurUploadResponse = await rq(options);
    return response;
  }
}
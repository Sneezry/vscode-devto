import * as vscode from 'vscode';

export function resourceUriBuilder(options?: {
  resourcePath?: string,
  title?: string,
  id?: number,
  raw?: boolean}) {
  const baseUri = 'devto://article/';
  let uriString: string;
  if (options && !options.resourcePath && options.title && options.id) {
    options.resourcePath = encodeURIComponent(options.title + '-0' + options.id) + '.md';
  }
  
  if (options && options.resourcePath) {
    uriString = baseUri + options.resourcePath
    if (options.raw) {
      uriString += '?raw';
    }
  } else {
    uriString = baseUri;
  }

  return vscode.Uri.parse(uriString);
}
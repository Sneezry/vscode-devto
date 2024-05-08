import * as vscode from 'vscode';

export function titleParser(markdown: string, url?: vscode.Uri) {
  const yaml = markdown.match(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/);
  if (!yaml) {
    if (url) {
      const titleMatched = url.path.match(/^[\\\/]?(.*?)\-0[\-]?[1-9]\d*\.md/);
      const title = decodeURIComponent(titleMatched ? titleMatched[1] : '');
      return title;
    }

    return null;
  }
  const title = yaml[1].match(/^[ \t]*title:[ \t]*(.*?)[ \t]*$/m);
  if (!title) {
    return null;
  }

  return decodeURIComponent(title[1]);
}

export function publishStateParser(markdown: string) {
  const yaml = markdown.match(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/);
  if (!yaml) {
    return false;
  }
  const published = yaml[1].match(/^[ \t]*published:[ \t]*(.*?)[ \t]*$/m);
  if (!published) {
    return false;
  }

  return published[1] === 'true';
}
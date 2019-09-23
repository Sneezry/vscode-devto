export function titleParser(markdown: string) {
  const yaml = markdown.match(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/);
  if (!yaml) {
    return null;
  }
  const title = yaml[1].match(/^\s*title:\s*(.*?)\s*$/m);
  if (!title) {
    return null;
  }

  return title[1];
}

export function publishStateParser(markdown: string) {
  const yaml = markdown.match(/^\s*\-{3}\n([\s\S]*?)\n\-{3}/);
  if (!yaml) {
    return false;
  }
  const published = yaml[1].match(/^\s*published:\s*(.*?)\s*$/m);
  if (!published) {
    return false;
  }

  return published[1] === 'true';
}
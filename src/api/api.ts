import * as rq from 'request-promise';

export interface Article {
  id?: number;
  title: string;
  body_markdown?: string;
  published?: boolean;
}

export class API {
  constructor(private _apiKey?: string) {}

  private _buildRequestOptions(path: string, method: string, parameters?: {[key: string]: string|number}, artical?: Article) {
    let uri = `https://dev.to/api${path}`;
    if (parameters) {
      let query: string[] = [];
      for (const parameterKey of Object.keys(parameters)) {
        query.push(`${parameterKey}=${parameters[parameterKey]}`);
      }
      uri += `?${query.join('&')}`;
    }
    const options: rq.Options =  {
      uri,
      headers: {
        'api-key': this._apiKey,
      },
      method,
      json: true,
    };

    if (artical) {
      options.body = artical;
    }

    return options;
  }

  private async _list(page: number) {
    const options = this._buildRequestOptions('/articles/me/all', 'GET', {page});
    const response: Article[] = await rq(options);
    return response;
  }

  private _articleList: Article[]|null = null;

  get hasApiKey() {
    return !!this._apiKey;
  }

  updateApiKey(apiKey: string) {
    this._apiKey = apiKey;
  }

  async list(skipCache = false) {
    if (!skipCache && this._articleList) {
      return this._articleList;
    }

    const articleList: Article[] = [];
    let page = 1;
    let responseList: Article[];
    do {
      responseList = await this._list(page);
      for (const response of responseList) {
        articleList.push({
          id: response.id,
          title: response.title,
          body_markdown: response.body_markdown,
          published: response.published,
        });
      }
      page++;
    } while(responseList.length > 0);

    this._articleList = articleList;
    return articleList;
  }

  async update(id: number, title: string, bodyMarkdown: string) {
    const options = this._buildRequestOptions('/articles/' + id, 'PUT', undefined, {title, body_markdown: bodyMarkdown});
    const response: Article = await rq(options);
    return response;
  }

  async create(title: string, bodyMarkdown: string) {
    const options = this._buildRequestOptions('/articles', 'POST', undefined, {title, body_markdown: bodyMarkdown});
    const response: Article = await rq(options);
    return response;
  }
}

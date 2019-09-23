import * as rq from 'request-promise';
import {titleParser, publishStateParser} from '../content/MetaParser';

export interface Article {
  id?: number;
  title: string;
  body_markdown?: string;
  published?: boolean;
  url?: string;
  comments_count?: number;
  positive_reactions_count?: number;
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
        articleList.push(response);
      }
      page++;
    } while(responseList.length > 0);

    this._articleList = articleList;
    return articleList;
  }

  async get(id: number) {
    const options = this._buildRequestOptions('/articles/' + id, 'GET');
    const response: Article = await rq(options);
    return response;
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

  async updateList(id: number, markdown?: string, realId?: number) {
    if (isNaN(id) || id < 0 || !this._articleList) {
      return this.list(true);
    }

    const updatedIndex = this._articleList.findIndex((item) => {
      return item.id === id;
    });

    if (markdown) {
      const title = titleParser(markdown) as string;
      const published = publishStateParser(markdown);
      if (updatedIndex !== -1) {
        this._articleList[updatedIndex].body_markdown = markdown;
        this._articleList[updatedIndex].title = title as string;
        this._articleList[updatedIndex].published = published;
      } else {
        this._articleList.push({
          id,
          title,
          body_markdown: markdown,
          published,
        });
      }
    } else {
      let sliceIndex = -1;
      if (realId) {
        sliceIndex = this._articleList.findIndex((item) => {
          return item.id === id;
        });
        id = realId;
      }
      const updatedArticle = await this.get(id);
      if (updatedIndex !== -1) {
        this._articleList[updatedIndex] = updatedArticle;
      } else {
        this._articleList.push(updatedArticle);
      }

      if (sliceIndex !== -1) {
        this._articleList.splice(sliceIndex, 1);
      }
    }

    return this._articleList;
  }
}

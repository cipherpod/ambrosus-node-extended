import { injectable } from 'inversify';

import { MongoPagedResult } from '../query/mongo-paged-result.model';
import { APIResponseMeta } from './api-res-meta.model';
import { APIResponsePagination } from './api-res-pagination.model';
import { HttpResponseMessage, HttpContent, JsonContent } from 'inversify-express-utils';

export interface IAPIResponse {
  meta: APIResponseMeta;
  pagination: APIResponsePagination;
  data: any;
}

@injectable()
export class APIResponse extends HttpResponseMessage {
  public static fromMongoPagedResult(mongoPagedResult: MongoPagedResult): APIResponse {
    const pagination = APIResponsePagination.fromMongoPagedResult(mongoPagedResult);
    const meta = new APIResponseMeta();
    let data = undefined;
    if (mongoPagedResult.results) {
      meta.code = 200;
      meta.count = mongoPagedResult.results.length;
      data = mongoPagedResult.results;
    } else {
      meta.code = 400;
      meta.message = 'No results found';
      data = [];
    }
    return new APIResponse(data, meta, pagination);
  }

  public static fromSingleResult(result: any): APIResponse {
    const meta = new APIResponseMeta();
    let data = undefined;

    if (result) {
      meta.code = 200;
      data = result;
    } else {
      meta.code = 400;
      meta.message = 'No results found';
      data = {};
    }
    return new APIResponse(data, meta);
  }

  public static withMeta(code: number, message?: string): APIResponse {
    const meta = new APIResponseMeta();
    meta.code = code;
    meta.message = message;
    return new APIResponse(undefined, meta);
  }

  constructor(_data: any, _meta: APIResponseMeta, _pagination?: APIResponsePagination) {
    super(_meta.code);
    this.content = new JsonContent({
      data: _data,
      meta: _meta,
      pagination: _pagination,
    });
  }
}

import { inject, injectable } from 'inversify';

import { TYPE } from '../../constant';
import { APIQuery, APIResult, Asset, Bundle } from '../../model';
import { DBClient } from '../client';
import { BaseRepository } from './base.repository';

@injectable()
export class AssetRepository extends BaseRepository<Asset> {
  constructor(@inject(TYPE.DBClient) protected client: DBClient) {
    super(client, 'assets');
  }

  get timestampField(): any {
    return 'content.idData.timestamp';
  }

  public find(apiQuery: APIQuery): Promise<APIResult> {
    return super.find(
      apiQuery.query,
      apiQuery.fields,
      apiQuery.paginationField,
      apiQuery.sortAscending,
      apiQuery.limit,
      apiQuery.next,
      apiQuery.previous
    );
  }

  public findOne(apiQuery: APIQuery): Promise<Asset> {
    return super.findOne(apiQuery.query, apiQuery.options);
  }
}

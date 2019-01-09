import { inject, injectable } from 'inversify';

import { TYPE, Permission } from '../constant';
import {
  AccountRepository,
  AssetRepository,
  BundleRepository,
  EventRepository
} from '../database/repository';
import { NotFoundError, PermissionError } from '../errors';
import { ILogger } from '../interface/logger.inferface';
import { APIQuery, UserPrincipal } from '../model';
import { AccountService } from '../service/account.service';

@injectable()
export class AnalyticsService {

  constructor(
    @inject(TYPE.UserPrincipal) private readonly user: any,
    @inject(TYPE.AccountService)
    private readonly accountService: AccountService,
    @inject(TYPE.AccountRepository) private readonly account: AccountRepository,
    @inject(TYPE.AssetRepository) private readonly asset: AssetRepository,
    @inject(TYPE.EventRepository) private readonly event: EventRepository,
    @inject(TYPE.BundleRepository) private readonly bundle_metadata: BundleRepository,
    @inject(TYPE.LoggerService) private readonly logger: ILogger
  ) { }

  public count(collection: string): Promise<number> {
    if (!this[collection]) {
      throw new NotFoundError({ reason: 'No such data' });
    }
    return this[collection].count(new APIQuery());
  }

  public async countLimitedByOrganization(
    organizationId: number,
    collection: string
  ): Promise<number> {
    if (
      !this.user.hasPermission(Permission.super_account) &&
      !(this.user.hasAnyPermission(Permission.manage_accounts) && this.user.organization.organizationId === organizationId)
    ) {
      throw new PermissionError({ reason: 'Unauthorized' });
    }

    if (!this[collection]) {
      throw new NotFoundError({ reason: 'No such data' });
    }
    const addresses = await this.accountService.getOrganizationAddresses(
      organizationId
    );
    const apiQuery = new APIQuery();

    // TODO: 'content.idData.createdBy' works only for events/assets.
    apiQuery.query = { 'content.idData.createdBy': { $in: addresses } };
    return this[collection].count(apiQuery);
  }

  public countForTimeRangeWithAggregate(collection, groupBy, start, end) {
    const apiQuery = new APIQuery();
    apiQuery.query = [
      {
        $match: {
          [this[collection].timestampField]: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy,
              date: {
                $toDate: {
                  $multiply: [
                    1000,
                    { $toLong: `$${this[collection].timestampField}` },
                  ],
                },
              },
            },
          },
          count: {
            $sum: 1.0,
          },
        },
      },
      {
        $project: {
          _id: 0.0,
          timestamp: `$_id`,
          count: 1.0,
        },
      },
      {
        $sort: {
          timestamp: 1.0,
        },
      },
    ];
    return this[collection].aggregate(apiQuery);
  }

  // TODO: Fix code smell, combine these endpoints handle org limits dynamically
  public async countForTimeRangeWithAggregateLimitedByOrganization(
    organizationId,
    collection,
    groupBy,
    start,
    end
  ) {
    if (
      !this.user.hasPermission(Permission.super_account) &&
      !(this.user.hasAnyPermission(Permission.manage_accounts) && this.user.organization.organizationId === organizationId)
    ) {
      throw new PermissionError({ reason: 'Unauthorized' });
    }

    const addresses = await this.accountService.getOrganizationAddresses(
      organizationId
    );

    const apiQuery = new APIQuery();
    apiQuery.query = [
      {
        $match: {
          'content.idData.createdBy': { $in: addresses },
          [this[collection].timestampField]: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy,
              date: {
                $toDate: {
                  $multiply: [
                    1000,
                    { $toLong: `$${this[collection].timestampField}` },
                  ],
                },
              },
            },
          },
          count: {
            $sum: 1.0,
          },
        },
      },
      {
        $project: {
          _id: 0.0,
          timestamp: `$_id`,
          count: 1.0,
        },
      },
      {
        $sort: {
          timestamp: 1.0,
        },
      },
    ];
    return this[collection].aggregate(apiQuery);
  }

  public countForTimeRange(
    collection: string,
    start: number,
    end: number
  ): Promise<number> {
    const apiQuery = new APIQuery();
    apiQuery.query = {
      [this[collection].timestampField]: { $gte: start, $lte: end },
    };
    return this[collection].count(apiQuery);
  }

  public async countForTimeRangeLimitedByOrganization(
    organizationId: number,
    collection: string,
    start: number,
    end: number
  ): Promise<number> {
    if (
      !this.user.hasPermission(Permission.super_account) &&
      !(this.user.hasAnyPermission(Permission.manage_accounts) && this.user.organization.organizationId === organizationId)
    ) {
      throw new PermissionError({ reason: 'Unauthorized' });
    }

    const addresses = await this.accountService.getOrganizationAddresses(
      organizationId
    );

    const apiQuery = new APIQuery();
    // TODO: 'content.idData.createdBy' works only for events/assets.
    apiQuery.query = {
      'content.idData.createdBy': { $in: addresses },
      [this[collection].timestampField]: { $gte: start, $lte: end },
    };
    return this[collection].count(apiQuery);
  }
}

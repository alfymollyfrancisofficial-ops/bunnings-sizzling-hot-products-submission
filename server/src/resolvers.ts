import { SalesAggregationService } from './services/SalesAggregationService';

export interface GraphQLContext {
  salesService: SalesAggregationService;
}

// Brief specifies "today" is 23/04/2026.
const DEFAULT_END_DATE = '23/04/2026';
const DEFAULT_WINDOW_DAYS = 3;

export const resolvers = {
  Query: {
    dailyTopProductHistory: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.salesService.getTopProductPerDay(),

    topProductForPeriod: (
      _: unknown,
      args: { endDate?: string; days?: number },
      ctx: GraphQLContext
    ) => ctx.salesService.getTopProductOverPeriod(
      args.endDate ?? DEFAULT_END_DATE,
      args.days ?? DEFAULT_WINDOW_DAYS,
    ),
  },
};

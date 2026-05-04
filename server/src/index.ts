import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import path from 'path';

import { typeDefs } from './schema';
import { resolvers, GraphQLContext } from './resolvers';
import { SalesAggregationService } from './services/SalesAggregationService';
import { JsonOrderRepository, JsonProductRepository } from './services/repositories';

// Wire everything up here. This is the only place that knows about
// concrete repository implementations - everything else uses interfaces.
async function main() {
  const inputsDir = path.resolve(__dirname, '../../inputs');
  const orderRepo = new JsonOrderRepository(path.join(inputsDir, 'orders.json'));
  const productRepo = new JsonProductRepository(path.join(inputsDir, 'products.json'));
  const salesService = new SalesAggregationService(orderRepo, productRepo);

  const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT ?? 4000) },
    context: async () => ({ salesService }),
  });

  console.log(`GraphQL ready at ${url}`);
}

main().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

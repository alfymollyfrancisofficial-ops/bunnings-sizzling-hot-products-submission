import path from 'path';
import { SalesAggregationService } from './services/SalesAggregationService';
import { JsonOrderRepository, JsonProductRepository } from './services/repositories';

// Same logic as the GraphQL server, plain text output.
// Useful for quickly verifying results match the brief without
// needing to start Apollo or run the mobile app.

const inputsDir = path.resolve(__dirname, '../../inputs');
const orderRepo = new JsonOrderRepository(path.join(inputsDir, 'orders.json'));
const productRepo = new JsonProductRepository(path.join(inputsDir, 'products.json'));
const service = new SalesAggregationService(orderRepo, productRepo);

const history = service.getTopProductPerDay();
const period = service.getTopProductOverPeriod('23/04/2026', 3);

console.log('\nTop product per day');
console.log('-------------------');
for (const day of history) {
  const name = day.product?.productName ?? '(no sales)';
  const sales = day.product?.sales ?? 0;
  console.log(`  ${day.date}  ${name}  (${sales})`);
}

console.log(`\nTop product, ${period.startDate} to ${period.endDate}`);
console.log('-----------------------------------------');
console.log(`  ${period.product?.productName ?? '(no sales)'}  (${period.product?.sales ?? 0})\n`);

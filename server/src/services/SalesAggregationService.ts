import {
  Order,
  ProductSalesResult,
  DailyTopProduct,
  PeriodTopProduct,
} from '../domain/types';
import { IOrderRepository, IProductRepository } from './repositories';
import { parseDate, getDateWindow } from '../utils/date';

/*
 * The four rules from the brief:
 *   1. Quantity doesn't matter - one order = one sale per product.
 *   2. Same customer + product + day across multiple orders = one sale.
 *   3. Cancellations remove the original order's sale (from its original date).
 *   4. Tie-break on alphabetical product name (ascending).
 *
 * Rules 1 and 2 fall out of using a Set keyed by `productId|customerId`
 * inside each day's bucket - duplicates collapse on insertion.
 *
 * Rule 3: I checked the sample data - cancellation records share the
 * same orderId as their original. So I do a first pass to collect every
 * cancelled orderId, then skip those in the main pass. Documented in
 * the README under Assumptions.
 */
export class SalesAggregationService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository
  ) {}

  // Returns date -> Set of "productId|customerId" tokens, after rules 1, 2, 3.
  private effectiveSalesByDate(orders: Order[]): Map<string, Set<string>> {
    const cancelledOrderIds = new Set<string>();
    for (const o of orders) {
      if (o.status === 'cancelled') cancelledOrderIds.add(o.orderId);
    }

    const byDate = new Map<string, Set<string>>();
    for (const o of orders) {
      if (o.status !== 'completed') continue;
      if (cancelledOrderIds.has(o.orderId)) continue;
      if (!o.entries || !o.customerId) continue;

      let bucket = byDate.get(o.date);
      if (!bucket) {
        bucket = new Set<string>();
        byDate.set(o.date, bucket);
      }
      for (const e of o.entries) {
        bucket.add(`${e.id}|${o.customerId}`);
      }
    }
    return byDate;
  }

  private countByProduct(saleSet: Set<string>): Map<string, number> {
    const counts = new Map<string, number>();
    for (const token of saleSet) {
      const productId = token.split('|', 1)[0];
      counts.set(productId, (counts.get(productId) ?? 0) + 1);
    }
    return counts;
  }

  // Pick winner with rule 4 tiebreak. Returns null when no sales.
  private resolveTop(counts: Map<string, number>): ProductSalesResult | null {
    if (counts.size === 0) return null;

    const ranked: ProductSalesResult[] = [];
    for (const [productId, sales] of counts) {
      const product = this.productRepo.getById(productId);
      ranked.push({
        productId,
        productName: product?.name ?? `Unknown product (${productId})`,
        sales,
      });
    }

    ranked.sort((a, b) => {
      if (b.sales !== a.sales) return b.sales - a.sales;
      return a.productName.localeCompare(b.productName);
    });

    return ranked[0];
  }

  getTopProductPerDay(): DailyTopProduct[] {
    const orders = this.orderRepo.getAll();
    const sales = this.effectiveSalesByDate(orders);

    const dates = Array.from(sales.keys()).sort(
      (a, b) => parseDate(a).getTime() - parseDate(b).getTime()
    );

    return dates.map(date => ({
      date,
      product: this.resolveTop(this.countByProduct(sales.get(date)!)),
    }));
  }

  getTopProductOverPeriod(endDate: string, days: number): PeriodTopProduct {
    const orders = this.orderRepo.getAll();
    const sales = this.effectiveSalesByDate(orders);
    const window = getDateWindow(endDate, days);
    const inWindow = new Set(window);

    const totals = new Map<string, number>();
    for (const [date, saleSet] of sales) {
      if (!inWindow.has(date)) continue;
      for (const [productId, count] of this.countByProduct(saleSet)) {
        totals.set(productId, (totals.get(productId) ?? 0) + count);
      }
    }

    return {
      startDate: window[0],
      endDate: window[window.length - 1],
      product: this.resolveTop(totals),
    };
  }
}

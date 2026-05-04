import { SalesAggregationService } from '../src/services/SalesAggregationService';
import { IOrderRepository, IProductRepository } from '../src/services/repositories';
import { Order, Product } from '../src/domain/types';

// In-memory repos for fast tests.
class InMemoryOrderRepo implements IOrderRepository {
  constructor(private readonly orders: Order[]) {}
  getAll() { return this.orders; }
}

class InMemoryProductRepo implements IProductRepository {
  private byId: Map<string, Product>;
  constructor(private readonly products: Product[]) {
    this.byId = new Map(products.map(p => [p.id, p]));
  }
  getAll() { return this.products; }
  getById(id: string) { return this.byId.get(id); }
}

const PRODUCTS: Product[] = [
  { id: 'P1', name: 'Hammer' },
  { id: 'P2', name: 'BBQ' },
  { id: 'P3', name: 'Drill' },
  { id: 'P4', name: 'Saw' },
];

const productRepo = new InMemoryProductRepo(PRODUCTS);

const buildService = (orders: Order[]) =>
  new SalesAggregationService(new InMemoryOrderRepo(orders), productRepo);

describe('SalesAggregationService', () => {
  describe('rule 1 - quantity is ignored', () => {
    it('order of 5 hammers counts as one sale', () => {
      const orders: Order[] = [{
        orderId: 'O1', customerId: 'C1',
        entries: [{ id: 'P1', quantity: 5 }],
        date: '21/04/2026', status: 'completed',
      }];
      const result = buildService(orders).getTopProductPerDay();
      expect(result).toEqual([
        { date: '21/04/2026', product: { productId: 'P1', productName: 'Hammer', sales: 1 } },
      ]);
    });

    it('multi-product order = one sale per product, regardless of quantity', () => {
      const orders: Order[] = [{
        orderId: 'O1', customerId: 'C1',
        entries: [
          { id: 'P1', quantity: 5 },
          { id: 'P2', quantity: 99 },
        ],
        date: '21/04/2026', status: 'completed',
      }];
      const result = buildService(orders).getTopProductPerDay();
      // tied at 1, alphabetical wins -> BBQ before Hammer
      expect(result[0].product?.productName).toBe('BBQ');
      expect(result[0].product?.sales).toBe(1);
    });
  });

  describe('rule 2 - dedup by (customer, product, day)', () => {
    it('two orders by same customer for same product on same day = one sale', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 2 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C1', entries: [{ id: 'P1', quantity: 3 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.sales).toBe(1);
    });

    it('different customers = no dedup', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.sales).toBe(2);
    });

    it('same customer/product but different days = no dedup', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '22/04/2026', status: 'completed' },
      ];
      const svc = buildService(orders);
      expect(svc.getTopProductPerDay()).toHaveLength(2);
      expect(svc.getTopProductOverPeriod('23/04/2026', 3).product?.sales).toBe(2);
    });
  });

  describe('rule 3 - cancellations remove the original sale', () => {
    it('credits the cancellation against the original date, not the cancellation date', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 2 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O1', date: '22/04/2026', status: 'cancelled' },
      ];
      // 21st should now be empty
      expect(buildService(orders).getTopProductPerDay()).toEqual([]);
    });

    it('only removes the matching orderId', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O1', date: '22/04/2026', status: 'cancelled' },
      ];
      // O2 still stands -> 1 sale of P1
      expect(buildService(orders).getTopProductPerDay()[0].product?.sales).toBe(1);
    });
  });

  describe('rule 4 - alphabetical tiebreak', () => {
    it('picks BBQ over Hammer when sales are tied', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P2', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.productName).toBe('BBQ');
    });

    it('picks Drill over Saw', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P3', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P4', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.productName).toBe('Drill');
    });
  });

  describe('period aggregation', () => {
    it('sums daily counts across the inclusive window', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P1', quantity: 1 }], date: '22/04/2026', status: 'completed' },
        { orderId: 'O3', customerId: 'C3', entries: [{ id: 'P2', quantity: 1 }], date: '23/04/2026', status: 'completed' },
      ];
      const result = buildService(orders).getTopProductOverPeriod('23/04/2026', 3);
      expect(result.startDate).toBe('21/04/2026');
      expect(result.endDate).toBe('23/04/2026');
      expect(result.product?.productName).toBe('Hammer');
      expect(result.product?.sales).toBe(2);
    });

    it('ignores days outside the window', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '20/04/2026', status: 'completed' },
        { orderId: 'O2', customerId: 'C2', entries: [{ id: 'P2', quantity: 1 }], date: '23/04/2026', status: 'completed' },
      ];
      // window is 21,22,23 - so the 20th is excluded
      expect(buildService(orders).getTopProductOverPeriod('23/04/2026', 3).product?.productName).toBe('BBQ');
    });
  });

  describe('edge cases', () => {
    it('empty input -> empty history', () => {
      expect(buildService([]).getTopProductPerDay()).toEqual([]);
    });

    it('no sales in window -> null product', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '01/01/2020', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductOverPeriod('23/04/2026', 3).product).toBeNull();
    });

    it('cancellation with no matching original is harmless', () => {
      const orders: Order[] = [
        { orderId: 'GHOST', date: '22/04/2026', status: 'cancelled' },
      ];
      expect(buildService(orders).getTopProductPerDay()).toEqual([]);
    });

    it('skips orders missing entries or customerId without crashing', () => {
      const orders: Order[] = [
        { orderId: 'BAD', date: '21/04/2026', status: 'completed' } as Order,
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'P1', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.sales).toBe(1);
    });

    it('uses placeholder name for products missing from catalogue', () => {
      const orders: Order[] = [
        { orderId: 'O1', customerId: 'C1', entries: [{ id: 'UNKNOWN', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      ];
      expect(buildService(orders).getTopProductPerDay()[0].product?.productName).toMatch(/Unknown product/);
    });
  });

  // Sanity check that exercises all four rules in one dataset against
  // the same answers the brief shows in its outcomes table.
  describe('end-to-end against brief expected outcomes', () => {
    const products: Product[] = [
      { id: 'EZY', name: 'Ezy Storage 37L Flexi Laundry Basket - White' },
      { id: 'ARLEC', name: 'Arlec 160W Crystalline Solar Foldable Charging Kit' },
      { id: 'OZITO', name: 'Ozito 18V Cordless Drill' },
    ];
    const repo = new InMemoryProductRepo(products);

    const orders: Order[] = [
      // day 1
      { orderId: 'O100', customerId: 'C1', entries: [{ id: 'EZY', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      { orderId: 'O101', customerId: 'C2', entries: [{ id: 'EZY', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      { orderId: 'O102', customerId: 'C3', entries: [{ id: 'OZITO', quantity: 1 }], date: '21/04/2026', status: 'completed' },
      // day 2 - O110 gets cancelled, demonstrating rule 3
      { orderId: 'O110', customerId: 'C1', entries: [{ id: 'OZITO', quantity: 1 }], date: '22/04/2026', status: 'completed' },
      { orderId: 'O110', date: '22/04/2026', status: 'cancelled' },
      { orderId: 'O111', customerId: 'C2', entries: [{ id: 'EZY', quantity: 1 }], date: '22/04/2026', status: 'completed' },
      { orderId: 'O112', customerId: 'C3', entries: [{ id: 'EZY', quantity: 1 }], date: '22/04/2026', status: 'completed' },
      // day 3
      { orderId: 'O120', customerId: 'C1', entries: [{ id: 'ARLEC', quantity: 1 }], date: '23/04/2026', status: 'completed' },
      { orderId: 'O121', customerId: 'C2', entries: [{ id: 'ARLEC', quantity: 1 }], date: '23/04/2026', status: 'completed' },
      { orderId: 'O122', customerId: 'C3', entries: [{ id: 'OZITO', quantity: 1 }], date: '23/04/2026', status: 'completed' },
    ];

    const svc = new SalesAggregationService(new InMemoryOrderRepo(orders), repo);

    it('per-day winners match', () => {
      const days = svc.getTopProductPerDay();
      expect(days[0].product?.productName).toBe('Ezy Storage 37L Flexi Laundry Basket - White');
      expect(days[1].product?.productName).toBe('Ezy Storage 37L Flexi Laundry Basket - White');
      expect(days[2].product?.productName).toBe('Arlec 160W Crystalline Solar Foldable Charging Kit');
    });

    it('3-day window winner matches', () => {
      expect(svc.getTopProductOverPeriod('23/04/2026', 3).product?.productName)
        .toBe('Ezy Storage 37L Flexi Laundry Basket - White');
    });
  });
});

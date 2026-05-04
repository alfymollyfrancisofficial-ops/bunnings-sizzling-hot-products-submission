// Shared types. No framework imports here so the same definitions
// can be used from the GraphQL resolvers, the CLI, and the tests.

export type OrderStatus = 'completed' | 'cancelled';

export interface OrderEntry {
  id: string;          // product id
  quantity: number;
}

export interface Order {
  orderId: string;
  customerId?: string; // not present on cancellation records
  entries?: OrderEntry[];
  date: string;        // DD/MM/YYYY
  status: OrderStatus;
}

export interface Product {
  id: string;
  name: string;
}

export interface ProductSalesResult {
  productId: string;
  productName: string;
  sales: number;
}

export interface DailyTopProduct {
  date: string;
  product: ProductSalesResult | null;
}

export interface PeriodTopProduct {
  startDate: string;
  endDate: string;
  product: ProductSalesResult | null;
}

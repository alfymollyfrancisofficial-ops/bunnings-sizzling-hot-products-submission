import fs from 'fs';
import path from 'path';
import { Order, Product } from '../domain/types';

// Behind interfaces so we can swap JSON for a DB later, and so tests
// can use in-memory stubs (see tests/).

export interface IOrderRepository {
  getAll(): Order[];
}

export interface IProductRepository {
  getAll(): Product[];
  getById(id: string): Product | undefined;
}

export class JsonOrderRepository implements IOrderRepository {
  private cache?: Order[];

  constructor(private readonly filePath: string) {}

  getAll(): Order[] {
    if (this.cache) return this.cache;
    const raw = fs.readFileSync(path.resolve(this.filePath), 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected an array of orders in ${this.filePath}`);
    }
    this.cache = parsed as Order[];
    return this.cache;
  }
}

export class JsonProductRepository implements IProductRepository {
  private cache?: Product[];
  private byId?: Map<string, Product>;

  constructor(private readonly filePath: string) {}

  getAll(): Product[] {
    if (this.cache) return this.cache;
    const raw = fs.readFileSync(path.resolve(this.filePath), 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected an array of products in ${this.filePath}`);
    }
    this.cache = parsed as Product[];
    this.byId = new Map(this.cache.map(p => [p.id, p]));
    return this.cache;
  }

  getById(id: string): Product | undefined {
    if (!this.byId) this.getAll();
    return this.byId!.get(id);
  }
}

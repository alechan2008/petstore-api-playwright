import { Order, OrderStatus } from '../../api/models/order.types';

interface BuildOrderOptions {
  id: number;
  petId: number;
  quantity?: number;
  status?: OrderStatus;
  complete?: boolean;
  shipDate?: string;
}

export class OrderBuilder {
  static build(options: BuildOrderOptions): Order {
    const {
      id,
      petId,
      quantity = 1,
      status = 'placed',
      complete = true,
      shipDate = new Date().toISOString(),
    } = options;

    // Defaults are intentionally simple so endpoint and E2E tests
    // can build readable orders with minimal setup.
    return {
      id,
      petId,
      quantity,
      shipDate,
      status,
      complete,
    };
  }
}
import { APIRequestContext, APIResponse } from '@playwright/test';
import { Order } from '../models/order.types';

export class StoreApi {
  constructor(private readonly request: APIRequestContext) {}

  // This class keeps store-related endpoints centralized and readable.
  async createOrder(payload: Order): Promise<APIResponse> {
    return this.request.post('store/order', {
      data: payload,
    });
  }
}
import { test, expect, TestInfo } from '@playwright/test';
import { StoreApi } from '../../../src/api/objects/store.api';
import { IdGenerator } from '../../../src/utils/id-generator';
import { OrderBuilder } from '../../../src/data/builders/order.builder';
import { Order } from '../../../src/api/models/order.types';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should create an order for a valid pet id', async ({ request }, testInfo) => {
  const storeApi = new StoreApi(request);
  const idGenerator = new IdGenerator();

  // A known public pet id keeps this endpoint test independent from the E2E flows.
  const petId = 1;
  const orderId = idGenerator.generateSequentialId(201);

  const orderPayload = OrderBuilder.build({
    id: orderId,
    petId,
    quantity: 1,
    status: 'placed',
    complete: true,
  });

  await attachJson(testInfo, 'run-context', {
    runId: idGenerator.getRunId(),
    orderId,
    petId,
  });

  await attachJson(testInfo, 'order-payload', orderPayload);

  const response = await storeApi.createOrder(orderPayload);
  expect(response.status()).toBe(200);

  const createdOrder = (await response.json()) as Order;

  await attachJson(testInfo, 'created-order', createdOrder);

expect(createdOrder.id).toBe(orderPayload.id);
expect(createdOrder.petId).toBe(orderPayload.petId);
expect(createdOrder.quantity).toBe(orderPayload.quantity);
expect(createdOrder.status).toBe(orderPayload.status);
expect(createdOrder.complete).toBe(orderPayload.complete);
expect(typeof createdOrder.shipDate).toBe('string');
expect(createdOrder.shipDate.length).toBeGreaterThan(0);

// The API may serialize the same UTC instant with a different timezone format,
// so the assertion compares the normalized timestamp value instead of the raw string.
expect(Number.isNaN(new Date(createdOrder.shipDate).getTime())).toBe(false);
expect(new Date(createdOrder.shipDate).getTime()).toBe(new Date(orderPayload.shipDate).getTime());
});
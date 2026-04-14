import { test, expect, TestInfo } from '@playwright/test';
import { PetApi } from '../../../src/api/objects/pet.api';
import { StoreApi } from '../../../src/api/objects/store.api';
import { IdGenerator } from '../../../src/utils/id-generator';
import { Pet } from '../../../src/api/models/pet.types';
import { Order } from '../../../src/api/models/order.types';
import { OrderBuilder } from '../../../src/data/builders/order.builder';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should list 5 available pets and create one order for each of them', async ({ request }, testInfo) => {
  test.setTimeout(90_000);

  const petApi = new PetApi(request);
  const storeApi = new StoreApi(request);
  const idGenerator = new IdGenerator();

  let selectedAvailablePets: Pet[] = [];
  const createdOrders: Order[] = [];

  await attachJson(testInfo, 'run-context', {
    runId: idGenerator.getRunId(),
    selectedPetsTarget: 5,
  });

  await test.step('List available pets and keep the first 5 valid ones', async () => {
    const response = await petApi.findPetsByStatus('available');
    expect(response.status()).toBe(200);

    const availablePets = (await response.json()) as Pet[];

    expect(Array.isArray(availablePets)).toBe(true);
    expect(availablePets.length).toBeGreaterThanOrEqual(5);

    // Keep the first five pets that have a numeric id,
    // since the order creation depends on a valid petId.
    selectedAvailablePets = availablePets.filter((pet) => typeof pet.id === 'number').slice(0, 5);

    await attachJson(testInfo, 'available-pets-response', availablePets);
    await attachJson(testInfo, 'selected-available-pets', selectedAvailablePets);

    expect(selectedAvailablePets).toHaveLength(5);

    const uniqueSelectedPetIds = new Set(selectedAvailablePets.map((pet) => pet.id));
    expect(uniqueSelectedPetIds.size).toBe(5);

    for (const pet of selectedAvailablePets) {
      expect(pet.status).toBe('available');
      expect(typeof pet.id).toBe('number');
      expect(typeof pet.name).toBe('string');
      expect(pet.name.length).toBeGreaterThan(0);
      expect(Array.isArray(pet.photoUrls)).toBe(true);
    }
  });

  await test.step('Create one order for each selected pet', async () => {
    for (const [index, pet] of selectedAvailablePets.entries()) {
      const orderId = idGenerator.generateSequentialId(index + 101);

      const orderPayload = OrderBuilder.build({
        id: orderId,
        petId: pet.id,
        quantity: 1,
        status: 'placed',
        complete: true,
      });

      const response = await storeApi.createOrder(orderPayload);
      expect(response.status()).toBe(200);

      const createdOrder = (await response.json()) as Order;

      expect(createdOrder.id).toBe(orderPayload.id);
      expect(createdOrder.petId).toBe(orderPayload.petId);
      expect(createdOrder.quantity).toBe(orderPayload.quantity);
      expect(createdOrder.status).toBe(orderPayload.status);
      expect(createdOrder.complete).toBe(orderPayload.complete);

      // The API may serialize the same UTC instant using a different timezone format,
      // so the assertion compares the normalized timestamp value instead of the raw string.
      expect(Number.isNaN(new Date(createdOrder.shipDate).getTime())).toBe(false);
      expect(new Date(createdOrder.shipDate).getTime()).toBe(new Date(orderPayload.shipDate).getTime());

      createdOrders.push(createdOrder);
    }

    expect(createdOrders).toHaveLength(5);

    const uniqueOrderIds = new Set(createdOrders.map((order) => order.id));
    expect(uniqueOrderIds.size).toBe(5);

    await attachJson(testInfo, 'created-orders', createdOrders);
    await attachJson(
      testInfo,
      'created-orders-summary',
      createdOrders.map((order) => ({
        id: order.id,
        petId: order.petId,
        status: order.status,
        complete: order.complete,
      }))
    );
  });
});
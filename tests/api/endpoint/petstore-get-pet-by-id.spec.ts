import { test, expect, TestInfo } from '@playwright/test';
import { PetApi } from '../../../src/api/objects/pet.api';
import { Pet } from '../../../src/api/models/pet.types';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should get pet by id', async ({ request }, testInfo) => {
  const petApi = new PetApi(request);
  const petId = 1;

  await attachJson(testInfo, 'request-context', { petId });

  const response = await petApi.getPetById(petId);
  expect(response.status()).toBe(200);

  const retrievedPet = (await response.json()) as Pet;

  await attachJson(testInfo, 'retrieved-pet', retrievedPet);

  // This test validates the baseline API connectivity using a known pet id.
  expect(retrievedPet.id).toBe(petId);
  expect(typeof retrievedPet.name).toBe('string');
  expect(retrievedPet.name.length).toBeGreaterThan(0);
  expect(Array.isArray(retrievedPet.photoUrls)).toBe(true);
  expect(retrievedPet).toHaveProperty('id');
  expect(retrievedPet).toHaveProperty('name');
  expect(retrievedPet).toHaveProperty('photoUrls');
});
import { test, expect, TestInfo } from '@playwright/test';
import { PetApi } from '../../../src/api/objects/pet.api';
import { Pet } from '../../../src/api/models/pet.types';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should find pets by status available', async ({ request }, testInfo) => {
  const petApi = new PetApi(request);

  await attachJson(testInfo, 'request-context', {
    status: 'available',
  });

  const response = await petApi.findPetsByStatus('available');
  expect(response.status()).toBe(200);

  const availablePets = (await response.json()) as Pet[];

  expect(Array.isArray(availablePets)).toBe(true);
  expect(availablePets.length).toBeGreaterThan(0);

  // The public dataset can be large, so the report stores a summary and a sample.
  const samplePets = availablePets.slice(0, 5);

  await attachJson(testInfo, 'available-pets-summary', {
    totalReturned: availablePets.length,
    sampleSize: samplePets.length,
  });

  await attachJson(testInfo, 'available-pets-sample', samplePets);

  expect(samplePets.length).toBeGreaterThan(0);

for (const pet of samplePets) {
  expect(pet.status).toBe('available');
  expect(typeof pet.id).toBe('number');
  expect(typeof pet.name).toBe('string');
  expect(pet.name.length).toBeGreaterThan(0);
  expect(Array.isArray(pet.photoUrls)).toBe(true);
  expect(Array.isArray(pet.tags)).toBe(true);
}
});
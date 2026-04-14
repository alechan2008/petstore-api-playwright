import { test, expect, TestInfo } from '@playwright/test';
import { PetApi } from '../../../src/api/objects/pet.api';
import { IdGenerator } from '../../../src/utils/id-generator';
import { PetBuilder } from '../../../src/data/builders/pet.builder';
import { Pet } from '../../../src/api/models/pet.types';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should create a pet with controlled random id', async ({ request }, testInfo) => {
  const petApi = new PetApi(request);
  const idGenerator = new IdGenerator();

  const petId = idGenerator.generateSequentialId(1);
  const petPayload = PetBuilder.build({
    id: petId,
    name: 'alfa',
    status: 'available',
  });

  await attachJson(testInfo, 'request-context', {
    runId: idGenerator.getRunId(),
    petId,
  });

  await attachJson(testInfo, 'pet-payload', petPayload);

  const response = await petApi.createPet(petPayload);
  expect(response.status()).toBe(200);

  const createdPet = (await response.json()) as Pet;

  await attachJson(testInfo, 'created-pet', createdPet);

  // The API should echo back the same payload values that were sent.
  expect(createdPet.id).toBe(petPayload.id);
  expect(createdPet.name).toBe(petPayload.name);
  expect(createdPet.status).toBe(petPayload.status);
  expect(createdPet.category).toEqual(petPayload.category);
  expect(createdPet.photoUrls).toEqual(petPayload.photoUrls);
  expect(createdPet.tags).toEqual(petPayload.tags);
});
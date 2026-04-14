import { test, expect, TestInfo } from '@playwright/test';
import { PetApi } from '../../../src/api/objects/pet.api';
import { IdGenerator } from '../../../src/utils/id-generator';
import { PetBuilder } from '../../../src/data/builders/pet.builder';
import { Pet, PetStatus } from '../../../src/api/models/pet.types';

async function attachJson(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

test('should create 10 pets and retrieve the sold pet by id', async ({ request }, testInfo) => {
  test.setTimeout(90_000);

  const petApi = new PetApi(request);
  const idGenerator = new IdGenerator();

  // This dataset is intentionally deterministic by status distribution
  // so the test can validate business expectations clearly.
  const statuses: PetStatus[] = [
    'available',
    'available',
    'available',
    'available',
    'available',
    'pending',
    'pending',
    'pending',
    'pending',
    'sold',
  ];

  const createdPets: Pet[] = [];

  await attachJson(testInfo, 'run-context', {
    runId: idGenerator.getRunId(),
    totalPetsToCreate: statuses.length,
  });

  await test.step('Create 10 pets with the expected status distribution', async () => {
    for (const [index, status] of statuses.entries()) {
      const petId = idGenerator.generateSequentialId(index + 1);

      const petPayload = PetBuilder.build({
        id: petId,
        name: `pet-${status}-${petId}`,
        status,
      });

      const response = await petApi.createPet(petPayload);
      expect(response.status()).toBe(200);

      const createdPet = (await response.json()) as Pet;

      expect(createdPet.id).toBe(petPayload.id);
      expect(createdPet.name).toBe(petPayload.name);
      expect(createdPet.status).toBe(petPayload.status);
      expect(createdPet.category).toEqual(petPayload.category);
      expect(createdPet.photoUrls).toEqual(petPayload.photoUrls);
      expect(createdPet.tags).toEqual(petPayload.tags);

      createdPets.push(createdPet);
    }

    expect(createdPets).toHaveLength(10);

    const uniqueIds = new Set(createdPets.map((pet) => pet.id));
    expect(uniqueIds.size).toBe(10);

    const statusSummary = createdPets.reduce<Record<PetStatus, number>>(
      (accumulator, pet) => {
        accumulator[pet.status] += 1;
        return accumulator;
      },
      {
        available: 0,
        pending: 0,
        sold: 0,
      }
    );

    await attachJson(testInfo, 'created-pets', createdPets);
    await attachJson(testInfo, 'created-pets-status-summary', statusSummary);

    expect(statusSummary.available).toBe(5);
    expect(statusSummary.pending).toBe(4);
    expect(statusSummary.sold).toBe(1);
  });

  const soldPet = createdPets.find((pet) => pet.status === 'sold');

  expect(soldPet, 'A sold pet should exist after creating the dataset').toBeDefined();

  if (!soldPet) {
    throw new Error('Sold pet was not found in the created dataset.');
  }

  await attachJson(testInfo, 'sold-pet-from-memory', soldPet);

  await test.step('Retrieve the sold pet by id and validate its details', async () => {
    // The public Petstore sample may expose eventual consistency behavior,
    // so this helper retries the read until the pet becomes available.
    const retrievedPet = await petApi.getPetByIdEventually(soldPet.id, {
      maxAttempts: 20,
      delayMs: 1_500,
    });

    await attachJson(testInfo, 'retrieved-sold-pet', retrievedPet);

    expect(retrievedPet.id).toBe(soldPet.id);
    expect(retrievedPet.name).toBe(soldPet.name);
    expect(retrievedPet.status).toBe('sold');
    expect(retrievedPet.category).toEqual(soldPet.category);
    expect(retrievedPet.photoUrls).toEqual(soldPet.photoUrls);
    expect(retrievedPet.tags).toEqual(soldPet.tags);
  });
});
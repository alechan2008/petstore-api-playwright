import { APIRequestContext, APIResponse } from '@playwright/test';
import { Pet, PetStatus } from '../models/pet.types';

interface GetPetByIdEventuallyOptions {
  maxAttempts?: number;
  delayMs?: number;
}

export class PetApi {
  constructor(private readonly request: APIRequestContext) {}

  async getPetById(id: number): Promise<APIResponse> {
    return this.request.get(`pet/${id}`);
  }

  async findPetsByStatus(status: PetStatus): Promise<APIResponse> {
    return this.request.get('pet/findByStatus', {
      params: { status },
    });
  }

  async createPet(payload: Pet): Promise<APIResponse> {
    return this.request.post('pet', {
      data: payload,
    });
  }

  async getPetByIdEventually(
    id: number,
    options: GetPetByIdEventuallyOptions = {}
  ): Promise<Pet> {
    const {
      maxAttempts = 20,
      delayMs = 1_500,
    } = options;

    let lastStatus = 0;
    let lastResponseText = '';

    // The public Petstore sample may not expose immediate consistency
    // after a pet is created, so this helper retries the read operation.
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.getPetById(id);
      lastStatus = response.status();
      lastResponseText = await response.text();

      if (lastStatus === 200) {
        return JSON.parse(lastResponseText) as Pet;
      }

      if (attempt < maxAttempts) {
        await this.sleep(delayMs);
      }
    }

    throw new Error(
      `Pet ${id} was not readable after ${maxAttempts} attempts. Last status: ${lastStatus}. Last body: ${lastResponseText}`
    );
  }

  private async sleep(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
import { Pet, PetStatus } from '../../api/models/pet.types';

interface BuildPetOptions {
  id: number;
  name?: string;
  status: PetStatus;
}

export class PetBuilder {
  static build(options: BuildPetOptions): Pet {
    const { id, name = `pet-${id}`, status } = options;

    // This builder uses a stable payload shape on purpose
    // to keep test data predictable and assertions straightforward.
    return {
      id,
      category: {
        id: 1,
        name: 'test-category',
      },
      name,
      photoUrls: ['https://example.com/photo.jpg'],
      tags: [
        {
          id: 1,
          name: 'test-tag',
        },
      ],
      status,
    };
  }
}
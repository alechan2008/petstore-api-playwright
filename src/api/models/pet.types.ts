export type PetStatus = 'available' | 'pending' | 'sold';

export interface PetCategory {
  id: number;
  name: string;
}

export interface PetTag {
  id: number;
  name: string;
}

export interface Pet {
  id: number;
  category: PetCategory;
  name: string;
  photoUrls: string[];
  tags: PetTag[];
  status: PetStatus;
}
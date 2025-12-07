export type Shelter = {
  id: number;
  title: string;
  description: string;
  numtotbeds: number;
  numopenbeds: number;
  address: string;
  longitude: number;
  latitude: number;
  phone?: string;
  families: boolean;
  single_women: boolean;
  single_men: boolean;
  domestic_violence: boolean;
  pet_friendly: boolean;
  age_min?: number;
  age_max?: number;
  wheelchair_accessible: boolean;
  website?: string;
};
  
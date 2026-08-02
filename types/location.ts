export interface City {
  id: string;
  name: string;
  state?: string;
  is_active: boolean;
}

export interface Locality {
  id: string;
  city_id: string;
  name: string;
  is_active: boolean;
}

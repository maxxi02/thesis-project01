export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BatangasCityAddress {
  id: string;
  barangay: string;
  city: string;
  province: string;
  fullAddress: string;
  cityCode?: string;
  barangayCode?: string;
  coordinates?: Coordinates;
}

export interface LocationsResponse {
  success: boolean;
  locations: BatangasCityAddress[];
  error?: string;
}

export interface CoordinatesResponse {
  success: boolean;
  coordinates: Coordinates | null;
  address?: string;
  error?: string;
}

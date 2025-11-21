// lib/location-service.ts
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

export interface LocationResponse {
  success: boolean;
  locations: BatangasCityAddress[];
  count: number;
}

export interface GeocodeResponse {
  coordinates: Coordinates | null;
  success: boolean;
}

interface CachedLocationData {
  locations: BatangasCityAddress[];
  count: number;
  timestamp: number;
}

interface CachedGeocodeData {
  coordinates: Coordinates;
  timestamp: number;
}

export class LocationService {
  private static locationCache = new Map<string, CachedLocationData>();
  private static geocodeCache = new Map<string, CachedGeocodeData>();
  private static readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  static async getBatangasLocations(
    includeCoordinates = false
  ): Promise<{ locations: BatangasCityAddress[]; count: number }> {
    const cacheKey = `batangas-${includeCoordinates}`;
    const cached = this.locationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { locations: cached.locations, count: cached.count };
    }

    try {
      console.log(
        `📍 Fetching Batangas locations (coordinates: ${includeCoordinates})...`
      );

      const response = await fetch(
        `/api/locations/batangas?allCities=true&coordinates=${includeCoordinates}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: LocationResponse = await response.json();

      if (data.success && data.locations?.length > 0) {
        const result = {
          locations: data.locations,
          count: data.count,
        };

        this.locationCache.set(cacheKey, {
          locations: data.locations,
          count: data.count,
          timestamp: Date.now(),
        });

        console.log(`✅ Loaded ${data.count} Batangas locations`);
        return result;
      } else {
        throw new Error("No locations found in response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch Batangas locations:", error);
      throw error;
    }
  }

  static async geocodeAddress(
    address: string,
    maxRetries = 3
  ): Promise<Coordinates> {
    const cacheKey = `geocode-${address}`;
    const cached = this.geocodeCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.coordinates;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📍 Geocoding attempt ${attempt} for: ${address}`);

        const response = await fetch(
          `/api/locations/geocode?address=${encodeURIComponent(
            address + ", Philippines"
          )}`
        );

        if (response.ok) {
          const data: GeocodeResponse = await response.json();

          if (data.coordinates) {
            const coordinates: Coordinates = data.coordinates;
            this.geocodeCache.set(cacheKey, {
              coordinates,
              timestamp: Date.now(),
            });

            return coordinates;
          }
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        console.warn(`Geocoding attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) throw error;
      }
    }

    throw new Error(`Failed to geocode address after ${maxRetries} attempts`);
  }

  static clearCache(): void {
    this.locationCache.clear();
    this.geocodeCache.clear();
  }
}

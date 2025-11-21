// hooks/useLocations.ts
import { BatangasCityAddress, LocationService } from "@/types/location-service";
import { useState } from "react";

interface UseLocationsReturn {
  locations: BatangasCityAddress[];
  loading: boolean;
  error: string | null;
  loadLocations: (
    includeCoordinates?: boolean
  ) => Promise<{ locations: BatangasCityAddress[]; count: number }>;
  searchLocations: (query: string, limit?: number) => BatangasCityAddress[];
  refetch: () => Promise<{ locations: BatangasCityAddress[]; count: number }>;
}

export function useLocations(): UseLocationsReturn {
  const [locations, setLocations] = useState<BatangasCityAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = async (
    includeCoordinates = false
  ): Promise<{ locations: BatangasCityAddress[]; count: number }> => {
    try {
      setLoading(true);
      setError(null);

      const result = await LocationService.getBatangasLocations(
        includeCoordinates
      );
      setLocations(result.locations);

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load locations";
      setError(errorMessage);
      console.error("Location loading error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = (query: string, limit = 5): BatangasCityAddress[] => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return locations
      .filter(
        (location: BatangasCityAddress) =>
          location.barangay.toLowerCase().includes(lowerQuery) ||
          location.city.toLowerCase().includes(lowerQuery) ||
          location.fullAddress.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  };

  const refetch = (): Promise<{
    locations: BatangasCityAddress[];
    count: number;
  }> => {
    return loadLocations(false);
  };

  return {
    locations,
    loading,
    error,
    loadLocations,
    searchLocations,
    refetch,
  };
}

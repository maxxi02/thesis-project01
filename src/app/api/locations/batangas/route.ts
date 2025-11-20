import { NextResponse } from "next/server";

const PSGC_BASE_URL = process.env.PSGC_BASE_URL || "https://psgc.gitlab.io/api";
const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";

// Add this validation
console.log('🔍 Environment Check:', {
  PSGC_BASE_URL,
  NOMINATIM_URL,
  hasVars: !!(process.env.PSGC_BASE_URL && process.env.NOMINATIM_URL)
});


interface Location {
  code: string;
  name: string;
}

interface FormattedLocation {
  id: string;
  barangay: string;
  city: string;
  province: string;
  fullAddress: string;
  cityCode: string;
  barangayCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Cache to prevent repeated calls
let cachedLocations: FormattedLocation[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getCoordinates(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "YourAppName/1.0",
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error);
    return null;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const allCities = searchParams.get("allCities") === "true";
    const includeCoordinates = searchParams.get("coordinates") === "true";

    // Check cache first (only for requests WITHOUT coordinates)
    if (
      !includeCoordinates &&
      cachedLocations &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION
    ) {
      console.log("Returning cached locations");
      return NextResponse.json({
        success: true,
        count: cachedLocations.length,
        locations: cachedLocations,
        cached: true,
      });
    }

    if (allCities) {
      const citiesResponse = await fetch(
        `${PSGC_BASE_URL}/provinces/041000000/cities-municipalities.json`,
        { next: { revalidate: 86400 } }
      );
      const cities: Location[] = await citiesResponse.json();

      const batchSize = 5;
      const allLocations: FormattedLocation[] = [];

      for (let i = 0; i < cities.length; i += batchSize) {
        const cityBatch = cities.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          cityBatch.map(async (city: Location) => {
            try {
              const barangaysResponse = await fetch(
                `${PSGC_BASE_URL}/cities-municipalities/${city.code}/barangays.json`,
                { next: { revalidate: 86400 } }
              );
              const barangays: Location[] = await barangaysResponse.json();

              // Base location data (always included)
              const locations = barangays.map((barangay: Location) => ({
                id: barangay.code,
                barangay: barangay.name,
                city: city.name,
                province: "Batangas",
                fullAddress: `${barangay.name}, ${city.name}, Batangas`,
                cityCode: city.code,
                barangayCode: barangay.code,
              }));

              // Only add coordinates if explicitly requested
              if (includeCoordinates) {
                return await Promise.all(
                  locations.map(async (location) => {
                    const coordinates = await getCoordinates(location.fullAddress + ", Philippines");
                    await delay(1100); // Rate limiting
                    return coordinates ? { ...location, coordinates } : location;
                  })
                );
              }

              return locations;
            } catch (error) {
              console.error(`Error fetching barangays for ${city.name}:`, error);
              return [];
            }
          })
        );

        allLocations.push(...batchResults.flat());
      }

      // Cache only if coordinates were NOT included
      if (!includeCoordinates) {
        cachedLocations = allLocations;
        cacheTimestamp = Date.now();
      }

      return NextResponse.json({
        success: true,
        count: allLocations.length,
        locations: allLocations,
      });
    } else {
      // Batangas City only
      const citiesResponse = await fetch(
        `${PSGC_BASE_URL}/provinces/041000000/cities-municipalities.json`,
        { next: { revalidate: 86400 } }
      );
      const cities: Location[] = await citiesResponse.json();

      const batangasCityCode = cities.find(
        (c: Location) => c.name === "City of Batangas"
      )?.code;

      if (!batangasCityCode) {
        return NextResponse.json(
          { success: false, error: "Batangas City not found" },
          { status: 404 }
        );
      }

      const barangaysResponse = await fetch(
        `${PSGC_BASE_URL}/cities-municipalities/${batangasCityCode}/barangays.json`,
        { next: { revalidate: 86400 } }
      );
      const barangays: Location[] = await barangaysResponse.json();

      // Base location data
      let formattedLocations: FormattedLocation[] = barangays.map((barangay: Location) => ({
        id: barangay.code,
        barangay: barangay.name,
        city: "Batangas City",
        province: "Batangas",
        fullAddress: `${barangay.name}, Batangas City, Batangas`,
        cityCode: batangasCityCode,
        barangayCode: barangay.code,
      }));

      // Only geocode if coordinates explicitly requested
      if (includeCoordinates) {
        formattedLocations = await Promise.all(
          formattedLocations.map(async (location) => {
            const coordinates = await getCoordinates(location.fullAddress + ", Philippines");
            await delay(1100); // Rate limiting
            return coordinates ? { ...location, coordinates } : location;
          })
        );
      }

      return NextResponse.json({
        success: true,
        count: formattedLocations.length,
        locations: formattedLocations,
      });
    }
  } catch (error) {
    console.error("Error fetching Batangas locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// Keep dynamic routing
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
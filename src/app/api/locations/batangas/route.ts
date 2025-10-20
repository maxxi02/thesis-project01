import { NextResponse } from "next/server";

const PSGC_BASE_URL = process.env.PSGC_BASE_URL;
const NOMINATIM_URL = process.env.NOMINATIM_URL;

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
          "User-Agent": "YourAppName/1.0", // Required by Nominatim
        },
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

// Add delay to respect rate limits (1 request per second for Nominatim)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const allCities = searchParams.get("allCities") === "true";
    const includeCoordinates = searchParams.get("coordinates") === "true";

    if (allCities) {
      // Get all cities and their barangays in Batangas Province
      const citiesResponse = await fetch(
        `${PSGC_BASE_URL}/provinces/041000000/cities-municipalities.json`
      );
      const cities: Location[] = await citiesResponse.json();

      const allLocations = await Promise.all(
        cities.map(async (city: Location) => {
          try {
            const barangaysResponse = await fetch(
              `${PSGC_BASE_URL}/cities-municipalities/${city.code}/barangays.json`
            );
            const barangays: Location[] = await barangaysResponse.json();

            const locationsWithCoords = await Promise.all(
              barangays.map(async (barangay: Location) => {
                const fullAddress = `${barangay.name}, ${city.name}, Batangas, Philippines`;
                let coordinates = null;

                if (includeCoordinates) {
                  coordinates = await getCoordinates(fullAddress);
                  await delay(1100); // Respect Nominatim rate limit
                }

                return {
                  id: barangay.code,
                  barangay: barangay.name,
                  city: city.name,
                  province: "Batangas",
                  fullAddress: `${barangay.name}, ${city.name}, Batangas`,
                  cityCode: city.code,
                  barangayCode: barangay.code,
                  ...(coordinates && { coordinates }),
                };
              })
            );

            return locationsWithCoords;
          } catch (error) {
            console.error(`Error fetching barangays for ${city.name}:`, error);
            return [];
          }
        })
      );

      const flattenedLocations: FormattedLocation[] = allLocations.flat();

      return NextResponse.json({
        success: true,
        count: flattenedLocations.length,
        locations: flattenedLocations,
      });
    } else {
      // Get only Batangas City barangays
      const citiesResponse = await fetch(
        `${PSGC_BASE_URL}/provinces/041000000/cities-municipalities.json`
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
        `${PSGC_BASE_URL}/cities-municipalities/${batangasCityCode}/barangays.json`
      );
      const barangays: Location[] = await barangaysResponse.json();

      const formattedLocations: FormattedLocation[] = await Promise.all(
        barangays.map(async (barangay: Location) => {
          const fullAddress = `${barangay.name}, Batangas City, Batangas, Philippines`;
          let coordinates = null;

          if (includeCoordinates) {
            coordinates = await getCoordinates(fullAddress);
            await delay(1100); // Respect Nominatim rate limit
          }

          return {
            id: barangay.code,
            barangay: barangay.name,
            city: "Batangas City",
            province: "Batangas",
            fullAddress: `${barangay.name}, Batangas City, Batangas`,
            cityCode: batangasCityCode,
            barangayCode: barangay.code,
            ...(coordinates && { coordinates }),
          };
        })
      );

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

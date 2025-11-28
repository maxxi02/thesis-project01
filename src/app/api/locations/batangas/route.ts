import { NextResponse } from "next/server";

const NOMINATIM_URL =
  process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    suburb?: string;
    city?: string;
    municipality?: string;
    province?: string;
    state?: string;
    country?: string;
    village?: string;
    town?: string;
  };
}

interface Location {
  id: string;
  barangay: string;
  city: string;
  province: string;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
}

export async function GET() {
  console.log("📍 [LOCATIONS API] Starting to fetch Batangas locations...");

  try {
    const searchParams = new URLSearchParams({
      q: "Batangas City, Batangas, Philippines",
      format: "json",
      limit: "100",
      addressdetails: "1",
      featuretype: "settlement",
    });

    console.log(
      "📍 [LOCATIONS API] Fetching from Nominatim with params:",
      searchParams.toString()
    );

    const response = await fetch(`${NOMINATIM_URL}/search?${searchParams}`, {
      headers: {
        "User-Agent": "LGW Hardware",
        Accept: "application/json",
      },
    });

    console.log(
      "📍 [LOCATIONS API] Nominatim response status:",
      response.status
    );

    if (!response.ok) {
      throw new Error(`Nominatim failed: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();
    console.log("📍 [LOCATIONS API] Raw Nominatim results count:", data.length);

    // Transform Nominatim results to our Location format
    const locations: Location[] = data
      .map((result, index) => {
        console.log(`📍 [LOCATIONS API] Processing result ${index + 1}:`, {
          display_name: result.display_name,
          address: result.address,
          lat: result.lat,
          lon: result.lon,
        });

        // Better barangay extraction
        const barangay =
          result.address.suburb ||
          result.address.municipality ||
          result.address.village ||
          result.address.town ||
          result.display_name.split(",")[0];

        // Clean up the barangay name
        const cleanBarangay = barangay
          .replace(/^Barangay /i, "")
          .replace(/^Brgy\.? /i, "")
          .trim();

        const location: Location = {
          id: `btg-${result.place_id}-${index}`,
          barangay: cleanBarangay,
          city: result.address.city || "Batangas City",
          province:
            result.address.province || result.address.state || "Batangas",
          fullAddress: result.display_name,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
        };

        console.log(`📍 [LOCATIONS API] Transformed location:`, location);

        return location;
      })
      .filter((loc) => {
        const isValid = loc.barangay && loc.barangay.length > 2;
        if (!isValid) {
          console.log(`📍 [LOCATIONS API] Filtered out invalid location:`, loc);
        }
        return isValid;
      });

    // Remove duplicates based on cleaned barangay name
    const uniqueLocations = Array.from(
      new Map(
        locations.map((loc) => [loc.barangay.toLowerCase(), loc])
      ).values()
    );

    console.log("📍 [LOCATIONS API] Final unique locations:", {
      totalFound: data.length,
      afterTransformation: locations.length,
      afterDeduplication: uniqueLocations.length,
      locations: uniqueLocations.map((loc) => ({
        barangay: loc.barangay,
        coordinates: loc.coordinates,
        fullAddress: loc.fullAddress,
      })),
    });

    return NextResponse.json({
      success: true,
      count: uniqueLocations.length,
      locations: uniqueLocations,
    });
  } catch (error) {
    console.error("❌ [LOCATIONS API] Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch locations from Nominatim",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

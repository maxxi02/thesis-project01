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
  try {
    // Search for all locations in Batangas City
    const response = await fetch(
      `${NOMINATIM_URL}/search?` +
        new URLSearchParams({
          q: "Batangas City, Batangas, Philippines",
          format: "json",
          limit: "50",
          addressdetails: "1",
        }),
      {
        headers: {
          "User-Agent": "LGW Hardware",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim failed: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    // Transform Nominatim results to our Location format
    const locations: Location[] = data.map((result, index) => {
      const barangay =
        result.address.suburb ||
        result.address.municipality ||
        result.display_name.split(",")[0];
      
      return {
        id: `btg-${result.place_id}`,
        barangay: barangay,
        city: result.address.city || "Batangas City",
        province: result.address.province || result.address.state || "Batangas",
        fullAddress: result.display_name,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
      };
    });

    // Remove duplicates based on barangay name
    const uniqueLocations = Array.from(
      new Map(locations.map((loc) => [loc.barangay, loc])).values()
    );

    return NextResponse.json({
      success: true,
      count: uniqueLocations.length,
      locations: uniqueLocations,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations from Nominatim" },
      { status: 500 }
    );
  }
}
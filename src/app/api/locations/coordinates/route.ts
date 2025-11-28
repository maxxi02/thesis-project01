import { CoordinatesResponse, LocationsResponse } from "@/types/coordinates";
import { BatangasCityAddress } from "@/types/location-service";
import { NextRequest, NextResponse } from "next/server";

interface CoordinateRequest {
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    const { address }: CoordinateRequest = await request.json();

    if (!address) {
      return NextResponse.json<CoordinatesResponse>(
        { success: false, error: "Address is required", coordinates: null },
        { status: 400 }
      );
    }

    // Fetch from your existing locations API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "lgwhardware.online"}/api/locations/batangas?allCities=true&coordinates=true`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }

    const data: LocationsResponse = await response.json();

    if (!data.success || !data.locations) {
      return NextResponse.json<CoordinatesResponse>(
        { success: false, error: "No locations found", coordinates: null },
        { status: 404 }
      );
    }

    // Find matching address
    const matchedLocation: BatangasCityAddress | undefined =
      data.locations.find(
        (loc: BatangasCityAddress) =>
          loc.fullAddress.toLowerCase() === address.toLowerCase() ||
          loc.barangay.toLowerCase().includes(address.toLowerCase()) ||
          address.toLowerCase().includes(loc.barangay.toLowerCase())
      );

    if (!matchedLocation || !matchedLocation.coordinates) {
      return NextResponse.json<CoordinatesResponse>(
        {
          success: false,
          error: "Coordinates not found for this address",
          coordinates: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<CoordinatesResponse>({
      success: true,
      coordinates: matchedLocation.coordinates,
      address: matchedLocation.fullAddress,
    });
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return NextResponse.json<CoordinatesResponse>(
      {
        success: false,
        error: "Internal server error",
        coordinates: null,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

const NOMINATIM_URL =
  process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address parameter required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "LGW Hardware",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return NextResponse.json({
        success: true,
        coordinates: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "No coordinates found",
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}

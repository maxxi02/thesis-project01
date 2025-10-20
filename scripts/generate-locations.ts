// scripts/generate-locations.ts
// Run this ONCE locally, then commit the generated file

import fs from "fs";
import path from "path";

const PSGC_BASE_URL = "https://psgc.gitlab.io/api";

interface Location {
  code: string;
  name: string;
}

async function generateLocations() {
  console.log("Fetching cities in Batangas...");

  const citiesResponse = await fetch(
    `${PSGC_BASE_URL}/provinces/041000000/cities-municipalities.json`
  );
  const cities: Location[] = await citiesResponse.json();

  console.log(`Found ${cities.length} cities/municipalities`);

  const allLocations = [];

  for (const city of cities) {
    console.log(`Fetching barangays for ${city.name}...`);

    const barangaysResponse = await fetch(
      `${PSGC_BASE_URL}/cities-municipalities/${city.code}/barangays.json`
    );
    const barangays: Location[] = await barangaysResponse.json();

    const locations = barangays.map((barangay: Location) => ({
      id: barangay.code,
      barangay: barangay.name,
      city: city.name,
      province: "Batangas",
      fullAddress: `${barangay.name}, ${city.name}, Batangas`,
      cityCode: city.code,
      barangayCode: barangay.code,
    }));

    allLocations.push(...locations);
    console.log(`  Added ${barangays.length} barangays`);
  }

  // Save to public folder
  const outputPath = path.join(
    process.cwd(),
    "public",
    "data",
    "batangas-locations.json"
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: allLocations.length,
        locations: allLocations,
      },
      null,
      2
    )
  );

  console.log(`\n✅ Generated ${allLocations.length} locations`);
  console.log(`📁 Saved to: ${outputPath}`);
}

generateLocations().catch(console.error);

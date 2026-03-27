import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const make = req.nextUrl.searchParams.get("make")?.trim();
    const makeName = req.nextUrl.searchParams.get("makeName")?.trim();
    const vin = req.nextUrl.searchParams.get("vin")?.trim();
    const year = req.nextUrl.searchParams.get("year")?.trim();

    // 1) Decode VIN / chassis
    if (vin) {
      const url = new URL(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(
          vin
        )}`
      );
      url.searchParams.set("format", "json");
      if (year) url.searchParams.set("modelyear", year);

      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: "Failed to decode VIN", details: text },
          { status: res.status }
        );
      }

      const data = await res.json();
      const row = data?.Results?.[0] ?? {};

      return NextResponse.json({
        type: "vin",
        data: {
          vin,
          make: row.Make || "",
          model: row.Model || "",
          year: row.ModelYear || "",
          bodyClass: row.BodyClass || "",
          engineCylinders: row.EngineCylinders || "",
          displacementL: row.DisplacementL || "",
          fuelType: row.FuelTypePrimary || "",
          manufacturer: row.Manufacturer || "",
          errorCode: row.ErrorCode || "",
          errorText: row.ErrorText || "",
        },
      });
    }

    // 2) Load models for selected make
    if (make) {
      const makeId = Number(make);
      const urls: URL[] = [];
      if (Number.isFinite(makeId) && makeId > 0) {
        const byIdUrl = new URL(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeId/${makeId}`);
        byIdUrl.searchParams.set("format", "json");
        urls.push(byIdUrl);
      }
      const fallbackName = makeName || make;
      const byNameUrl = new URL(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(fallbackName)}`);
      byNameUrl.searchParams.set("format", "json");
      urls.push(byNameUrl);

      let dedupedModels: Array<{ id: string; name: string }> = [];
      let lastError: { status: number; details: string } | null = null;

      for (const url of urls) {
        const res = await fetch(url.toString(), {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          lastError = { status: res.status, details: await res.text() };
          continue;
        }

        const data = await res.json();
        const rawModels = Array.isArray(data?.Results)
          ? data.Results.map((item: { Model_Name?: string }) => ({
              id: String(item.Model_Name ?? ""),
              name: String(item.Model_Name ?? "").trim(),
            }))
          : [];

        dedupedModels = Array.from(
          new Map(
            rawModels
              .filter((item: { name: string }) => item.name)
              .map((item: { id: string; name: string }) => [item.name.toLowerCase(), item])
          ).values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        if (dedupedModels.length > 0) break;
      }

      if (dedupedModels.length === 0 && lastError) {
        return NextResponse.json(
          { error: "Failed to fetch models", details: lastError.details },
          { status: lastError.status }
        );
      }

      return NextResponse.json({
        type: "models",
        data: dedupedModels,
      });
    }

    // 3) Load makes
    const res = await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch makes", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const makes = Array.isArray(data?.Results)
      ? data.Results.map((item: { Make_ID?: number | string; Make_Name?: string }) => ({
          id: String(item.Make_ID ?? ""),
          name: String(item.Make_Name ?? "").trim(),
        }))
          .filter((item: { name: string }) => item.name)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

    return NextResponse.json({
      type: "makes",
      data: makes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

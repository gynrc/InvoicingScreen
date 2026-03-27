import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";

export const runtime = "nodejs";

type CreateVehicleBody = {
  customerId: number | string;
  make: string;
  model: string;
  year?: number | null;
  regPlate: string;
  mileage?: number | null;
  engineNum?: string | null;
  chassisNum?: string | null;
  // lastServiceDate?: string | null;
  color?: string | null;
  description?: string | null;
  lastMileage?: number | null;
  driverName?: string | null;
};

type UpdateVehicleBody = {
  customerId: string;
  regPlate: string;
  vehicleDetails?: string | null;
  engineNo?: string | null;
  chassisNo?: string | null;
  mileage?: number | string | null;
  serviceDate?: string | null;
};

type DeleteVehicleBody = {
  customerId: string;
  regPlate: string;
};

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requiredString(value: unknown, fieldName: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) throw new ValidationError(`${fieldName} is required.`);
  return cleaned;
}

function optionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) throw new ValidationError("Invalid numeric value.");
  return Math.trunc(num);
}

function parseDateInput(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new ValidationError("Invalid date value.");

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) throw new ValidationError("Invalid date.");
  return parsed;
}

function assertMaxLength(value: string | null, max: number, fieldName: string) {
  if (value && value.length > max) {
    throw new ValidationError(`${fieldName} must be ${max} characters or less.`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateVehicleBody;

    const customerId = Number(body.customerId);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      throw new ValidationError("customerId is required.");
    }

    const make = requiredString(body.make, "make");
    const model = requiredString(body.model, "model");
    const regPlate = requiredString(body.regPlate, "regPlate").toUpperCase();

    const year = optionalInt(body.year);
    const mileage = optionalInt(body.mileage);
    const lastMileage = optionalInt(body.lastMileage);

    const engineNum = cleanString(body.engineNum);
    const chassisNum = cleanString(body.chassisNum);
    const color = cleanString(body.color);
    const description = cleanString(body.description);
    const driverName = cleanString(body.driverName);
    // const lastServiceDate = parseDateInput(body.lastServiceDate);

    assertMaxLength(regPlate, 10, "regPlate");
    assertMaxLength(make, 30, "make");
    assertMaxLength(model, 30, "model");
    assertMaxLength(engineNum, 25, "engineNum");
    assertMaxLength(chassisNum, 25, "chassisNum");
    assertMaxLength(color, 20, "color");
    assertMaxLength(description, 255, "description");
    assertMaxLength(driverName, 30, "driverName");

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("CustomerID", customerId)
      .input("RegNo", regPlate)
      .input("Make", make)
      .input("Model", model)
      .input("ModelYear", year && year > 0 ? year : null)
      .input("Mileage", mileage)
      .input("SerialNo", chassisNum)
      .input("EngineNo", engineNum)
      // .input("LastServiceDate", lastServiceDate)
      .input("Color", color)
      .input("Description", description)
      .input("LastMilage", lastMileage)
      .input("DriverName", driverName)
      .execute("spSuiteAddVehicle")
    return NextResponse.json(
      {
        ok: true,
        vehicle: result.recordset?.[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/vehicles failed:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: false, message: "Failed to save vehicle." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as UpdateVehicleBody;
    console.log("Vehicle info:", body)

    const customerId = requiredString(body.customerId, "customerId");
    const regPlate = requiredString(body.regPlate, "regPlate").toUpperCase();

    const vehicleDetails = cleanString(body.vehicleDetails);
    const engineNo = cleanString(body.engineNo);
    const chassisNo = cleanString(body.chassisNo);
    const mileage = optionalInt(body.mileage);
    const serviceDate = parseDateInput(body.serviceDate);

    assertMaxLength(regPlate, 10, "regPlate");
    assertMaxLength(vehicleDetails, 255, "vehicleDetails");
    assertMaxLength(engineNo, 25, "engineNo");
    assertMaxLength(chassisNo, 25, "chassisNo");

    if (mileage !== null && mileage < 0) {
      throw new ValidationError("mileage cannot be negative.");
    }

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("CustomerID", customerId)
      .input("RegNo", regPlate)
      .input("Description", vehicleDetails)
      .input("EngineNo", engineNo)
      .input("SerialNo", chassisNo)
      .input("Mileage", mileage)
      .input("LastServiceDate", serviceDate)
      .execute("spSuiteUpdateVehicle");

    return NextResponse.json({
      ok: true,
      vehicle: result.recordset?.[0] ?? null,
    });
  } catch (error: unknown) {
    console.error("PUT /api/vehicles failed:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to update vehicle.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as DeleteVehicleBody;
    const customerId = requiredString(body.customerId, "customerId");
    const regPlate = requiredString(body.regPlate, "regPlate").toUpperCase();

    assertMaxLength(regPlate, 10, "regPlate");

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("CustomerID", customerId)
      .input("RegNo", regPlate)
      .execute("spSuiteRemoveVehicle");

    return NextResponse.json({
      ok: true,
      result: result.recordset?.[0] ?? null,
    });
  } catch (error: unknown) {
    console.error("DELETE /api/vehicles failed:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to remove vehicle.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import sql from "@/config/db";

type UpdateCustomerBody = {
  customerId: string;
  custType: string;
  firstName: string;
  lastName: string;
  address1?: string;
  address2?: string;
  parish?: string;
  country?: string;
  telephone1?: string;
  telephone2?: string;
  fax?: string;
  email?: string;
  zip?: string;
  primaryContact?: string;
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
  if (!cleaned) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  return cleaned;
}

function optionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new ValidationError("Invalid numeric value.");
  }
  return Math.trunc(num);
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getIntFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

async function resolveCustomerTypeId(pool: Awaited<ReturnType<typeof connectDB>>, rawCustType: unknown): Promise<number> {
  const direct = optionalInt(rawCustType);
  if (direct !== null) return direct;

  const wanted = normalize(rawCustType);
  if (!wanted) {
    throw new ValidationError("custType is required.");
  }

  const lookup = await pool.request().execute("spGetCustType");
  const rows = Array.isArray(lookup.recordset) ? lookup.recordset : [];

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const code = String(r.CustType ?? "").trim().toLowerCase();
    const description = String(r.CustTypeDescription ?? "").trim().toLowerCase();
    if (wanted !== code && wanted !== description) continue;

    const candidate =
      getIntFromUnknown(r.CustTypeID) ??
      getIntFromUnknown(r.CustTypeId) ??
      getIntFromUnknown(r.CustomerTypeID) ??
      getIntFromUnknown(r.CustomerTypeId) ??
      getIntFromUnknown(r.CustomerType) ??
      getIntFromUnknown(r.CustType);

    if (candidate !== null) return candidate;
  }

  throw new ValidationError("custType must be a valid customer type.");
}

function assertMaxLength(value: string | null, max: number, fieldName: string) {
  if (value && value.length > max) {
    throw new ValidationError(`${fieldName} must be ${max} characters or less.`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || 20);
    const search = request.nextUrl.searchParams.get("search") || "";
    const searchField = request.nextUrl.searchParams.get("searchField") || "customerName";

    const pool = await connectDB();

    const result = await pool
      .request()
      .input("Page", page)
      .input("PageSize", pageSize)
      .input("Search", search)
      .input("SearchField", searchField)
      .execute("spGetSuiteCustomers");

    return NextResponse.json({
      data: result.recordset,
      totalRecords: result.recordset?.[0]?.totalRecords ?? 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    console.error("GET /api/customers error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch customers",
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as UpdateCustomerBody;

    const customerId = requiredString(body.customerId, "customerId");
    const rawCustType = body.custType;
    const firstName = requiredString(body.firstName, "firstName");
    const lastName = requiredString(body.lastName, "lastName");

    const address1 = cleanString(body.address1);
    const address2 = cleanString(body.address2);
    const parish = cleanString(body.parish);
    const country = cleanString(body.country);
    const telephone1 = cleanString(body.telephone1);
    const telephone2 = cleanString(body.telephone2);
    const fax = cleanString(body.fax);
    const email = cleanString(body.email);
    const zip = cleanString(body.zip);
    const primaryContact = cleanString(body.primaryContact);

    assertMaxLength(customerId, 50, "customerId");
    assertMaxLength(firstName, 30, "firstName");
    assertMaxLength(lastName, 60, "lastName");
    assertMaxLength(address1, 60, "address1");
    assertMaxLength(address2, 60, "address2");
    assertMaxLength(parish, 20, "parish");
    assertMaxLength(country, 40, "country");
    assertMaxLength(telephone1, 30, "telephone1");
    assertMaxLength(telephone2, 30, "telephone2");
    assertMaxLength(fax, 30, "fax");
    assertMaxLength(email, 100, "email");
    assertMaxLength(zip, 9, "zip");
    assertMaxLength(primaryContact, 60, "primaryContact");

    const pool = await connectDB();
    const custType = await resolveCustomerTypeId(pool, rawCustType);

    await pool
      .request()
      .input("CustomerID", sql.VarChar(50), customerId)
      .input("CustomerType", sql.Int, custType)
      .input("First_Name", sql.VarChar(30), firstName)
      .input("Last_Name", sql.VarChar(60), lastName)
      .input("Address1", sql.VarChar(60), address1)
      .input("Address2", sql.VarChar(60), address2)
      .input("Parish", sql.VarChar(20), parish)
      .input("Country", sql.VarChar(40), country)
      .input("Telephone_1", sql.VarChar(30), telephone1)
      .input("Telephone_2", sql.VarChar(30), telephone2)
      .input("Fax_no", sql.VarChar(30), fax)
      .input("Email", sql.VarChar(100), email)
      .input("PrimaryContact", sql.VarChar(60), primaryContact)
      .input("Zipcode", sql.VarChar(9), zip)
      .query(`
        UPDATE Customer
        SET CustomerType = @CustomerType,
            First_Name = @First_Name,
            Last_Name = @Last_Name,
            Address1 = @Address1,
            Address2 = @Address2,
            Parish = @Parish,
            Country = @Country,
            Telephone_1 = @Telephone_1,
            Telephone_2 = @Telephone_2,
            Fax_no = @Fax_no,
            Email = @Email,
            PrimaryContact = @PrimaryContact,
            Zipcode = @Zipcode
        WHERE CustomerID = @CustomerID;
      `);

    const fetchUpdated = await pool
      .request()
      .input("CustomerID", sql.VarChar(50), customerId)
      .query(`SELECT TOP 1 * FROM Customer WHERE CustomerID = @CustomerID;`);

    if (!fetchUpdated.recordset?.[0]) {
      return NextResponse.json(
        { ok: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      customer: fetchUpdated.recordset[0],
    });
  } catch (error: unknown) {
    console.error("PUT /api/customers error:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to save customer.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

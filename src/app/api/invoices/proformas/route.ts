import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/config/db";
import sql from "@/config/db";

export const runtime = "nodejs";

type CreateProformaBody = {
  userId?: number | string | null;
  locationId?: number | string | null;
  customerId?: number | string | null;
  customerName?: string | null;
  address1?: string | null;
  address2?: string | null;
  parish?: string | null;
  country?: string | null;
  salesPerson?: number | string | null;
  description?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  invoiceAmount?: number | string | null;
  gct?: number | string | null;
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

function requiredInt(value: unknown, fieldName: string, fallback?: number | null): number {
  const direct = optionalInt(value);
  if (direct !== null) return direct;
  if (fallback !== null && fallback !== undefined) return fallback;
  throw new ValidationError(`${fieldName} is required.`);
}

function optionalMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new ValidationError("Invalid amount.");
  }
  return num;
}

function optionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError("Invalid date value.");
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T00:00:00`)
    : new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError("Invalid date value.");
  }

  return parsed;
}

function diffInDays(fromDate: Date, toDate: Date): number {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

function trimDbString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function envInt(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT TOP 100
        InvoiceNo,
        CustomerID,
        CustomerName,
        Address1,
        Address2,
        Parish,
        Country,
        SalesPerson,
        Comments,
        InvoiceAmount,
        AmountPaid,
        TrnDate,
        DueDate,
        Cancelled
      FROM Invoices
      WHERE Type = 1
      ORDER BY TrnDate DESC, InvoiceNo DESC;
    `);

    const proformas = (result.recordset ?? []).map((row: Record<string, unknown>) => ({
      proformaNo: Number(row.InvoiceNo ?? 0),
      customerId:
        row.CustomerID === null || row.CustomerID === undefined
          ? ""
          : String(row.CustomerID).trim(),
      customerName: trimDbString(row.CustomerName),
      address1: trimDbString(row.Address1),
      address2: trimDbString(row.Address2),
      parish: trimDbString(row.Parish),
      country: trimDbString(row.Country),
      salesRep:
        row.SalesPerson === null || row.SalesPerson === undefined
          ? ""
          : String(row.SalesPerson).trim(),
      description: trimDbString(row.Comments),
      invoiceTotal: Number(row.InvoiceAmount ?? 0),
      amountPaid: Number(row.AmountPaid ?? 0),
      invoiceDate: formatDate(row.TrnDate),
      dueDate: formatDate(row.DueDate),
      status: Number(row.Cancelled ?? 0) === 1 ? "Converted" : "Proforma",
    }));

    return NextResponse.json({ ok: true, proformas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load proformas.";
    console.error("GET /api/invoices/proformas failed:", error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateProformaBody;
    const cookieStore = await cookies();
    const rawSession = cookieStore.get("inv_suite_session")?.value;
    const session = rawSession
      ? (JSON.parse(rawSession) as { uid?: number })
      : null;

    const fallbackUserId = session?.uid ?? envInt("DEFAULT_INVOICE_USER_ID") ?? 1;
    const fallbackLocationId = envInt("DEFAULT_INVOICE_LOCATION_ID") ?? 1;

    const userId = requiredInt(body.userId, "userId", fallbackUserId);
    const locationId = requiredInt(body.locationId, "locationId", fallbackLocationId);
    const customerId = optionalInt(body.customerId);
    const customerName = requiredString(body.customerName, "customerName");
    const address1 = cleanString(body.address1);
    const address2 = cleanString(body.address2);
    const parish = cleanString(body.parish);
    const country = cleanString(body.country);
    const salesPerson = optionalInt(body.salesPerson);
    const description = cleanString(body.description);
    const invoiceAmount = optionalMoney(body.invoiceAmount);
    const gct = optionalMoney(body.gct);
    const invoiceDate = optionalDate(body.invoiceDate) ?? new Date();
    const dueDate = optionalDate(body.dueDate);
    const dueDays = dueDate ? diffInDays(invoiceDate, dueDate) : 0;
    const creationTerminal =
      cleanString(req.headers.get("x-forwarded-host")) ??
      cleanString(req.headers.get("host")) ??
      "inv-suite-web";

    const pool = await connectDB();
    const result = await pool
      .request()
      .input("InvoiceNo", sql.Int, null)
      .input("UserId", sql.Int, userId)
      .input("LocationId", sql.Int, locationId)
      .input("Type", sql.Int, 1)
      .input("CustomerID", sql.BigInt, customerId)
      .input("CustomerName", sql.Char(100), customerName)
      .input("Address1", sql.Char(60), address1)
      .input("Address2", sql.Char(60), address2)
      .input("Parish", sql.Char(20), parish)
      .input("Country", sql.Char(40), country)
      .input("SalesPerson", sql.SmallInt, salesPerson)
      .input("DiscountAmount", sql.Money, 0)
      .input("Shipping", sql.Money, 0)
      .input("GCT", sql.Money, gct)
      .input("InvoiceAmount", sql.Money, invoiceAmount)
      .input("AmountPaid", sql.Money, 0)
      .input("Comments", sql.VarChar(600), description)
      .input("PurchaseOrder", sql.VarChar(25), null)
      .input("jobID", sql.Int, null)
      .input("Duedays", sql.Int, dueDays)
      .input("NoPrint", sql.Bit, 0)
      .input("CommitStock", sql.Bit, 0)
      .input("SourcePO", sql.Int, null)
      .input("SourceType", sql.Int, null)
      .input("SeqOverrideLocation", sql.Int, null)
      .input("Authorizer", sql.Int, null)
      .input("Hold", sql.Bit, 0)
      .input("creationTerminal", sql.Char(70), creationTerminal)
      .input("IsWholesale", sql.Int, null)
      .input("UsedLoyaltyCard", sql.Decimal(18, 2), null)
      .input("ProfNo", sql.Int, null)
      .input("ContRef", sql.Int, null)
      .input("CouponAmount", sql.Money, null)
      .input("CouponNo", sql.Int, null)
      .input("WholesalePickMod", sql.Bit, null)
      .input("WholesaleStatus", sql.Int, null)
      .input("DeliveryDestination", sql.Int, null)
      .input("SKUs", sql.Int, null)
      .execute("spCreateInvoiceTransactionV3");

    const proformaNo = Number(result.returnValue ?? 0);
    if (!Number.isFinite(proformaNo) || proformaNo <= 0) {
      throw new Error("Stored procedure did not return a valid proforma number.");
    }

    return NextResponse.json({
      ok: true,
      proformaNo,
      invoiceDate: formatDate(new Date()),
      dueDate: dueDate ? formatDate(dueDate) : "",
    });
  } catch (error: unknown) {
    console.error("POST /api/invoices/proformas failed:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to create proforma.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

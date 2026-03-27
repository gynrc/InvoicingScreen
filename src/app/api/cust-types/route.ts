import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";

export const dynamic = "force-dynamic"; // avoid caching issues while developing

type CustTypeRow = {
  Custtype?: string | number;
  CustTypeDescription?: string;
};

// function toIntString(value: unknown): string | null {
//   if (typeof value === "number" && Number.isInteger(value)) return String(value);
//   if (typeof value === "string" && /^\d+$/.test(value.trim())) return value.trim();
//   return null;
// }

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("spGetCustType");

    const rows = (result.recordset ?? []) as CustTypeRow[];
    console.log("Types:", rows)

    const data = rows.map((r) => {
      const resolvedCustType =
      
        String(r.Custtype ?? "").trim();

      return {
        custType: resolvedCustType,
        description: String(r.CustTypeDescription ?? "").trim(),
      };
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/cust-types error:", err);
    return NextResponse.json(
      { error: "Failed to load customer types." },
      { status: 500 }
    );
  }
}

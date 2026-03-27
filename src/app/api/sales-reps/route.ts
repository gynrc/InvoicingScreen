import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().execute("spGetSalesPersons");

    const salesReps = (result.recordset ?? []).map((row: Record<string, unknown>) => ({
      code: String(row.SalesAgentcode ?? "").trim(),
      name: String(row.SalesAgentName ?? "").trim(),
      branch: String(row.Branch ?? "").trim(),
      initials: String(row.SalesAgentInitials ?? "").trim(),
    }));

    return NextResponse.json({ ok: true, salesReps });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load sales reps.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

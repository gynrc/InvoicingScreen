import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";

export async function GET() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT 1 AS ok");

    return NextResponse.json({
      connected: true,
      test: result.recordset?.[0],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        connected: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

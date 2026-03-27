import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import sql from "@/config/db";

export const runtime = "nodejs";

const SESSION_COOKIE = "inv_suite_session";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const pool = await connectDB();
    const result = await pool
      .request()
      .input("Username", sql.VarChar(25), username)
      .input("Password", sql.VarChar(30), password)
      .execute("spDeliveryLogin");

    const user = result.recordset?.[0] as
      | { uid?: number; username?: string; pgid?: number; role?: string }
      | undefined;

    if (result.returnValue !== 0 || !user?.uid) {
      return NextResponse.json(
        { ok: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        uid: Number(user.uid),
        username: String(user.username ?? username).trim(),
        pgid: Number(user.pgid ?? 0),
        role: String(user.role ?? "").trim(),
      },
    });

    response.cookies.set(
      SESSION_COOKIE,
      JSON.stringify({
        uid: Number(user.uid),
        username: String(user.username ?? username).trim(),
        pgid: Number(user.pgid ?? 0),
        role: String(user.role ?? "").trim(),
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 12,
      }
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

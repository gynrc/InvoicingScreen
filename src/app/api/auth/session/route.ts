import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "inv_suite_session";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (!raw) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  try {
    const user = JSON.parse(raw) as {
      uid: number;
      username: string;
      pgid: number;
      role: string;
    };

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
}

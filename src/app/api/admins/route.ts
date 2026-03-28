import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  readAdmins,
  writeAdmins,
  hasEdgeConfigPersistence,
  type AdminUser,
} from "@/lib/edge-config";

export type { AdminUser };

export async function GET() {
  const admins = await readAdmins();
  return NextResponse.json(admins);
}

export async function POST(request: Request) {
  // Require an authenticated admin session
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = (await request.json()) as AdminUser[];

    const saved = await writeAdmins(admins);
    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save admin data." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, persisted: hasEdgeConfigPersistence() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.category.findFirst({ take: 1 });
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { error: "Keep-alive query failed" },
      { status: 500 }
    );
  }
}

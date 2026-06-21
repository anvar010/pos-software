import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

// Deleting a category sets affected products' categoryId to null (schema rule).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

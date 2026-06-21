import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { categoryInputSchema } from "@/lib/validations";
import { serializeCategory } from "@/lib/serialize";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories.map(serializeCategory));
}

export async function POST(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json(serializeCategory(category), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }
    throw e;
  }
}

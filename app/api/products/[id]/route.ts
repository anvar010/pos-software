import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { productUpdateSchema } from "@/lib/validations";
import { serializeProduct } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeProduct(product));
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json(serializeProduct(product));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (e.code === "P2002") {
        const field = (e.meta?.target as string[])?.join(", ") ?? "field";
        return NextResponse.json(
          { error: `A product with this ${field} already exists.` },
          { status: 409 }
        );
      }
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      // Product referenced by sale items — block hard delete.
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "Cannot delete: this product has sales history." },
          { status: 409 }
        );
      }
    }
    throw e;
  }
}

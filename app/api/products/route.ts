import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { productInputSchema } from "@/lib/validations";
import { serializeProduct } from "@/lib/serialize";

// GET /api/products?search=&categoryId=&lowStock=1
export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();
  const lowStock = searchParams.get("lowStock") === "1";

  const where: Prisma.ProductWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  let products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  if (lowStock) {
    products = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  }

  return NextResponse.json(products.map(serializeProduct));
}

// POST /api/products
export async function POST(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const field = (e.meta?.target as string[])?.join(", ") ?? "field";
      return NextResponse.json(
        { error: `A product with this ${field} already exists.` },
        { status: 409 }
      );
    }
    throw e;
  }
}

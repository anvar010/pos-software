import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { stockAdjustSchema } from "@/lib/validations";
import { serializeProduct } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

// POST /api/products/[id]/stock  — adjust stock and write an InventoryLog entry.
export async function POST(req: NextRequest, { params }: Params) {
  const { session, error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = stockAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { changeAmount, reason, note } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { stockQuantity: { increment: changeAmount } },
        include: { category: true },
      });
      await tx.inventoryLog.create({
        data: {
          productId: id,
          changeAmount,
          reason,
          note,
          userId: session.user.id,
        },
      });
      return product;
    });
    return NextResponse.json(serializeProduct(updated));
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

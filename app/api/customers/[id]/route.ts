import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { customerUpdateSchema } from "@/lib/validations";
import { serializeCustomer, serializeSale } from "@/lib/serialize";
import type { CustomerDetailDTO } from "@/types";

type Params = { params: Promise<{ id: string }> };

// GET returns the customer plus purchase history.
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        include: { items: { include: { product: true } }, customer: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sales = customer.sales.map(serializeSale);
  const detail: CustomerDetailDTO = {
    ...serializeCustomer(customer),
    sales,
    saleCount: sales.length,
    totalSpent: sales.reduce((s, x) => s + x.totalAmount, 0),
  };
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
    return NextResponse.json(serializeCustomer(customer));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}

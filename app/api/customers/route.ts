import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { customerInputSchema } from "@/lib/validations";
import { serializeCustomer } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const search = new URL(req.url).searchParams.get("search")?.trim();
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers.map(serializeCustomer));
}

export async function POST(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = customerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const customer = await prisma.customer.create({ data: parsed.data });
  return NextResponse.json(serializeCustomer(customer), { status: 201 });
}

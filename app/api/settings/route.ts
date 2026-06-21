import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { storeUpdateSchema } from "@/lib/validations";
import { serializeStore } from "@/lib/serialize";

async function getOrCreateStore() {
  return prisma.store.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store" },
  });
}

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;
  const store = await getOrCreateStore();
  return NextResponse.json(serializeStore(store));
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = storeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  await getOrCreateStore();
  const store = await prisma.store.update({
    where: { id: "store" },
    data: parsed.data,
  });
  return NextResponse.json(serializeStore(store));
}

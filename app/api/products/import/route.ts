import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/api-auth";
import { csvProductRowSchema } from "@/lib/validations";

// POST /api/products/import  — body: { rows: Array<Record<string, unknown>> }
// Upserts products by SKU. Categories are matched/created by name.
export async function POST(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const rows = body?.rows;
  if (!Array.isArray(rows)) {
    return NextResponse.json(
      { error: "Expected a `rows` array." },
      { status: 422 }
    );
  }
  if (rows.length > 5000) {
    return NextResponse.json(
      { error: "Too many rows (max 5000 per import)." },
      { status: 422 }
    );
  }

  // Cache categories by lowercased name to avoid duplicate lookups/creates.
  const categoryCache = new Map<string, string>();
  const existing = await prisma.category.findMany();
  for (const c of existing) categoryCache.set(c.name.toLowerCase(), c.id);

  async function resolveCategoryId(name: string | null | undefined) {
    if (!name) return null;
    const key = name.toLowerCase();
    const cached = categoryCache.get(key);
    if (cached) return cached;
    const created = await prisma.category.create({ data: { name } });
    categoryCache.set(key, created.id);
    return created.id;
  }

  let created = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = csvProductRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      errors.push({
        row: i + 1,
        message: parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; "),
      });
      continue;
    }

    const r = parsed.data;
    try {
      const categoryId = await resolveCategoryId(r.category);
      const data = {
        name: r.name,
        sku: r.sku,
        barcode: r.barcode ?? null,
        price: r.price,
        costPrice: r.costPrice,
        stockQuantity: r.stockQuantity,
        lowStockThreshold: r.lowStockThreshold,
        taxRate: r.taxRate,
        categoryId,
      };
      const result = await prisma.product.upsert({
        where: { sku: r.sku },
        update: data,
        create: data,
      });
      // upsert doesn't tell us which path ran; detect by timestamps.
      if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
      else updated++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      errors.push({ row: i + 1, message });
    }
  }

  return NextResponse.json({ created, updated, errors, total: rows.length });
}

import type { Prisma } from "@prisma/client";
import type {
  CategoryDTO,
  CustomerDTO,
  PaymentMethod,
  PaymentSplit,
  ProductDTO,
  SaleDTO,
  SaleStatus,
  StoreDTO,
} from "@/types";
import type { Customer, Store } from "@prisma/client";

export function serializeCustomer(c: Customer): CustomerDTO {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    loyaltyPoints: c.loyaltyPoints,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeStore(s: Store): StoreDTO {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    phone: s.phone,
    email: s.email,
    logoUrl: s.logoUrl,
    currency: s.currency,
    defaultTaxRate: Number(s.defaultTaxRate),
    loyaltyRate: Number(s.loyaltyRate),
    lowStockDefault: s.lowStockDefault,
    receiptFooter: s.receiptFooter,
  };
}

// Prisma row with the category relation optionally included.
type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export function serializeCategory(c: { id: string; name: string }): CategoryDTO {
  return { id: c.id, name: c.name };
}

export function serializeProduct(p: ProductWithCategory): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    price: Number(p.price),
    costPrice: Number(p.costPrice),
    unit: p.unit,
    categoryId: p.categoryId,
    category: p.category ? serializeCategory(p.category) : null,
    stockQuantity: Number(p.stockQuantity),
    lowStockThreshold: p.lowStockThreshold,
    imageUrl: p.imageUrl,
    taxRate: Number(p.taxRate),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    items: { include: { product: true } };
    customer: true;
    user: true;
  };
}>;

export function serializeSale(s: SaleWithRelations): SaleDTO {
  return {
    id: s.id,
    localId: s.localId,
    customerId: s.customerId,
    customerName: s.customer?.name ?? null,
    userId: s.userId,
    userName: s.user?.name ?? null,
    totalAmount: Number(s.totalAmount),
    discountAmount: Number(s.discountAmount),
    taxAmount: Number(s.taxAmount),
    paymentMethod: s.paymentMethod as PaymentMethod,
    payments: (s.payments as PaymentSplit[] | null) ?? null,
    status: s.status as SaleStatus,
    isSyncedFromOffline: s.isSyncedFromOffline,
    createdAt: s.createdAt.toISOString(),
    items: s.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product?.name ?? "(deleted)",
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      discountAmount: Number(it.discountAmount),
      subtotal: Number(it.subtotal),
    })),
  };
}

import { z } from "zod";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

// --- Products --------------------------------------------------------------
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  barcode: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  price: z.coerce.number().nonnegative("Price must be ≥ 0"),
  costPrice: z.coerce.number().nonnegative().default(0),
  categoryId: z.preprocess(emptyToNull, z.string().nullable()),
  stockQuantity: z.coerce.number().int("Stock must be a whole number").default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  imageUrl: z.preprocess(emptyToNull, z.string().nullable()),
  taxRate: z.coerce.number().nonnegative().max(100).default(0),
});

export const productUpdateSchema = productInputSchema.partial();

export type ProductInput = z.infer<typeof productInputSchema>;

// --- Stock adjustment ------------------------------------------------------
export const stockAdjustSchema = z.object({
  changeAmount: z
    .coerce.number()
    .int()
    .refine((n) => n !== 0, "Change amount cannot be zero"),
  reason: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]).default("ADJUSTMENT"),
  note: z.string().trim().optional(),
});

// --- Store / settings ------------------------------------------------------
export const storeUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  phone: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  email: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  logoUrl: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  currency: z.string().trim().min(1).max(8).optional(),
  defaultTaxRate: z.coerce.number().nonnegative().max(100).optional(),
  loyaltyRate: z.coerce.number().nonnegative().optional(),
  lowStockDefault: z.coerce.number().int().nonnegative().optional(),
  receiptFooter: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});

// --- Categories ------------------------------------------------------------
export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
});

// --- CSV import row (category referenced by name) --------------------------
export const csvProductRowSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  barcode: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
  price: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative().optional().default(0),
  category: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
  stockQuantity: z.coerce.number().int().optional().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional().default(5),
  taxRate: z.coerce.number().nonnegative().max(100).optional().default(0),
});

export type CsvProductRow = z.infer<typeof csvProductRowSchema>;

// --- Customers -------------------------------------------------------------
export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.preprocess(emptyToNull, z.string().trim().nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().nullable()),
});

export const customerUpdateSchema = customerInputSchema.partial();

// --- Sales -----------------------------------------------------------------
export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  lineDiscount: z.coerce.number().nonnegative().default(0),
});

export const paymentSplitSchema = z.object({
  method: z.enum(["CASH", "CARD", "DIGITAL_WALLET"]),
  amount: z.coerce.number().nonnegative(),
});

export const saleInputSchema = z.object({
  localId: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  items: z.array(saleItemInputSchema).min(1, "Cart is empty"),
  cartDiscount: z.coerce.number().nonnegative().default(0),
  paymentMethod: z
    .enum(["CASH", "CARD", "DIGITAL_WALLET", "SPLIT"])
    .default("CASH"),
  payments: z.array(paymentSplitSchema).optional(),
  isOffline: z.boolean().optional().default(false),
  createdAt: z.string().optional(),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

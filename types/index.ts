// Shared DTO types — plain JSON-safe shapes returned by API routes.
// Prisma Decimal/Date fields are converted to number/string for the client.

export interface CategoryDTO {
  id: string;
  name: string;
}

export interface StoreDTO {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  currency: string;
  defaultTaxRate: number;
  loyaltyRate: number;
  lowStockDefault: number;
  receiptFooter: string | null;
}

export type PaymentMethod = "CASH" | "CARD" | "DIGITAL_WALLET" | "SPLIT";
export type SaleStatus = "COMPLETED" | "REFUNDED" | "PENDING_REVIEW";

export interface PaymentSplit {
  method: "CASH" | "CARD" | "DIGITAL_WALLET";
  amount: number;
}

export interface SaleItemDTO {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface SaleDTO {
  id: string;
  localId: string | null;
  customerId: string | null;
  customerName: string | null;
  userId: string;
  userName: string | null;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[] | null;
  status: SaleStatus;
  isSyncedFromOffline: boolean;
  createdAt: string;
  items: SaleItemDTO[];
}

export interface CustomerDTO {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface CustomerDetailDTO extends CustomerDTO {
  sales: SaleDTO[];
  totalSpent: number;
  saleCount: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  costPrice: number;
  unit: string;
  baseQty: number;
  categoryId: string | null;
  category: CategoryDTO | null;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
}

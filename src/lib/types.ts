export type Role =
  | 'SYS_ADMIN'
  | 'OPS_DIRECTOR'
  | 'PURCHASING'
  | 'BRANCH_MANAGER'
  | 'INVENTORY_STAFF'
  | 'CASHIER'
  | 'FINANCE';

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type POStatus = 'OPEN' | 'PARTIAL' | 'FULFILLED';

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  branch?: Branch | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  unitPrice: number;
  unitOfMeasure: string;
  isActive: boolean;
}

export interface BranchInventoryItem {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  branch?: Branch;
  product?: Product;
  isLowStock?: boolean;
}

export interface SaleItemData {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleData {
  id?: string;
  branchId: string;
  cashierId: string;
  customerName?: string;
  customerPhone?: string;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card';
  createdAt?: string | Date;
  items: SaleItemData[];
}

export interface StockTransferData {
  id: string;
  sendingBranchId: string;
  sendingBranch?: Branch;
  receivingBranchId: string;
  receivingBranch?: Branch;
  productId: string;
  product?: Product;
  quantity: number;
  status: TransferStatus;
  createdAt: string | Date;
}

export interface SupplierData {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
}

export interface PurchaseOrderItemData {
  id?: string;
  productId: string;
  product?: Product;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface PurchaseOrderData {
  id: string;
  supplierId: string;
  supplier?: SupplierData;
  branchId: string;
  branch?: Branch;
  status: POStatus;
  createdAt: string | Date;
  items: PurchaseOrderItemData[];
}

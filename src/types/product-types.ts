export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status?: "active" | "inactive" | "out-of-stock";
  description: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  totalToShip?: number;
  toShipItems?: ToShipItem[];
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
}

export interface ToShipItem {
  _id: string;
  quantity: number;
  markedDate: string;
  markedBy: {
    name: string;
    email: string;
    role: string;
  };
  status: "pending" | "shipped" | "cancelled";
}

export interface ToShipProduct {
  _id: string;
  productId: string;
  productName: string;
  productSku: string;
  productCategory: string;
  productPrice: number;
  productImage?: string;
  productDescription: string;
  currentStock: number;
  quantityToShip: number;
  markedDate: string;
  markedBy: {
    name: string;
    email: string;
    role: string;
  };
  status: "pending" | "shipped" | "cancelled";
  availableStock: number;
}

export interface SaleHistory {
  _id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  soldBy: {
    name: string;
    email: string;
  };
  notes?: string;
  saleType: string;
  status: string;
}

export interface FormData {
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  image: string;
}

export type ProductStatus = "available" | "inactive" | "sold-out";
export type ModalType = "update" | "delete" | "sell" | "to-ship" | null;

export interface SaleHistory {
  _id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  quantitySold: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  soldBy: {
    name: string;
    email: string;
  };
  notes?: string;
  saleType: string;
  status: string;
}

export interface UpdateForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export interface SellForm {
  quantity: number;
  notes: string;
}

export interface ToShipForm {
  quantity: number;
}

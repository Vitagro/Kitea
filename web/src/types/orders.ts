import { Location } from "./index";

export type OrderStatus = "PENDING" | "CONSOLIDATED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  reference: string;
  origin: Location;
  destination: Location;
  volumeM3: number;
  weightKg: number;
  isFragile: boolean;
  isStackable: boolean;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  status: OrderStatus;
  erpSourceRef?: string | null;
}

export interface ImportResult {
  totalRows: number;
  created?: number;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors: { row: number; message: string }[];
}

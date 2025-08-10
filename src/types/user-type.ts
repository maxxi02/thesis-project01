import { LucideIcon } from "lucide-react";

// types/user.ts
export type UserRole = "admin" | "cashier" | "delivery" | "user";

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
  banned?: boolean;
  image?: string;
}

export interface RoleConfig {
  value: UserRole;
  label: string;
  variant: "destructive" | "default" | "secondary" | "outline";
  icon: LucideIcon;
  description: string;
}

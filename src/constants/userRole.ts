// constants/userRoles.ts
import { RoleConfig, UserRole } from "@/types/user-type";
import { Crown, CreditCard, Truck, Users } from "lucide-react";

export const roles: RoleConfig[] = [
  {
    value: "admin" as UserRole,
    label: "Admin",
    variant: "destructive" as const,
    icon: Crown,
    description: "Full system access",
  },
  {
    value: "cashier" as UserRole,
    label: "Cashier",
    variant: "default" as const,
    icon: CreditCard,
    description: "Point of sale access",
  },
  {
    value: "delivery" as UserRole,
    label: "Delivery",
    variant: "secondary" as const,
    icon: Truck,
    description: "Delivery management",
  },
  {
    value: "user" as UserRole,
    label: "User",
    variant: "outline" as const,
    icon: Users,
    description: "Basic user access",
  },
];

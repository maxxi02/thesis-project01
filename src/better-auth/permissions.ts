import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";  

export const statement = {
  ...defaultStatements,
  products: ["create", "read", "update", "delete", "sell"],
  orders: ["create", "read", "update", "delete"],
  shipments: ["create", "read", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

export const admin = ac.newRole({
  products: ["create", "read", "update", "delete", "sell"],
  orders: ["create", "read", "update", "delete"],
  shipments: ["create", "read", "update", "delete"],
  ...adminAc.statements, 
});

export const cashier = ac.newRole({
  products: ["read", "sell"],
  orders: ["create", "read"],
  user: ["list"],  
});

export const delivery = ac.newRole({
  products: ["read"],
  orders: ["read"],
  shipments: ["read", "update"],
});

export const user = ac.newRole({
  products: ["read"],
  orders: ["read"],
});

export { ac };
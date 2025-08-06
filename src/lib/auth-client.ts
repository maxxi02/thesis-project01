import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/plugins";
import { adminClient } from "better-auth/client/plugins";
import {
  admin,
  cashier,
  delivery,
  user,
  ac,
} from "@/better-auth-plugins/permissions";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.BETTER_AUTH_URL
    : process.env.NEXT_PUBLIC_URL;

export const authClient = createAuthClient({
  baseURL: baseUrl as string,
  plugins: [
    twoFactorClient(),
    adminClient({
      ac,
      roles: {
        admin,
        user,
        cashier,
        delivery,
      },
    }),
  ],
});

export const { signIn, signUp, useSession, signOut } = createAuthClient();

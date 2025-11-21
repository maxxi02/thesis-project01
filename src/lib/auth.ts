import { betterAuth } from "better-auth";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/database/mongodb";
import { admin, cashier, delivery, user, ac } from "@/better-auth/permissions";
import { getBrevo } from "./resend/resend";

const brevo = getBrevo();

const emailRateLimitStorage = {
  get: async (key: string) => {
    // Check if this is a sign-in request by looking at the key pattern
    if (key.includes('/sign-in/email')) {
      // Don't use IP-based key for sign-in
      return null;
    }
    const collection = db.collection("rateLimit");
    const result = await collection.findOne({ key });
    return result ? { count: result.count, lastRequest: result.lastRequest } : null;
  },
  set: async (key: string, value: { count: number; lastRequest: number }) => {
    // Skip storing IP-based keys for sign-in
    if (key.includes('/sign-in/email')) {
      return;
    }
    const collection = db.collection("rateLimit");
    await collection.updateOne(
      { key },
      { $set: { ...value, key } },
      { upsert: true }
    );
  },
};

export const auth = betterAuth({
  database: mongodbAdapter(db),
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
    },
  },
  trustedOrigins: [
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_URL!
      : process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_URL || "https://www.lgwhardware.online",
  ],
  appName: "LGW Warehouse",
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 10,
    customRules: {
      "/two-factor/*": {
        window: 10,
        max: 5,
      },
      "/two-factor/send-otp": {
        window: 60,
        max: 5,
      },
    },
  },
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await brevo.sendTransacEmail({
        sender: { 
          email: process.env.SENDER_EMAIL!, 
          name: "LGW Warehouse" 
        },
        to: [{ email: user.email }],
        subject: "Reset your password",
        htmlContent: `<html><body><p>Click the link to reset your password:</p><p><a href="${url}">${url}</a></p></body></html>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await brevo.sendTransacEmail({
        sender: { 
          email: process.env.SENDER_EMAIL!, 
          name: "LGW Warehouse" 
        },
        to: [{ email: user.email }],
        subject: "Verify your email address",
        htmlContent: `<html><body><p>Click the link to verify your email:</p><p><a href="${url}">${url}</a></p></body></html>`,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url }) => {
        await brevo.sendTransacEmail({
          sender: { 
            email: process.env.SENDER_EMAIL!, 
            name: "LGW Warehouse" 
          },
          to: [{ email: user.email }],
          subject: "Approve email change",
          htmlContent: `<html><body><p>Click the link to approve the change:</p><p><a href="${url}">${url}</a></p></body></html>`,
        });
      },
    },
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        cashier,
        delivery,
        user,
      },
    }),
    twoFactor({
      skipVerificationOnEnable: true,
      otpOptions: {
        async sendOTP({ user, otp }) {
          await brevo.sendTransacEmail({
            sender: { 
              email: process.env.SENDER_EMAIL!, 
              name: "LGW Warehouse" 
            },
            to: [{ email: user.email }],
            subject: "2FA Verification",
            htmlContent: `<html><body><p>Your verification code:</p><h2>${otp}</h2></body></html>`,
          });
        },
      },
    }),
    nextCookies(),
  ],
});
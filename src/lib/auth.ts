import { betterAuth } from "better-auth";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/database/mongodb";
import { getResend } from "./resend/resend";
import { admin, cashier, delivery, user, ac } from "@/better-auth/permissions";

const resend = getResend();

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
    process.env.NEXT_PUBLIC_URL || "https://lgw123.vercel.app/",
  ],
  appName: "LGW Warehouse",
  rateLimit: {
    // Only enable rate limiting in production where IP headers are available
    // enabled: process.env.NODE_ENV === "production",
    enabled: true,
    // Store rate limit data in MongoDB instead of memory
    storage: "database",
    modelName: "rateLimit", // Collection name in MongoDB
    window: 60, // 60 seconds
    max: 10, // 10 requests per window
    customRules: {
      "/sign-in/email": {
        window: 60, // 60 seconds
        max: 5, // 5 login attempts per minute per IP
      },
      "/two-factor/*": async () => {
        // custom function to return rate limit window and max
        return {
          window: 10,
          max: 5,
        };
      },
      "/two-factor/send-otp": {
        window: 60,
        max: 5, // Limit OTP sending to prevent spam
      },
    },
  },
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: `LGW Warehouse <${process.env.SENDER_EMAIL!}>`,
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: `LGW Warehouse <${process.env.SENDER_EMAIL!}>`,
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url }) => {
        await resend.emails.send({
          from: `LGW Warehouse <${process.env.SENDER_EMAIL!}>`,
          to: user.email,
          subject: "Approve email change",
          text: `Click the link to approve the change: ${url}`,
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
          await resend.emails.send({
            from: `LGW Warehouse <${process.env.SENDER_EMAIL!}>`,
            to: user.email,
            subject: "2FA Verification",
            text: `Verify your OTP: ${otp}`,
          });
        },
      },
    }),
    nextCookies(),
  ],
});

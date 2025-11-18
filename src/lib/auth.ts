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
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 10,
    customRules: {
      "/sign-in/email": async (request) => {
        // Extract email from request body
        const body = await request.json();
        const email = body.email;

        if (email) {
          // Use email as the rate limit key instead of IP
          return {
            window: 60,
            max: 5,
            key: `email:${email}`, // Custom key based on email
          };
        }

        // Fallback to default IP-based rate limiting
        return {
          window: 60,
          max: 5,
        };
      },
      "/two-factor/send-otp": async (request) => {
        // For 2FA, you can get the email from the session
        // Since the user is already authenticated at this point
        const session = request.headers.get("cookie");
        // Parse session to get user email if needed
        return {
          window: 60,
          max: 5,
          key: session ? `otp:${session}` : undefined, // Use session-based key
        };
      },
      "/two-factor/verify-totp": {
        window: 10,
        max: 5,
      },
      "/two-factor/verify-otp": {
        window: 10,
        max: 5,
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

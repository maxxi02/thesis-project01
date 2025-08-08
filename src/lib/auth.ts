import { betterAuth } from "better-auth";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/database/mongodb";
import { getResend } from "./resend/resend";

const resend = getResend();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  trustedOrigins: [
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_URL!
      : process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_URL || "https://lgw123.vercel.app/",
  ],
  appName: "LGW Warehouse",
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
      adminRoles: ["admin"],
      defaultRole: "user",
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

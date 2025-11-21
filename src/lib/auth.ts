import { betterAuth } from "better-auth";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/database/mongodb";
import { admin, cashier, delivery, user, ac } from "@/better-auth/permissions";
import { sendEmail } from "./resend/brevo";

const emailRateLimitStorage = {
  get: async (key: string) => {
    // Check if this is a sign-in request by looking at the key pattern
    if (key.includes("/sign-in/email")) {
      // Don't use IP-based key for sign-in
      return null;
    }
    const collection = db.collection("rateLimit");
    const result = await collection.findOne({ key });
    return result
      ? { count: result.count, lastRequest: result.lastRequest }
      : null;
  },
  set: async (key: string, value: { count: number; lastRequest: number }) => {
    // Skip storing IP-based keys for sign-in
    if (key.includes("/sign-in/email")) {
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
      await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Reset your password - LGW Warehouse",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Reset Your Password</h2>
              <p>Hello${user.name ? ` ${user.name}` : ""},</p>
              <p>You requested to reset your password for your LGW Warehouse account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="margin: 30px 0;">
                <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${url}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </body>
          </html>
        `,
        textContent: `Reset Your Password\n\nHello${user.name ? ` ${user.name}` : ""},\n\nYou requested to reset your password for your LGW Warehouse account.\n\nClick the link below to reset your password:\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: process.env.BREVO_SENDER_NAME || "LGW Warehouse",
        },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Verify your email address - LGW Warehouse",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Verify Your Email Address</h2>
              <p>Hello${user.name ? ` ${user.name}` : ""},</p>
              <p>Welcome to LGW Warehouse! Please verify your email address to complete your registration.</p>
              <div style="margin: 30px 0;">
                <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all;">${url}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </body>
          </html>
        `,
        textContent: `Verify Your Email Address\n\nHello${user.name ? ` ${user.name}` : ""},\n\nWelcome to LGW Warehouse! Please verify your email address to complete your registration.\n\nClick the link below:\n${url}\n\nIf you didn't create an account, you can safely ignore this email.`,
        sender: {
          email: process.env.BREVO_SENDER_EMAIL!,
          name: process.env.BREVO_SENDER_NAME || "LGW Warehouse",
        },
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, url }) => {
        await sendEmail({
          to: [{ email: user.email, name: user.name }],
          subject: "Approve email change - LGW Warehouse",
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Approve Email Change</h2>
                <p>Hello${user.name ? ` ${user.name}` : ""},</p>
                <p>You requested to change your email address for your LGW Warehouse account.</p>
                <p>Click the button below to approve this change:</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Approve Change</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${url}</p>
                <p style="margin-top: 30px; color: #666; font-size: 14px;">If you didn't request this change, please contact support immediately.</p>
              </div>
            </body>
            </html>
          `,
          textContent: `Approve Email Change\n\nHello${user.name ? ` ${user.name}` : ""},\n\nYou requested to change your email address for your LGW Warehouse account.\n\nClick the link below to approve this change:\n${url}\n\nIf you didn't request this change, please contact support immediately.`,
          sender: {
            email: process.env.BREVO_SENDER_EMAIL!,
            name: process.env.BREVO_SENDER_NAME || "LGW Warehouse",
          },
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
          await sendEmail({
            to: [{ email: user.email, name: user.name }],
            subject: "Your 2FA Verification Code - LGW Warehouse",
            htmlContent: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Two-Factor Authentication</h2>
                  <p>Hello${user.name ? ` ${user.name}` : ""},</p>
                  <p>Your verification code for LGW Warehouse is:</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                    <h1 style="color: #2563eb; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                  </div>
                  <p style="color: #666;">This code will expire in 10 minutes.</p>
                  <p style="margin-top: 30px; color: #666; font-size: 14px;">If you didn't request this code, please secure your account immediately.</p>
                </div>
              </body>
              </html>
            `,
            textContent: `Two-Factor Authentication\n\nHello${user.name ? ` ${user.name}` : ""},\n\nYour verification code for LGW Warehouse is:\n\n${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please secure your account immediately.`,
            sender: {
              email: process.env.BREVO_SENDER_EMAIL!,
              name: process.env.BREVO_SENDER_NAME || "LGW Warehouse",
            },
          });
        },
      },
    }),
    nextCookies(),
  ],
});
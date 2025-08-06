import { betterAuth } from "better-auth";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "@/database/mongodb";
export const auth = betterAuth({
  database: mongodbAdapter(db),
  trustedOrigins: [
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_URL!
      : process.env.BETTER_AUTH_URL!,
  ],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
    twoFactor({
      skipVerificationOnEnable: true,
      //   otpOptions: {
      //     async sendOTP({ user, otp }) {
      //       await resend.emails.send({
      //         from: `LGW Warehouse <${SENDER_EMAIL}>`,
      //         to: user.email, // verification email must be sent to the current user email to approve the change
      //         subject: "2FA Verification",
      //         text: `Verify your OTP: ${otp}`,
      //       });
      //     },
      //   },
    }),
    nextCookies(),
  ],
});

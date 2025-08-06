"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Verification code must be 6 digits." })
    .max(6, { message: "Verification code must be 6 digits." })
    .regex(/^\d+$/, {
      message: "Verification code must contain only numbers.",
    }),
});

export function TwoFactorVerificationForm({
  className,
  email,
  onBack,
  ...props
}: React.ComponentProps<"div"> & {
  email?: string;
  password?: string;
  onBack?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { push } = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Complete the 2FA verification
      const { error } = await authClient.twoFactor.verifyOtp({
        code: values.code,
      });
      if (error) {
        toast.error("Error", {
          description: "Failed to verify",
          richColors: true,
        });
      }
      toast.success("Success", {
        description: "Two-factor authentication verified successfully",
        richColors: true,
      });

      // Redirect to dashboard after successful verification
      push("/dashboard");
    } catch (error) {
      toast.error("Error", {
        description:
          (error as Error).message ||
          "Invalid verification code. Please try again.",
        richColors: true,
      });
      console.error("2FA verification error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!email || countdown > 0) return;

    try {
      setIsResending(true);

      // Resend the 2FA code
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        console.log("Something went wrong resending the code");
      }

      toast.success("Success", {
        description: "Verification code sent to your device",
        richColors: true,
      });

      // Start 60-second countdown
      setCountdown(60);
    } catch (error) {
      toast.error("Error", {
        description:
          (error as Error).message ||
          "Failed to resend verification code. Please try again.",
        richColors: true,
      });
      console.error("Resend 2FA error:", error);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter 6 digit code that we sent from your email.
        </p>
        {email && (
          <p className="text-xs text-muted-foreground">Signed in as: {email}</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 ">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
        </form>
      </Form>

      <div className="flex flex-col gap-4">
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            className="text-sm"
          >
            {isResending
              ? "Sending..."
              : countdown > 0
                ? `Resend code in ${countdown}s`
                : "Resend verification code"}
          </Button>
        </div>

        <div className="text-center text-sm space-y-2">
          {onBack && (
            <div>
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-sm p-0 h-auto"
              >
                ← Back to sign in
              </Button>
            </div>
          )}
          <div>
            Need help?{" "}
            <Link href="/support" className="underline underline-offset-4">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

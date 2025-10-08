"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signInSchema } from "@/schemas/schema";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const formSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Verification code must be 6 digits." })
    .max(6, { message: "Verification code must be 6 digits." })
    .regex(/^\d+$/, {
      message: "Verification code must contain only numbers.",
    }),
});

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<"totp" | "otp" | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const verificationForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    try {
      const { email, password } = values;
      await authClient.signIn.email(
        { email: email, password: password },
        {
          onSuccess: async (ctx) => {
            if (ctx.data.twoFactorRedirect) {
              setEmail(email);
              setShow2FAModal(true);
            } else {
              router.push("/dashboard");
            }
          },
          onError: async (ctx) => {
            toast.error("Error", {
              description: ctx.error.message || "Error logging in",
              richColors: true,
            });
          },
        }
      );
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
        richColors: true,
      });
      console.error(error);
    }
  }

  const handleChooseMethod = async (method: "totp" | "otp") => {
    setCurrentMethod(method);
    if (method === "otp") {
      try {
        await authClient.twoFactor.sendOtp();
        setOtpSent(true);
        setCountdown(60);
      } catch (error) {
        toast.error("Error", {
          description: "Failed to send code",
          richColors: true,
        });
        setCurrentMethod(null);
        return;
      }
    }
  };

  const handleVerifyCode = async (values: z.infer<typeof formSchema>) => {
    setIsVerifying(true);
    try {
      let result;
      if (currentMethod === "totp") {
        result = await authClient.twoFactor.verifyTotp({ code: values.code });
      } else {
        result = await authClient.twoFactor.verifyOtp({ code: values.code });
      }
      if (result.error) {
        throw result.error;
      }
      setShow2FAModal(false);
      setCurrentMethod(null);
      toast.success("Success", {
        description: "Two-factor authentication verified successfully",
        richColors: true,
      });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Error", {
        description:
          (error as Error).message ||
          "Invalid verification code. Please try again.",
        richColors: true,
      });
      console.error("2FA verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;
    try {
      setIsResending(true);
      const { error } = await authClient.twoFactor.sendOtp();
      if (error) {
        throw error;
      }
      toast.success("Success", {
        description: "Verification code sent to your email",
        richColors: true,
      });
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
  };

  const handleBackToChoice = () => {
    setCurrentMethod(null);
    verificationForm.reset();
    if (currentMethod === "otp") {
      setOtpSent(false);
      setCountdown(0);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="••••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Login"}
          </Button>
        </form>
      </Form>

      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Choose a verification method to complete your login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {currentMethod === null ? (
              <div className="flex flex-col gap-3">
                <Button onClick={() => handleChooseMethod("totp")}>
                  Use Authenticator App
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleChooseMethod("otp")}
                >
                  Use Email Code
                </Button>
              </div>
            ) : (
              <>
                <Form {...verificationForm}>
                  <form
                    onSubmit={verificationForm.handleSubmit(handleVerifyCode)}
                    className="space-y-4"
                  >
                    <FormField
                      control={verificationForm.control}
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
                    {currentMethod === "otp" && (
                      <p className="text-xs text-muted-foreground text-center">
                        Signed in as: {email}
                      </p>
                    )}
                    <DialogFooter className="">
                      <div className="flex flex-col items-center w-full gap-4">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isVerifying}
                        >
                          {isVerifying ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {isVerifying ? "Verifying..." : "Verify Code"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBackToChoice}
                          disabled={isVerifying}
                          className="w-full"
                        >
                          Back
                        </Button>
                      </div>
                    </DialogFooter>
                  </form>
                </Form>
                {currentMethod === "otp" && (
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
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      agreeToTerms: false,
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
                    placeholder="nivekamures@example.com"
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
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer inline">
                    I agree to the{" "}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="underline underline-offset-4 hover:text-primary cursor-pointer"
                    >
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyModal(true);
                      }}
                      className="underline underline-offset-4 hover:text-primary cursor-pointer"
                    >
                      Privacy Policy
                    </span>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>
      {/* 2FA Dialog */}
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
      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy - LGW Warehouse Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold text-lg">1. Introduction</h3>
            <p>
              Welcome to LGW Warehouse Management. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our warehouse management software and related services. By using our Services, you agree to the collection and use of information in accordance with this policy.
            </p>
            <h3 className="font-semibold text-lg">2. Information We Collect</h3>
            <p>
              <strong>Personal Information:</strong> When you create an account or log in, we collect your email address, password, and any other information you provide (e.g., name, company details).
            </p>
            <p>
              <strong>Usage Data:</strong> We collect information about your interactions with the Services, such as login times, accessed features, and device information (e.g., IP address, browser type).
            </p>
            <p>
              <strong>Warehouse Data:</strong> As part of managing your warehouse operations, you may upload or input business data like inventory details, supplier information, and transaction records. This data is considered confidential and belongs to you.
            </p>
            <h3 className="font-semibold text-lg">3. How We Use Your Information</h3>
            <p>
              We use your information to provide and improve the Services, including authenticating users, processing login requests, sending verification codes, and generating reports for inventory management. We may also use it for security, compliance, and communication purposes.
            </p>
            <h3 className="font-semibold text-lg">4. Sharing Your Information</h3>
            <p>
              We do not sell your personal data. We may share it with trusted third-party service providers (e.g., cloud hosting for data storage, email services for OTPs) under strict confidentiality agreements. In cases of legal requirements or business transfers, we may disclose information as necessary.
            </p>
            <h3 className="font-semibold text-lg">5. Data Security</h3>
            <p>
              We implement reasonable security measures, including encryption for sensitive data (e.g., passwords, 2FA codes) and access controls, to protect against unauthorized access. However, no system is completely secure, and we cannot guarantee absolute protection.
            </p>
            <h3 className="font-semibold text-lg">6. Your Rights</h3>
            <p>
              You have the right to access, update, or delete your personal information. Contact us at support@lgwwarehouse.com to exercise these rights. For warehouse data, you can export or delete it via the Services dashboard.
            </p>
            <h3 className="font-semibold text-lg">7. Children&apos;s Privacy</h3>
            <p>
              Our Services are not intended for children under 13. We do not knowingly collect data from children.
            </p>
            <h3 className="font-semibold text-lg">8. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy periodically. Changes will be posted here, and significant updates will be notified via email.
            </p>
            <h3 className="font-semibold text-lg">9. Contact Us</h3>
            <p>
              If you have questions, email us at privacy@lgwwarehouse.com. We are located in the Philippines. Effective date: November 09, 2025.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPrivacyModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Terms of Service Dialog */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service - LGW Warehouse Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold text-lg">1. Acceptance of Terms</h3>
            <p>
              By accessing or using LGW Warehouse Management (&quot;Services&quot;), you agree to these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Services. These Terms form a binding agreement between you and LGW Warehouse Management (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <h3 className="font-semibold text-lg">2. Description of Services</h3>
            <p>
              Our Services provide software tools for warehouse management, including inventory tracking, order processing, supplier management, and reporting. We grant you a limited, non-exclusive, revocable license to use the Services for your internal business purposes.
            </p>
            <h3 className="font-semibold text-lg">3. User Accounts</h3>
            <p>
              You must create an account with accurate information. You are responsible for maintaining the confidentiality of your login credentials and all activities under your account. Notify us immediately of any unauthorized use.
            </p>
            <h3 className="font-semibold text-lg">4. User Content and Data</h3>
            <p>
              You retain ownership of data you input (e.g., inventory records). You grant us a worldwide, royalty-free license to host, store, and process this data to provide the Services. Ensure your data complies with applicable laws; we are not liable for your content.
            </p>
            <h3 className="font-semibold text-lg">5. Prohibited Conduct</h3>
            <p>
              You agree not to: a) use the Services for illegal purposes; b) interfere with the Services or other users; c) upload viruses or harmful code; d) attempt to gain unauthorized access; e) reverse-engineer the software.
            </p>
            <h3 className="font-semibold text-lg">6. Fees and Payment</h3>
            <p>
              Our Services may be subject to fees as described on our pricing page. You agree to pay all applicable fees. We may suspend access for non-payment.
            </p>
            <h3 className="font-semibold text-lg">7. Intellectual Property</h3>
            <p>
              All rights, title, and interest in the Services (excluding your user content) are owned by us. You may not copy, modify, or distribute the Services without permission.
            </p>
            <h3 className="font-semibold text-lg">8. Termination</h3>
            <p>
              We may terminate or suspend your access for violation of these Terms. Upon termination, you must cease using the Services.
            </p>
            <h3 className="font-semibold text-lg">9. Disclaimer and Limitation of Liability</h3>
            <p>
              The Services are provided &quot;as is&quot; without warranties. We are not liable for indirect, incidental, or consequential damages, including data loss or business interruptions, to the extent permitted by law. Our total liability shall not exceed fees paid in the prior 12 months.
            </p>
            <h3 className="font-semibold text-lg">10. Changes to Terms</h3>
            <p>
              We may update these Terms. Continued use after changes constitutes acceptance.
            </p>
            <h3 className="font-semibold text-lg">11. Contact Us</h3>
            <p>
              For questions, email support@lgwwarehouse.com. We are located in the Philippines. Effective date: November 09, 2025.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTermsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
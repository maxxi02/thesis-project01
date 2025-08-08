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
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { signupSchema } from "@/schemas/schema";
import { authClient } from "@/lib/auth-client";

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps extends React.ComponentProps<"form"> {
  className?: string;
}

export function SignupForm({ className, ...props }: SignupFormProps) {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  async function onSubmit(values: SignupFormValues) {
    try {
      const { name, email, password, image } = values;
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        image: image || undefined,
      });

      if (result.error) {
        // Handle different error types
        const errorMessage = result.error.message || "Failed to create account";

        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("already registered")
        ) {
          toast.error("Account exists", {
            description:
              "An account with this email already exists. Please sign in instead.",
            richColors: true,
          });
        } else if (errorMessage.includes("verification")) {
          setUserEmail(email);
          setEmailSent(true);
          toast.info("Verification required", {
            description: "Please check your email to verify your account.",
            richColors: true,
          });
        } else {
          toast.error("Signup failed", {
            description: errorMessage,
            richColors: true,
          });
        }
      } else {
        // Success case
        setUserEmail(email);
        setEmailSent(true);
        toast.success("Account Created", {
          description: "Please check your email to verify your account.",
          richColors: true,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while creating your account.",
        richColors: true,
      });
      console.error(error);
    }
  }

  async function handleResendVerification() {
    if (!userEmail) return;

    setIsResending(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email: userEmail,
      });

      if (result.error) {
        toast.error("Error", {
          description:
            result.error.message || "Failed to resend verification email.",
          richColors: true,
        });
      } else {
        toast.success("Email Sent", {
          description: "Verification email has been resent.",
          richColors: true,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "Failed to resend verification email.",
        richColors: true,
      });
    } finally {
      setIsResending(false);
    }
  }

  async function handleGitHubSignUp() {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to sign up with GitHub.",
        richColors: true,
      });
      console.error(error);
    }
  }

  if (emailSent) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              We&#39;ve sent a verification link to <strong>{userEmail}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Next steps:</span>
            </div>
            <ol className="text-left space-y-1 ml-6 list-decimal">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>Return here to sign in</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Resend verification email
            </Button>

            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        </div>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Didn&#39;t receive the email? Check your spam folder or{" "}
            <button
              onClick={handleResendVerification}
              className="underline underline-offset-4 hover:text-foreground"
              disabled={isResending}
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your details below to create your account
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="name">Name</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    id="email"
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
            name="image"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="image">
                  Profile Image URL (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://example.com/your-image.jpg"
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
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    {...field}
                    placeholder="••••••••••"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="grid gap-3">
                <FormLabel htmlFor="confirmPassword">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...field}
                    placeholder="••••••••••"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign Up"}
          </Button>
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={handleGitHubSignUp}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 h-4 w-4"
            >
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Sign up with GitHub
          </Button>
        </div>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}

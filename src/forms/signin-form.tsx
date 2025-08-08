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

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

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

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    try {
      const { email, password } = values;
      await authClient.signIn.email(
        { email: email, password: password },
        {
          onSuccess: async (ctx) => {
            if (ctx.data.twoFactorRedirect) {
              await authClient.twoFactor.sendOtp();
              router.push("/2fa-verification");
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
      // const result = await authClient.signIn.email(values);
      // if (result.data?.token) router.push("/dashboard");
      // if (result.error) {
      //   // Handle error case
      //   toast.error("Error", {
      //     description: result.error.message || "Error logging in",
      //     richColors: true,
      //   });
      // } else {
      //   // Handle success case
      //   // if (result.data?.requiresTwoFactor) {
      //   //   router.push("/2fa-verification");
      //   // } else {
      //   //   router.push("/dashboard");
      //   // }

      //   // Optional: Show success toast
      //   toast.success("Success", {
      //     description: "Logged in successfully",
      //     richColors: true,
      //   });
      // }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
        richColors: true,
      });
      console.error(error);
    }
  }

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

      <div className="text-center text-sm">
        Don&#39;t have an account?{" "}
        <Link href="/sign-up" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}

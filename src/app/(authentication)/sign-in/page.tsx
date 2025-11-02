import { SigninForm } from "@/forms/signin-form";
import Image from "next/image";
import Link from "next/link";

export default function SigninPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-0">
            <Image
              src={"/lgw-logo.png"}
              alt="LGW Logo"
              width={50}
              height={50}
              className="-mr-0"
            />
            <span className="text-xl font-bold tracking-tighter text-foreground">
              LGW Warehouse
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SigninForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          width={500}
          height={500}
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}

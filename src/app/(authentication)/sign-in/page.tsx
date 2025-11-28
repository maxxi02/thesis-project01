import { SigninForm } from "@/forms/signin-form";
import Image from "next/image";
import Link from "next/link";

export default function SigninPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-0">
            <Image
              src={"/lgw-logo.png"}
              alt="LGW Logo"
              width={40}
              height={40}
              className="-mr-0 md:w-[50px] md:h-[50px]"
            />
            <span className="text-lg md:text-xl font-semibold tracking-tighter text-foreground">
              LGW
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
          src="/https://s3-media0.fl.yelpcdn.com/bphoto/lyMB4rxrZ6dBb_ORWRXrEw/1000s.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

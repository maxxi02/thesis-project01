import { getServerSession } from "@/better-auth/action";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="h-screen w-full flex flex-col items-center">
      {session ? (
        <Button>
          <Link href={"/dashboard"}>Dashboard</Link>
        </Button>
      ) : (
        <Button>
          <Link href={"/sign-in"}>Signin</Link>
        </Button>
      )}
    </div>
  );
}

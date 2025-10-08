"use client";
import { Session } from "@/better-auth/auth-types";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

function formatPathnameToTitle(pathname: string): string {
  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/settings": "Settings",
    "/profile": "My Profile",
    "/": "Home",
  };

  return (
    titleMap[pathname] ||
    pathname
      .split("/")[1]
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Home"
  );
}

export function SiteHeader({ session }: { session: Session }) {
  const pathName = usePathname();
  const pageTitle = formatPathnameToTitle(pathName);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right sm:block hidden">
            <p className="text-sm font-medium">{session.user.name}</p>

            <p className="text-xs text-muted-foreground">
              {" "}
              Role:
              <span className="text-black dark:text-[whitesmoke] p-1">
                {session.user.role}
              </span>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage
                  src={session.user.image || "https://github.com/shadcn.png"}
                  className="h-full w-full object-cover rounded-full"
                />
                <AvatarFallback className="h-full w-full flex items-center justify-center text-xs">
                  {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

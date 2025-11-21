"use client";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Box } from "lucide-react";
import { NavProducts } from "../../_components/nav-products";
import { NavDashboard } from "../../_components/nav-dashboard";
import { NavAdmin } from "../../_components/nav-admin";
import { NavSettings } from "../../_components/nav-settings";
import { BiSolidDashboard } from "react-icons/bi";
import { FaTruck, FaClipboardList } from "react-icons/fa6";
import { FaHistory, FaUsers } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { Session } from "@/better-auth/auth-types";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";

type UserWithRole = {
  role?: string;
  id: string;
  email: string;
  name: string;
};

type SessionWithRole = Session & {
  user: UserWithRole;
};

const rolePageAccess = {
  admin: [
    "/dashboard",
    "/manage-product",
    "/history",
    "/manage-users",
    "/settings",
  ],
  cashier: ["/dashboard", "/manage-product", "/settings"],
  delivery: [
    "/deliveries",
    "/deliveries/overview",
    "/deliveries/assignments",
    "/settings",
  ],
  user: ["/settings"],
};

const roleDefaultPage = {
  admin: "/dashboard",
  cashier: "/dashboard",
  delivery: "/deliveries/overview",
  user: "/settings",
};

const checkPageAccess = (
  role: string | undefined,
  currentPath: string
): boolean => {
  if (!role) return false;

  const allowedPages =
    rolePageAccess[role as keyof typeof rolePageAccess] || [];
  return allowedPages.some((page) => currentPath.startsWith(page));
};

const getDefaultPageForRole = (role: string | undefined): string => {
  if (!role) return "/dashboard";
  return roleDefaultPage[role as keyof typeof roleDefaultPage] || "/dashboard";
};

const data = {
  dashboard: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <BiSolidDashboard />,
      roles: ["admin", "cashier"],
    },
  ],
  deliveries: [
    {
      title: "Delivery Overview",
      url: "/deliveries/overview",
      icon: <FaTruck />,
      roles: ["delivery"],
    },
    {
      title: "Assignments",
      url: "/deliveries/assignments",
      icon: <FaClipboardList />,
      roles: ["delivery"],
    },
  ],
  admin: [
    {
      title: "Manage Users",
      url: "/manage-users",
      icon: <FaUsers />,
    },
  ],
  settings: [
    {
      title: "Settings",
      url: "/settings",
      icon: <IoMdSettings />,
    },
  ],
  products: [
    {
      name: "Manage & Assign Products",
      url: "/manage-product",
      icon: <FaClipboardList />,
    },
    {
      name: "History",
      url: "/history",
      icon: <FaHistory />,
    },
  ],
};

const filterItemsByRole = (role: string | undefined) => {
  if (!role)
    return {
      dashboard: [],
      deliveries: [],
      products: [],
      admin: [],
      settings: [],
    };

  const rolePermissions = {
    admin: {
      dashboard: data.dashboard,
      deliveries: [],
      products: data.products,
      admin: data.admin,
      settings: data.settings,
    },
    cashier: {
      dashboard: data.dashboard,
      deliveries: [],
      products: data.products,
      admin: [],
      settings: data.settings,
    },
    delivery: {
      dashboard: [],
      deliveries: data.deliveries,
      products: [],
      admin: [],
      settings: data.settings,
    },
    user: {
      dashboard: [],
      deliveries: [],
      products: [],
      admin: [],
      settings: data.settings,
    },
  };

  return (
    rolePermissions[role as keyof typeof rolePermissions] ||
    rolePermissions.user
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [session, setSession] = React.useState<Session | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await authClient.getSession();
      setSession(data);
    };
    fetchCurrentUser();
  }, []);

  React.useEffect(() => {
    if (session) {
      const userRole = (session as SessionWithRole)?.user?.role;
      const hasAccess = checkPageAccess(userRole, pathname);

      if (!hasAccess) {
        const defaultPage = getDefaultPageForRole(userRole);
        router.push(defaultPage);
      }
    }
  }, [session, pathname, router]);

  const userRole = (session as SessionWithRole | null)?.user?.role;
  const filteredData = filterItemsByRole(userRole);

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">LGW Warehouse</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredData.dashboard.length > 0 && (
          <NavDashboard items={filteredData.dashboard} />
        )}
        {filteredData.deliveries.length > 0 && (
          <NavDashboard items={filteredData.deliveries} />
        )}
        {filteredData.products.length > 0 && (
          <NavProducts items={filteredData.products} />
        )}
        {filteredData.admin.length > 0 && (
          <NavAdmin items={filteredData.admin} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavSettings items={filteredData.settings} />
      </SidebarFooter>
    </Sidebar>
  );
}

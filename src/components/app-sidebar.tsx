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
import { NavProducts } from "@/app/(dashboard)/_components/nav-products";
import { NavDashboard } from "@/app/(dashboard)/_components/nav-dashboard";
import { NavAdmin } from "@/app/(dashboard)/_components/nav-admin";
import { NavSettings } from "@/app/(dashboard)/_components/nav-settings";
import { BiSolidDashboard } from "react-icons/bi";
import { FaTruck, FaClipboardList } from "react-icons/fa6";
import { FaHistory, FaUsers } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";

const data = {
  dashboard: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <BiSolidDashboard />,
    },
    {
      title: "Deliveries",
      url: "/deliveries",
      icon: <FaTruck />,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavDashboard items={data.dashboard} />
        <NavProducts items={data.products} />
        <NavAdmin items={data.admin} />
      </SidebarContent>
      <SidebarFooter>
        {/* settings */}
        <NavSettings items={data.settings} />
      </SidebarFooter>
    </Sidebar>
  );
}

"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Network,
  Database,
  Plus,
  PanelLeft,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  {
    title: "New Chat",
    url: "/chat",
    icon: Plus,
  },
  {
    title: "Agents",
    url: "/agents",
    icon: Users,
  },
  {
    title: "MCP",
    url: "/mcp",
    icon: Settings,
  },
  {
    title: "Network", 
    url: "/network",
    icon: Network,
  },
  {
    title: "Knowledge Graph",
    url: "/kg",
    icon: Database,
  },
  {
    title: "Documentation",
    url: "/docs",
    icon: BookOpen,
  },
];



const olderConversations = [
  "Greeting an Old Agent",
  "Entities extracted fro...",
  "Popular methods of ...",
  "User greets the assis...",
  "Adding cat as an enti...",
  "Entity for water with ...",
  "Current weather info...",
  "Available tools and c...",
  "Greeting and conver...",
];

export function AppSidebar() {
  const { setOpenMobile, state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const currentPath = usePathname();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between gap-0.5">
            {isCollapsed ? (
              <SidebarMenuButton 
                onClick={toggleSidebar}
                className="hover:bg-transparent flex-1 cursor-pointer"
              >
                <span className="font-bold text-lg">A</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild className="hover:bg-transparent flex-1">
                <Link href="/chat">
                  <h4 className="font-bold text-foreground">ANP</h4>
                </Link>
              </SidebarMenuButton>
            )}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 shrink-0 hidden sm:flex"
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            )}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMobile(false);
                }}
                className="h-8 w-8 shrink-0 block sm:hidden"
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Close Sidebar</span>
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col gap-2 overflow-y-auto">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={currentPath === item.url}
                      className="w-full"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Older Conversations */}
          {!isCollapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground text-sm">
                Older
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {olderConversations.map((conversation, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton asChild>
                        <Link href={`/chat/${index}`}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{conversation}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium">SS</span>
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium text-foreground truncate">
              Shubham Subodh Rasal
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
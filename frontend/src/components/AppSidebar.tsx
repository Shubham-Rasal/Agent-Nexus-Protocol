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
  Plus,
  PanelLeft,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatHistory } from "@/hooks/useChatHistory";

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
];



export function AppSidebar() {
  const { setOpenMobile, state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const currentPath = usePathname();
  const isCollapsed = state === "collapsed";
  const { conversations, remove } = useChatHistory();

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
                <Link href="/chat" prefetch={false}>
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
                      <Link href={item.url} prefetch={false}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Chat History */}
          {!isCollapsed && conversations.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground text-sm">
                Recent
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {conversations.map((convo) => (
                    <SidebarMenuItem key={convo.id} className="group/item flex items-center">
                      <SidebarMenuButton
                        asChild
                        isActive={currentPath === `/chat/${convo.id}`}
                        className="flex-1 min-w-0"
                      >
                        <Link href={`/chat/${convo.id}`} prefetch={false}>
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{convo.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                        onClick={(e) => { e.preventDefault(); remove(convo.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>

    </Sidebar>
  );
}
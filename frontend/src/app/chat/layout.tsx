"use client";

import { ChatLayout } from "@/components/layouts/ChatLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}

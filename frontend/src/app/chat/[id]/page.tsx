"use client";

import { use } from "react";
import dynamic from "next/dynamic";

// Disable SSR — AgentAwareChatbot reads localStorage on initial render,
// which causes a hydration mismatch with the server-rendered empty state.
const AgentAwareChatbot = dynamic(
  () => import("@/components/primitives/AgentAwareChatbot"),
  { ssr: false }
);

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AgentAwareChatbot conversationId={id} />;
}

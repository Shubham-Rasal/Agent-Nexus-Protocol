"use client";

import { use } from "react";
import AgentAwareChatbot from "@/components/primitives/AgentAwareChatbot";

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AgentAwareChatbot conversationId={id} />;
}

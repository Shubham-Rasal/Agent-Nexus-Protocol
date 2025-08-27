"use client";

import AgentAwareChatbot from "./primitives/AgentAwareChatbot";
import { ChatLayout } from "./layouts/ChatLayout";

export default function MultiAgentChat() {
  return (
    <ChatLayout>
      <AgentAwareChatbot />
    </ChatLayout>
  );
}
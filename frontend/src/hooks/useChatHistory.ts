"use client";

import { useState, useEffect, useCallback } from "react";
import type { UIMessage } from "ai";

export interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "anp_chat_history";
const SYNC_EVENT = "anp_chat_history_updated";

function readAll(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeAll(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

function sorted(convos: Conversation[]) {
  return [...convos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(sorted(readAll()));

    const sync = () => setConversations(sorted(readAll()));
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, []);

  const save = useCallback((id: string, messages: UIMessage[], forceTitle?: string) => {
    const all = readAll();
    const existing = all.find((c) => c.id === id);
    const firstUser = messages.find((m) => m.role === "user");
    const rawTitle =
      forceTitle ??
      (firstUser?.parts?.find((p: any) => p.type === "text") as any)?.text ??
      "New chat";
    // Extract only the actual user query, stripping any injected agent context
    const rawStr = rawTitle as string;
    const afterUserMessage = rawStr.match(/\[User Message\]\n([\s\S]+)/);
    const title = (afterUserMessage ? afterUserMessage[1] : rawStr).trim().slice(0, 60);

    // Keep only the last 40 messages to cap localStorage size
    const trimmed = messages.slice(-40);

    const updated: Conversation = {
      id,
      title,
      messages: trimmed,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = existing
      ? all.map((c) => (c.id === id ? updated : c))
      : [updated, ...all];
    writeAll(next);
    return updated;
  }, []);

  const get = useCallback((id: string): Conversation | undefined => {
    return readAll().find((c) => c.id === id);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readAll().filter((c) => c.id !== id);
    writeAll(next);
  }, []);

  const create = useCallback((): string => {
    return `chat_${Date.now()}`;
  }, []);

  return { conversations, save, get, remove, create };
}

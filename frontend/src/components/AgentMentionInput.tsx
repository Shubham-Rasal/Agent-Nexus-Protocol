"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { 
  AgentMention, 
  type AgentMentionItem, 
  MentionInputProps, 
  MentionSuggestion 
} from "@/types/agentMentionTypes";

// Fuzzy search helper function
const fuzzySearch = (items: AgentMentionItem[], query: string): AgentMentionItem[] => {
  if (!query) return items;
  
  const searchQuery = query.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(searchQuery) ||
    (item.description && item.description.toLowerCase().includes(searchQuery))
  ).sort((a, b) => {
    // Prioritize items that start with the query
    const aStartsWith = a.name.toLowerCase().startsWith(searchQuery);
    const bStartsWith = b.name.toLowerCase().startsWith(searchQuery);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return a.name.localeCompare(b.name);
  });
};

export default function AgentMentionInput({
  input = "",
  onChange,
  onChangeMention,
  onEnter,
  placeholder = "Type a message...",
  agents = [],
  className,
}: MentionInputProps) {
  const [suggestion, setSuggestion] = useState<MentionSuggestion | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  const mentionItems = useMemo(() => {
    return agents.map((agent) => ({
      label: agent.name,
      ...agent,
    }));
  }, [agents]);

  const filteredItems = useMemo(() => {
    if (!suggestion?.query || !mentionItems.length) return mentionItems;
    return fuzzySearch(mentionItems, suggestion.query);
  }, [suggestion?.query, mentionItems]);

  // Parse mentions from text
  const parseMentions = useCallback((text: string): AgentMention[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: AgentMention[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1];
      const agent = agents.find(a => a.name.toLowerCase() === mentionName.toLowerCase());
      if (agent) {
        mentions.push(agent);
      }
    }
    
    return mentions;
  }, [agents]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange?.(newValue);
    setCursorPosition(cursorPos);
    
    // Check for @ mentions
    const beforeCursor = newValue.substring(0, cursorPos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      const rect = e.target.getBoundingClientRect();
      const lineHeight = 20; // Approximate line height
      const lines = beforeCursor.split('\n').length - 1;
      
      setSuggestion({
        top: rect.top - window.scrollY + (lines * lineHeight) + 25,
        left: rect.left - window.scrollX + 10,
        query,
        selectedIndex: 0,
        command: (item: { id: string; label: string }) => {
          const beforeAt = beforeCursor.substring(0, beforeCursor.lastIndexOf('@'));
          const afterCursor = newValue.substring(cursorPos);
          const newText = `${beforeAt}@${item.label} ${afterCursor}`;
          onChange?.(newText);
          setSuggestion(null);
          
          // Update cursor position
          setTimeout(() => {
            if (textareaRef.current) {
              const newCursorPos = beforeAt.length + item.label.length + 2;
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
              textareaRef.current.focus();
            }
          }, 0);
        },
      });
    } else {
      setSuggestion(null);
    }
    
    // Update mentions
    const mentions = parseMentions(newValue);
    onChangeMention?.(mentions);
  }, [onChange, onChangeMention, parseMentions]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestion) {
      const allowedKeys = ["Enter", "Tab", "ArrowUp", "ArrowDown", "Escape"];
      if (allowedKeys.includes(e.key)) {
        e.preventDefault();
        
        if (e.key === "Escape") {
          setSuggestion(null);
        } else if (e.key === "Enter" || e.key === "Tab") {
          const selectedItem = filteredItems[suggestion.selectedIndex];
          if (selectedItem) {
            suggestion.command(selectedItem);
          }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          const direction = e.key === "ArrowUp" ? -1 : 1;
          const newIndex = suggestion.selectedIndex + direction;
          setSuggestion(prev => ({
            ...prev!,
            selectedIndex: Math.max(0, Math.min(newIndex, filteredItems.length - 1)),
          }));
        }
        return;
      }
    }
    
    // Handle enter for submission
    if (e.key === "Enter" && !suggestion && !e.shiftKey) {
      e.preventDefault();
      onEnter?.();
    }
  }, [suggestion, filteredItems, onEnter]);

  // Reset selectedIndex when filteredItems change
  useEffect(() => {
    if (suggestion) {
      setSuggestion(prev => ({
        ...prev!,
        selectedIndex: 0,
      }));
    }
  }, [filteredItems]);

  // Handle outside clicks to close suggestion
  useEffect(() => {
    if (!suggestion) return;

    const handleClick = (e: MouseEvent) => {
      if (!mentionRef.current?.contains(e.target as Node)) {
        setSuggestion(null);
      }
    };
    
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [suggestion]);

  // Memoize the suggestion portal
  const suggestionPortal = useMemo(() => {
    if (!suggestion) return null;

    return createPortal(
      <div
        className="fixed z-50"
        style={{
          top: suggestion.top,
          left: suggestion.left,
        }}
      >
        <div
          ref={mentionRef}
          className="flex flex-col bg-popover border border-border rounded-md shadow-lg min-w-[280px] px-2 py-2 gap-1 max-h-[400px] overflow-y-auto z-50"
        >
          <AgentMentionSelect
            items={filteredItems}
            query={suggestion.query}
            addMention={suggestion.command}
            selectedIndex={suggestion.selectedIndex}
          />
        </div>
      </div>,
      document.body,
    );
  }, [suggestion, filteredItems]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full max-h-80 min-h-[2rem] break-words overflow-y-auto resize-none focus:outline-none px-2 py-1 border-none bg-transparent text-foreground placeholder:text-muted-foreground",
          className
        )}
        style={{ minHeight: "2rem" }}
      />
      {suggestionPortal}
    </div>
  );
}

// Memoize HighlightText for better performance
const HighlightText = memo(function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const textParts = useMemo(() => {
    if (!query) return [{ text, highlight: false }];
    
    const parts: { text: string; highlight: boolean }[] = [];
    const searchQuery = query.toLowerCase();
    let currentIndex = 0;
    
    while (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex).toLowerCase();
      const matchIndex = remainingText.indexOf(searchQuery);
      
      if (matchIndex === -1) {
        parts.push({
          text: text.substring(currentIndex),
          highlight: false,
        });
        break;
      }
      
      // Add text before match
      if (matchIndex > 0) {
        parts.push({
          text: text.substring(currentIndex, currentIndex + matchIndex),
          highlight: false,
        });
      }
      
      // Add matched text
      parts.push({
        text: text.substring(currentIndex + matchIndex, currentIndex + matchIndex + searchQuery.length),
        highlight: true,
      });
      
      currentIndex += matchIndex + searchQuery.length;
    }
    
    return parts;
  }, [text, query]);

  return (
    <span>
      {textParts.map((part, i) => (
        <span
          key={i}
          className={part.highlight ? "text-primary font-bold" : ""}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
});

// Memoize the AgentMentionItem component
const AgentMentionItem = memo(function AgentMentionItem({
  item,
  query,
  addMention,
  isSelected,
}: {
  item: AgentMentionItem;
  addMention: (item: AgentMentionItem) => void;
  isSelected: boolean;
  query: string;
}) {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      const element = itemRef.current;
      const parent = element.parentElement?.parentElement;

      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        const isVisibleInParent =
          elementRect.top >= parentRect.top &&
          elementRect.bottom <= parentRect.bottom;

        if (!isVisibleInParent) {
          element.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }
  }, [isSelected]);

  const handleClick = useCallback(() => {
    addMention(item);
  }, [addMention, item]);

  return (
    <button
      ref={itemRef}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent",
        isSelected && "bg-accent",
      )}
      onClick={handleClick}
    >
      <Bot className="h-4 w-4 text-primary" />
      <div className="flex flex-col items-start flex-1">
        <HighlightText text={item.label} query={query} />
        {item.description && (
          <span className="text-xs text-muted-foreground truncate w-full">
            {item.description}
          </span>
        )}
      </div>
    </button>
  );
});

// Memoize the AgentMentionSelect component
const AgentMentionSelect = memo(function AgentMentionSelect({
  items,
  query,
  addMention,
  selectedIndex,
}: {
  items: AgentMentionItem[];
  query: string;
  addMention: (item: AgentMentionItem) => void;
  selectedIndex: number;
}) {
  const emptyMessage = useMemo(() => {
    if (items.length > 0) return null;
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        No agents found
      </div>
    );
  }, [items.length]);

  return (
    <div>
      {emptyMessage}
      {items.map((item, index) => (
        <AgentMentionItem
          key={item.id}
          item={item}
          query={query}
          addMention={addMention}
          isSelected={index === selectedIndex}
        />
      ))}
    </div>
  );
});
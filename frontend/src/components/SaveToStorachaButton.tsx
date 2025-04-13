import React, { useState } from 'react';
import { Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getStorachaService } from '@/features/agents/leadgen/storacha-service';
import { Message } from '@/types/chatTypes';

// Props for the SaveToStorachaButton component
interface SaveToStorachaButtonProps {
  messages: Message[];
  onSuccess?: (storachaItemIds: string[]) => void;
  onError?: (error: string) => void;
  onSaveStart?: () => void;
}

export default function SaveToStorachaButton({ 
  messages, 
  onSuccess, 
  onError,
  onSaveStart 
}: SaveToStorachaButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationType, setConfirmationType] = useState<'success' | 'error'>('success');
  
  // Function to save messages to Storacha
  const saveToStoracha = async () => {
    if (isSaving || messages.length === 0) return;
    
    setIsSaving(true);
    if (onSaveStart) onSaveStart();
    
    try {
      const storachaService = getStorachaService();
      
      // Try to get delegation for storage access
      try {
        await storachaService.requestApproval('user');
      } catch (error) {
        console.error('Error getting delegation:', error);
        setIsSaving(false);
        setConfirmationType('error');
        setConfirmationMessage('Failed to get storage access permission');
        setShowConfirmation(true);
        
        if (onError) onError('Failed to get storage access permission');
        
        // Hide confirmation after a delay
        setTimeout(() => setShowConfirmation(false), 3000);
        return;
      }
      
      // Filter out system messages as they're not essential to persist
      const relevantMessages = messages.filter(message => message.role !== 'system');
      
      if (relevantMessages.length === 0) {
        setIsSaving(false);
        setConfirmationType('error');
        setConfirmationMessage('No messages to save');
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
        return;
      }
      
      // Create a single chat object containing all messages
      const chatObject = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        messages: relevantMessages.map(message => ({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.getTime(),
          agentId: message.agentId || 'user',
          isThought: message.isThought || false
        })),
        agentIds: Array.from(new Set(relevantMessages
          .filter(msg => msg.agentId)
          .map(msg => msg.agentId))) as string[]
      };
      
      // Store the entire chat as a single item
      const chatId = await storachaService.storeItem(
        'chat',  // Use 'chat' as the agent ID for chat objects
        'metadata',  // Use 'metadata' as the data type for chats
        JSON.stringify(chatObject),
        {
          chatId: chatObject.id,
          timestamp: chatObject.timestamp,
          messageCount: chatObject.messages.length,
          agentIds: chatObject.agentIds
        }
      );
      
      // Also share the chat for access by other agents
      await storachaService.storeSharedItem(
        'metadata',
        JSON.stringify(chatObject),
        {
          chatId: chatObject.id,
          timestamp: chatObject.timestamp,
          messageCount: chatObject.messages.length,
          agentIds: chatObject.agentIds,
          sourceAgentId: 'chat'
        }
      );
      
      // Show success confirmation
      setIsSaving(false);
      setConfirmationType('success');
      setConfirmationMessage(`Saved chat with ${chatObject.messages.length} messages`);
      setShowConfirmation(true);
      
      // Call onSuccess callback with the ID of saved chat
      if (onSuccess) onSuccess([chatId]);
      
      // Hide confirmation after a delay
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (error) {
      console.error('Error saving to Storacha:', error);
      
      // Show error confirmation
      setIsSaving(false);
      setConfirmationType('error');
      setConfirmationMessage('Failed to save to Storacha');
      setShowConfirmation(true);
      
      // Call onError callback
      if (onError) onError(error instanceof Error ? error.message : 'Unknown error');
      
      // Hide confirmation after a delay
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={saveToStoracha}
        disabled={isSaving || messages.length === 0}
        className={`
          flex items-center px-3 py-1.5 rounded-md text-sm
          ${isSaving ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} 
          border border-blue-200
          transition-colors duration-200
        `}
        title="Save chat to Storacha storage"
      >
        {isSaving ? (
          <>
            <Loader2 size={16} className="animate-spin mr-1" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save size={16} className="mr-1" />
            <span>Save to Storacha</span>
          </>
        )}
      </button>
      
      {/* Confirmation tooltip */}
      {showConfirmation && (
        <div 
          className={`
            absolute z-10 mt-2 p-2 rounded-md shadow-md right-0 min-w-[200px]
            flex items-center space-x-2 text-sm animate-fade-in
            ${confirmationType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
          `}
        >
          {confirmationType === 'success' ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
          <span>{confirmationMessage}</span>
        </div>
      )}
    </div>
  );
}

// CSS keyframes for fade-in animation
const animationStyles = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out forwards;
}
`;

// Add styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
} 
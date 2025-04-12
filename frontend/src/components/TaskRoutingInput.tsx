'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, SendHorizontal, RotateCcw } from 'lucide-react';
import { TaskRoutingDisplay } from './TaskRoutingDisplay';
import { TaskRoutingResult } from '@/features/taskRouter/taskRouterService';
import { toast } from 'sonner';

interface TaskRoutingInputProps {
  onTaskComplete?: (result: string) => void;
}

export function TaskRoutingInput({ onTaskComplete }: TaskRoutingInputProps) {
  const [query, setQuery] = useState('Find some information about Oracle India and send an email to bluequbits@gmail.com');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskResult, setTaskResult] = useState<TaskRoutingResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a task or question');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/task-router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Task routing failed');
      }
      
      setTaskResult(data.data);
      
      if (data.data.result && onTaskComplete) {
        onTaskComplete(data.data.result);
      }
      
    } catch (error) {
      console.error('Error in task routing:', error);
      toast.error('Task Routing Failed', { 
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReset = () => {
    setTaskResult(null);
    setQuery('');
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {!taskResult ? (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Enter a complex task like 'Research company X and send an email to schedule a meeting'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing || !query.trim()}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
              <span className="ml-2">Process</span>
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-4">
          <TaskRoutingDisplay 
            task={taskResult} 
            onRetry={handleReset}
          />
          
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-500"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
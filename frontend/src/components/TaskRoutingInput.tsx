'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, SendHorizontal, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TaskRoutingInputProps {
  onTaskComplete: (result: string) => void;
}

export function TaskRoutingInput({ onTaskComplete }: TaskRoutingInputProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if the user is authenticated on component mount
  useEffect(() => {
    // Check local storage for auth token
    const storedToken = localStorage.getItem('anp_google_auth');
    if (storedToken) {
      setAuthToken(storedToken);
      setIsAuthenticated(true);
    } else {
      // Clear any previous auth errors
      setAuthError('You need to authenticate with Google to use the task router');
    }
  }, []);

  const handleAuthenticate = () => {
    // Open authentication window (this logic would typically be in a service)
    const authWindow = window.open('/api/auth/google', '_blank', 'width=600,height=700');
    
    // Listen for messages from auth window
    window.addEventListener('message', (event) => {
      // Ensure message is from our auth flow
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const newToken = event.data.token;
        localStorage.setItem('googleAuthToken', newToken);
        setAuthToken(newToken);
        setIsAuthenticated(true);
        setAuthError(null);
        
        // Close the auth window if still open
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        
        toast.success('Authentication successful', {
          description: 'You have successfully authenticated with Google'
        });
      }
    });
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Please enter a task', {
        description: 'You need to provide a task for agents to work on'
      });
      return;
    }

    // Check authentication before submitting
    if (!authToken) {
      toast.error('Authentication required', {
        description: 'You need to authenticate with Google before using the task router'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/task-router', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: input,
          authToken: authToken
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      onTaskComplete(data.result);
      
      toast.success('Task completed', {
        description: `Agent "${data.agent}" has completed the requested task with ${Math.round(data.confidence * 100)}% confidence`
      });
    } catch (error) {
      console.error('Error routing task:', error);
      toast.error('Failed to process task', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Some sample prompts to help users get started
  const samplePrompts = [
    "Find information about John Doe who works at Acme Corporation",
    "Send an email to sarah@example.com to schedule a meeting",
    "Qualify this lead: email: john.smith@company.com, LinkedIn: linkedin.com/in/johnsmith",
    "Draft an email to team@example.org about project updates"
  ];

  const usePrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="space-y-4">
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            {authError}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleAuthenticate}>
                Authenticate with Google
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardContent className="pt-4">
          <Textarea
            placeholder="Enter a task for agents to work on..."
            className="min-h-[120px] mb-4"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {!isAuthenticated && (
              <Button variant="outline" onClick={handleAuthenticate}>
                Authenticate
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={isLoading || !isAuthenticated}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Submit Task
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {samplePrompts.map((prompt, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => usePrompt(prompt)}
          >
            <CardContent className="p-3">
              <p className="text-sm">{prompt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
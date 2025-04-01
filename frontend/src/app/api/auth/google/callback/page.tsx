'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuthCallback } from '@/services/googleAuth';
import { Button } from '@/components/ui/button';

export default function GoogleAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = handleAuthCallback();
      
      if (token) {
        setStatus('success');
        // Redirect back to the tools page after a short delay
        setTimeout(() => {
          router.push('/tools');
        }, 2000);
      } else {
        // No token found in URL, likely not a redirect from Google
        setStatus('error');
        setErrorMessage('No authentication token found in the URL. Please try again.');
      }
    } catch (err) {
      console.error('Error handling authentication callback:', err);
      setStatus('error');
      setErrorMessage('An error occurred during authentication. Please try again.');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Google Authentication</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
            <p className="text-gray-600">Processing authentication...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 text-center">Authentication successful! You will be redirected back to the tools page in a moment.</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-500 text-center">{errorMessage || 'Authentication failed. Please try again.'}</p>
            <Button onClick={() => router.push('/tools')} className="mt-4">
              Return to Tools Page
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 
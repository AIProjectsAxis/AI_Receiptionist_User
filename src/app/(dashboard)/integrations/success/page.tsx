'use client';
export const runtime = 'edge';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { googleAuthApiRequest, outlookAuthApiRequest } from '@/network/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');
  const hasRunAuthRef = useRef(false);
  const isProcessingRef = useRef(false);
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('useEffect triggered - code:', code, 'state:', state, 'error:', error);
    
    // Check for OAuth error first
    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setMessage('Authorization failed. Redirecting back to integrations...');
      setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      return;
    }

    // Check if we have required parameters
    if (!code || !state) {
      console.error('Missing code or state parameters');
      return;
    }

    // Create a unique key for this specific OAuth flow
    const authKey = `oauth_processing_${code}`;
    
    // Check if we've already processed this exact code
    const alreadyProcessed = sessionStorage.getItem(authKey);
    if (alreadyProcessed) {
      console.log('This OAuth code has already been processed, skipping...');
      return;
    }
    
    // Check if we're currently processing (prevents double call from React Strict Mode)
    if (hasRunAuthRef.current || isProcessingRef.current) {
      console.log('Auth already in progress, skipping...');
      return;
    }

    // Mark that we're processing
    hasRunAuthRef.current = true;
    isProcessingRef.current = true;
    sessionStorage.setItem(authKey, 'true');
    
    console.log('Starting auth process...');
    
    // Handle the authentication
    const handleAuth = async () => {
      try {
        if (state === "google") {
          console.log("Calling googleAuthApiRequest with code:", code);
          
          const response = await googleAuthApiRequest(JSON.stringify({ code, state }));
          console.log("Google auth response:", response);
          setStatus('success');
          setMessage('Google Calendar connected successfully! Redirecting...');
          setTimeout(() => {
            sessionStorage.removeItem(authKey); // Clean up after redirect
            router.push('/integrations/synced-calendars');
          }, 2000);
        } else if (state === "outlook") {
          console.log("Calling outlookAuthApiRequest with code:", code);
          
          const response = await outlookAuthApiRequest(JSON.stringify({ code, state }));
          console.log("Outlook auth response:", response);
          setStatus('success');
          setMessage('Outlook Calendar connected successfully! Redirecting...');
          setTimeout(() => {
            sessionStorage.removeItem(authKey); // Clean up after redirect
            router.push('/integrations/synced-calendars');
          }, 2000);
        } else {
          console.error('Invalid state parameter:', state);
          setStatus('error');
          setMessage('Invalid authorization state. Redirecting back...');
          setTimeout(() => {
            sessionStorage.removeItem(authKey);
            router.push('/integrations/synced-calendars');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Token Exchange Error:', error);
        setStatus('error');
        setMessage(`Failed to connect ${state === 'google' ? 'Google' : 'Outlook'} Calendar. Redirecting back...`);
        setTimeout(() => {
          sessionStorage.removeItem(authKey);
          router.push('/integrations/synced-calendars');
        }, 2000);
      } finally {
        isProcessingRef.current = false;
      }
    };
    
    handleAuth();
  }, [searchParams, router]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative h-16 w-16">
              <Loader2 className="absolute animate-spin text-indigo-600" size={64} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Connecting to {searchParams.get('state') === 'outlook' ? 'Outlook' : 'Google'} Calendar
              </h2>
              <p className="mt-2 text-gray-600">Please wait while we establish a secure connection...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Connection Successful!</h2>
              <p className="mt-2 text-gray-600">{message}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Connection Failed</h2>
              <p className="mt-2 text-gray-600">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
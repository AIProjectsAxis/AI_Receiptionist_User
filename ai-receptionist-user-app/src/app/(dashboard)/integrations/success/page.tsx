'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { googleAuthApiRequest, outlookAuthApiRequest } from '@/network/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const HAS_RUN_AUTH_KEY = 'oauth_auth_has_run';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');
  
  const handleAuth = async () => {
    // Get URL parameters once at the start
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('code', code);
    console.log('state', state);
    console.log('error', error);
    
    // https://dev-ai-receptionist.pages.dev/integrations/success?code=M.C559_SN1.2.U.554c3b5e-86ba-085d-c9c6-5da073f47dd6&state=outlook
    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setMessage('Authorization failed. Redirecting back to integrations...');
      setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      return;
    }

    if (!code || !state) {
      console.error('Missing code or state parameters');
      setStatus('error');
      setMessage('Invalid authorization parameters. Redirecting back...');
      setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      return;
    }

    try {
      if (state === "google") {
        const response = await googleAuthApiRequest(JSON.stringify({ code, state }));
        setStatus('success');
        setMessage('Google Calendar connected successfully! Redirecting...');
        setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      } else if (state === "outlook") {
        const response = await outlookAuthApiRequest(JSON.stringify({ code, state }));
        setStatus('success');
        setMessage('Outlook Calendar connected successfully! Redirecting...');
        setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      } else {
        console.error('Invalid state parameter:', state);
        setStatus('error');
        setMessage('Invalid authorization state. Redirecting back...');
        setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
      }
    } catch (error: any) {
      console.error('Token Exchange Error:', error);
      setStatus('error');
      setMessage(`Failed to connect ${state === 'google' ? 'Google' : 'Outlook'} Calendar. Redirecting back...`);
      setTimeout(() => router.push('/integrations/synced-calendars'), 2000);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // Check if we've already run the auth process in this session
    const hasRunAuth = sessionStorage.getItem(HAS_RUN_AUTH_KEY);
    
    if (code && state && !hasRunAuth) {
      // Mark that we've run the auth process
      sessionStorage.setItem(HAS_RUN_AUTH_KEY, 'true');
      handleAuth();
    } else if (hasRunAuth) {
      // If we've already run auth, just redirect
      console.log('Auth already processed in this session, redirecting...');
      setTimeout(() => router.push('/integrations/synced-calendars'), 1000);
    }
  }, []); // Empty dependency array to run only once


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
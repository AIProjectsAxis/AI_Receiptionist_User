'use client';
export const runtime = 'edge';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { FaBuilding as FaBuildingIcon } from 'react-icons/fa';
import { zohoAuthApiRequest } from '@/network/api';

export default function ZohoOAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const singleLoader = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Zoho authorization...');
  
  const handleZohoAuth = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const accountsServer = searchParams.get('accounts-server');
    console.log('Zoho OAuth Response:', { code, state, error });
    
    if (error) {
      console.error('Zoho OAuth error:', error);
      setStatus('error');
      setMessage('Zoho authorization failed. Redirecting back to integrations...');
      setTimeout(() => router.push('/integrations'), 3000);
      return;
    }

    if (!code || state !== 'zoho') {
      console.error('Invalid OAuth response:', { code, state });
      setStatus('error');
      setMessage('Invalid authorization response. Redirecting back...');
      setTimeout(() => router.push('/integrations/zoho'), 3000);
      return;
    }

    try {
      // Exchange authorization code for access token using the API route
      const response = await zohoAuthApiRequest({ code, state ,accountsServer});
      const data = response.data;

      console.log('Zoho authentication successful:', data);
      setStatus('success');
      setMessage('Zoho CRM connected successfully! Redirecting to integrations...');
      setTimeout(() => router.push('/integrations'), 3000);
      
    } catch (error: any) {
      console.error('Zoho token exchange error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect Zoho CRM. Please try again.');
      setTimeout(() => router.push('/integrations/zoho'), 3000);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const accountsServer = searchParams.get('accounts-server');

    console.log("accountsServer",accountsServer,  "code",code, "state",state);
    
    if (code && state && !singleLoader.current) {
      singleLoader.current = true;
      handleZohoAuth();
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative h-16 w-16">
              <Loader2 className="absolute animate-spin text-orange-600" size={64} />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaBuildingIcon className="h-6 w-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">Connecting to Zoho CRM</h2>
              </div>
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
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaBuildingIcon className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Connection Successful!</h2>
              </div>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Your Zoho CRM is now connected and ready to sync with your AI receptionist.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaBuildingIcon className="h-6 w-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Connection Failed</h2>
              </div>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  If this problem persists, please check your Zoho account permissions or contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator for redirect */}
        {(status === 'success' || status === 'error') && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              Redirecting...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

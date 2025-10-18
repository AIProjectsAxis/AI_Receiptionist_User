"use client";

export const runtime = 'edge';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function NotFoundContent() {
  const searchParams = useSearchParams();
  
  return (
    <div className="text-center h-screen flex items-center justify-center flex-col">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">Sorry, the page you're looking for doesn't exist.</p>
      {searchParams.get('from') && (
        <p className="mt-2 text-gray-500">You were trying to access: {searchParams.get('from')}</p>
      )}
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="text-center h-screen flex items-center justify-center flex-col">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mt-4">Loading...</p>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 
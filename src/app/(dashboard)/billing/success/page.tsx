"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {}

const BillingSuccessPage = (props: Props) => {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after a brief delay for better UX
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-scaleIn">
            {/* Success Icon with SVG Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg 
                  className="w-20 h-20 text-green-500 animate-bounce" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    className="stroke-green-200" 
                    fill="none"
                  />
                  <path 
                    d="M9 12l2 2 4-4" 
                    className="stroke-green-500" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 20,
                      strokeDashoffset: 20,
                      animation: 'draw 1s ease-in-out forwards'
                    }}
                  />
                </svg>
                <style jsx>{`
                  @keyframes draw {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes scaleIn {
                    from { 
                      opacity: 0; 
                      transform: scale(0.8); 
                    }
                    to { 
                      opacity: 1; 
                      transform: scale(1); 
                    }
                  }
                  .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                  }
                  .animate-scaleIn {
                    animation: scaleIn 0.4s ease-out;
                  }
                `}</style>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Your payment has been processed successfully. Your subscription is now active and you can start using all the features.
              </p>
            </div>

            {/* Payment Details */}

            {/* Action Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Go to Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Background Content */}
      <div className="text-center text-gray-400">
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default BillingSuccessPage;
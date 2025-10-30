import React from 'react'

type Props = {
    tabs: string[];
    activeTab: string;
    setActiveTab: any
}

const BillingComponent = ({ tabs,  activeTab, setActiveTab }: Props) => {
  return (
    <div>
         <div className="mb-8 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {tabs.map(tab => (
            <div 
              key={tab}
              className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer min-w-[120px] transition-all ${
                activeTab === tab 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'border-transparent hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <div className={`mb-2 ${activeTab === tab ? 'text-primary-600' : 'text-gray-500'}`}>
                {tab === 'subscription' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                )}
                {tab === 'payment methods' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                )}
                {tab === 'invoices' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                )}
                
                {tab === 'usage' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                )}

              </div>
              <div className="text-sm font-medium">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BillingComponent
"use client"
import React, { useState, ReactElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GrIntegration } from 'react-icons/gr';
import { GrAction } from "react-icons/gr";
import { useDispatch, useSelector } from 'react-redux';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from './common/select';
import { getCompanySwitchThunkRequest } from '@/lib/Redux/SliceActions/CompanyActions';
import Link from 'next/link';

// --- Type Definitions ---
interface Badge {
  text: string;
  type: 'success' | 'primary';
}

interface SidebarItemType {
  name: string;
  path: string;
  icon: ReactElement;
  roles?: string[]; // Add roles property for role-based access control
  badge?: Badge;
}

interface SidebarCategoryType {
  category: string;
  items: SidebarItemType[];
}

interface SidebarProps {
  isOpen: boolean;
}

// --- Sidebar Data (roles property is no longer used by the component but can remain in data if desired for other purposes) ---
const sidebarItemsData: SidebarCategoryType[] = [
  {
    category: 'MAIN',
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        )
      },
      {
        name: 'AI Agents',
        path: '/ai-agents',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        ),
        // roles: ['admin', 'business_owner'], // Role checks removed
        // badge: { text: 'New', type: 'success' }
      },
      {
        name: 'Call History',
        path: '/call-history',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        ),
        // roles: ['admin', 'business_owner', 'staff'],
        // badge: { text: '12', type: 'primary' }
      },
      {
        name: 'Appointments',
        path: '/appointments',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        ),
        // roles: ['admin', 'business_owner', 'staff']
      },
      {
        name: 'Campaign',
        path: '/campaign',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        ),
        roles: ['owner']
      }

    ]
  },
  {
    category: 'INTEGRATIONS',
    items: [
      {
        name: 'App Integrations',
        path: '/integrations',
        icon: (
          <GrIntegration />
        ),
        // roles: ['admin', 'business_owner']
      },
      {
        name: 'Actions Management',
        path: '/actions-management',
        icon: (
          <GrAction />
        ),
        // roles: ['admin', 'business_owner']
      },
      {
        name: 'Knowledge Base',
        path: '/knowledge-base',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        ),
        // roles: ['admin', 'business_owner']
      },

    ]
  },
  {
    category: 'SETTINGS',
    items: [
      {
        name: 'Phone Setup',
        path: '/phone-setup',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        ),
        // roles: ['admin', 'business_owner']
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        ),
        // roles: ['admin', 'business_owner', 'staff']
      },
      {
        name: 'Team Members',
        path: '/team-members',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        ),
        roles: ['owner']
      },
      {
        name: 'Billing',
        path: '/billing',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        ),
        roles: ['owner']
      },
     

    ]
  }
];


// --- Sidebar Component ---
const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isActionsPath = pathname === "/actions-management";
  const profileDetails = useSelector((state: any) => state.company.profileDetails);
  const companyData = useSelector((state: any) => state.company.companyData);
  // console.log("companyData", companyData)
  
  
  const hasAccess = (item: SidebarItemType): boolean => {
    if (!item.roles) return true;
    if (!profileDetails?.companies) {
      // console.log('hasAccess: Missing profileDetails', { profileDetails });
      return false;
    }
    
    // Get current company ID - use first company if companyData is not loaded yet
    const currentCompanyId = companyData?.id || profileDetails.companies[0]?.company_id;
    if (!currentCompanyId) {
      // console.log('hasAccess: No company ID available', { companyData, profileDetails });
      return false;
    }
    
    // Check if user has access to the current company
    const userCompany = profileDetails.companies.find((company: any) => company.company_id === currentCompanyId);
    if (!userCompany) {
      // console.log('hasAccess: User not found in company', { profileDetails, currentCompanyId });
      return false;
    }
    
    // Check if user has the required role for this item
    const hasRole = item.roles.includes(userCompany.role);
    //  console.log('hasAccess:', { itemName: item.name, userRole: userCompany.role, requiredRoles: item.roles, hasRole });
    return hasRole;
  };


  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    MAIN: true,
    INTEGRATIONS: true,
    SETTINGS: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // const hasAccess = (item: SidebarItemType): boolean => { // Removed
  //   if (!item.roles) return true;
  //   if (!auth?.currentUser?.role) return false;
  //   return item.roles.includes(auth.currentUser.role);
  // };
  const handleCompanySwitch = (company_id: string) => {
    dispatch(getCompanySwitchThunkRequest(company_id) as any);
  }

  const getBadgeClass = (type: 'success' | 'primary'): string => {
    switch (type) {
      case 'success':
        return 'bg-green-100/60 text-green-800 border border-green-400/50';
      case 'primary':
        return 'bg-blue-100/60 text-blue-800 border border-blue-400/50';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  return (
    <div
      className={`
            bg-white border-r border-gray-200 
            h-screen
            flex flex-col 
            transition-all duration-500 ease-in-out 
            z-50 
            ${isOpen ? 'w-[330px]' : 'w-[82px]'}
            overflow-hidden 
            shadow-lg lg:shadow-none
            pt-[60px]
            transform ${isOpen ? 'translate-x-0' : 'translate-x-0'}
            opacity-100
        `}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {profileDetails?.companies?.length > 1 &&
          <div className={`
            mb-4 transition-all duration-300 ease-out
            transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}
            ${!isOpen ? 'hidden' : ''}
          `}>
            <Select
              defaultValue={companyData?.id}
              value={companyData?.id}
              onValueChange={(value) => {
                handleCompanySwitch(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent className='bg-white'>
                {profileDetails?.companies?.map((company: any) => (
                  <SelectItem
                    className='text-black border-t border-gray-200/70 cursor-pointer'
                    key={company.company_id}
                    value={company.company_id}
                  >
                    {company?.company_name}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>
          </div>
        }
        {sidebarItemsData.map((category, categoryIndex) => (
          <div key={categoryIndex} className={`p-0 ${isOpen ? 'sidebar-category-container' : ''}`}>
            <div
              className={`
                flex justify-between items-center cursor-pointer 
                p-2 rounded 
                text-[16px] font-semibold uppercase text-gray-400 
                hover:bg-gray-100
                transition-all duration-300 ease-out
                ${!isOpen ? 'justify-center cursor-default hidden' : ''}
              `}
              onClick={() => isOpen && toggleCategory(category.category)}
             >
              <span className={`
                transition-all duration-300 ease-out
                ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0 h-0'}
              `}>
                {category.category}
              </span>
              <button
                className={`
                    bg-transparent border-none cursor-pointer text-gray-500 
                    flex items-center justify-center 
                    transition-all duration-300 ease-out
                    ${expandedCategories[category.category] ? 'rotate-180' : ''}
                    ${!isOpen ? 'opacity-0 w-0 h-0 scale-75' : 'opacity-100 scale-100'}
                  `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <div
              className={`
                    overflow-hidden transition-all duration-500 ease-out
                    transform ${!isOpen ? 'translate-x-0' : expandedCategories[category.category] ? 'translate-x-0' : '-translate-x-2'}
                    ${!isOpen ? 'max-h-none' : expandedCategories[category.category] ? 'max-h-[500px]' : 'max-h-0'}
                    ${!isOpen ? 'pl-0' : 'pl-2'}
                `}
            >
              {category.items.map((item, itemIndex) =>
              hasAccess(item) && // Apply role-based access control
              (
                <div
                  key={itemIndex}
                  className={`
                      flex items-center p-3 my-1 rounded-lg cursor-pointer 
                      text-gray-700 hover:bg-blue-50 hover:text-blue-600 
                      transition-all duration-300 ease-out
                      transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-0 opacity-100'}
                      ${pathname === item.path ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : ''}
                      ${!isOpen ? 'justify-center' : ''}
                    `}
                  style={{
                    transitionDelay: isOpen ? `${itemIndex * 50}ms` : '0ms'
                  }}
                  onClick={() => router.push(item.path)}
                  title={!isOpen ? item.name : ''}
                >
                  <div className={`
                        flex-shrink-0 w-4 h-4
                        transition-all duration-300 ease-out
                        ${isOpen ? 'mr-3 scale-100' : 'mr-0 scale-110'}
                    `}>
                    {item.icon}
                  </div>
                  <span className={`
                        flex-1 
                        transition-all duration-300 ease-out
                        text-[16px]
                        whitespace-nowrap
                        overflow-hidden
                        ${isOpen ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 -translate-x-2 w-0'}
                    `}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className={`
                          text-[16px] py-0.5 px-1.5 rounded-full ml-auto
                          transition-all duration-300 ease-out
                          ${getBadgeClass(item.badge.type)}
                          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 w-0 h-0 pointer-events-none'}
                      `}>
                      {item.badge.text}
                    </span>
                  )}
                </div>
              )
              )}
            </div>

            {categoryIndex < sidebarItemsData.length - 1 && <div className={`h-px bg-gray-200/70 my-1 ${!isOpen ? 'hidden' : ''}`}></div>}
          </div>
        ))}
      </div>

      {/* <div className={`p-4 border-t border-gray-200/70 ${!isOpen ? 'hidden' : ''}`}>
        <div className="bg-gray-50/50 p-4 rounded-lg flex items-start gap-3 border border-gray-200/50">
          <div className="w-8 h-8 rounded-md bg-blue-100/60 flex items-center justify-center text-blue-600 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1 text-gray-800">Need help?</h4>
            <p className="text-xs text-gray-600 mb-3">Check our documentation</p>
            <button className="bg-white/80 text-blue-600 border border-blue-300/40 py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 hover:bg-white hover:border-blue-600">
                View Docs
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;
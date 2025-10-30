"use client"
import React, { useContext, useState, useRef, useEffect, ReactElement } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MailIcon, UserIcon } from 'lucide-react';
import { removeToken } from '@/_utils/cookies';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
// import AuthContext, { AuthContextType } from '@/contexts/AuthContext'; // Adjust path as needed

interface NavbarProps {
  toggleSidebar?: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'call' | 'calendar' | 'system';
  read: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  // const authContext = useContext<AuthContextType | null>(AuthContext);
  const router = useRouter();
  const pathName = usePathname();
  const isActionsPath = pathName === "/actions-management";
  const {profileDetails} = useSelector((state: any) => state.company);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // authContext?.logout();
    removeToken()
    router.push('/login');
    setShowUserMenu(false);
  };

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const notifications: Notification[] = [
    { id: 1, title: 'New call received', message: 'You have a new missed call from (555) 123-4567', time: '5 minutes ago', type: 'call', read: false },
    { id: 2, title: 'Appointment scheduled', message: 'Dr. Smith has confirmed the appointment for tomorrow at 2:00 PM', time: '1 hour ago', type: 'calendar', read: false },
    { id: 3, title: 'System update', message: 'AI Receptionist has been updated to the latest version', time: '2 hours ago', type: 'system', read: true },
  ];

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']): ReactElement => {
    switch (type) {
      case 'call':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        );
      case 'calendar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      case 'system':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      default:
        return <></>;
    }
  };

   const notificationIconBgColor = (type: Notification['type']): string => {
    switch (type) {
        case 'call': return 'bg-blue-500/25 text-blue-300';
        case 'calendar': return 'bg-green-500/25 text-green-300';
        case 'system': return 'bg-sky-500/25 text-sky-300';
        default: return 'bg-gray-500/25 text-gray-300';
    }
   }


  return (
    <div className="fixed top-0 left-0 right-0 flex h-16 items-center justify-between bg-white/80 px-4 shadow-sm backdrop-blur-md border-b border-gray-200/60 md:px-6 z-[100]">
      <div className="flex items-center gap-2 md:gap-4">
        {isActionsPath ? (
           <div
           className="flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-blue-600/10 hover:text-blue-600"
          
           aria-label="Toggle sidebar"
         >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
           </svg>
         </div>
        ) :(

          <button
          className="flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-600 transition-all duration-150 hover:bg-blue-600/10 hover:text-blue-600"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        )}
       
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200">
            <Image src="/eva_logo.png" alt="logo" width={30} height={30} />
          </div>
          <div className="text-md font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent md:text-lg">
         EvaSpeaks
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications */}
        {/* <div className="relative" ref={notificationMenuRef}>
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-md p-2 transition-all duration-150 hover:bg-blue-600/10"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 mt-1 w-80 origin-top-right rounded-lg bg-slate-800/90 text-white shadow-lg backdrop-blur-sm border border-slate-700/50 overflow-hidden animate-fadeInScaleUp">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <h3 className="text-base font-semibold">Notifications</h3>
                <button className="bg-transparent border-none p-0 text-xs font-medium text-blue-400 hover:text-blue-300">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex cursor-pointer gap-3 border-b border-slate-700 px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-blue-600/15 ${notification.read ? 'opacity-70' : ''}`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${notificationIconBgColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-sm font-semibold text-white">{notification.title}</div>
                      <div className="mb-1 text-xs text-slate-300 line-clamp-2">{notification.message}</div>
                      <div className="text-xs text-slate-400">{notification.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700 px-4 py-3">
                <button className="w-full rounded-md bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div> */}

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <div
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800 ring-2 ring-white/80 transition-all duration-300 hover:scale-105 hover:ring-blue-100 md:h-10 md:w-10"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            aria-label="User menu"
            tabIndex={0}
          >
            <UserIcon className='w-6 h-6'/>
            {/* {getInitials(authContext?.currentUser?.name)} */}
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-12 mt-1 w-60 origin-top-right rounded-lg bg-slate-800/90 text-white shadow-lg backdrop-blur-sm border border-slate-700/50 overflow-hidden animate-fadeInScaleUp">
              {/* <div className="border-b border-slate-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
                    {getInitials(authContext?.currentUser?.name)}
                    
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{authContext?.currentUser?.name || 'User'} </div>
                    <div className="text-xs text-slate-400">{authContext?.currentUser?.email || ''}</div>
                  </div>
                </div>
              </div> */}

              {/* <div className="py-1">
                {[
                  { path: '/profile', label: 'My Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
                  { path: '/settings', label: 'Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
                  { path: '/billing', label: 'Billing', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> },
                ].map(item => (
                  <a
                    key={item.path}
                    href={item.path}
                      onClick={(e) => { e.preventDefault(); router.push(item.path); setShowUserMenu(false);}}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors duration-150 hover:bg-blue-600/20 hover:text-white"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
              </div> */}

              <div className="h-px bg-slate-700"></div>

              <div className="py-1">
              {(profileDetails?.first_name && profileDetails?.last_name) && (<div className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors duration-150 hover:bg-blue-600/20 hover:text-white">
                  <UserIcon className='w-6 h-6' />
                  {profileDetails?.first_name} {profileDetails?.last_name}
                </div>)}
                <div className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors duration-150 hover:bg-blue-600/20 hover:text-white">
                  <MailIcon className='w-6 h-6'/>
                  {profileDetails.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors duration-150 hover:bg-red-500/20 hover:text-red-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

// Add this to your tailwind.config.js or a global CSS file for the animation
/*
@layer utilities {
  .animate-fadeInScaleUp {
    animation: fadeInScaleUp 0.2s ease-out forwards;
  }
}

@keyframes fadeInScaleUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
*/
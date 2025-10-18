'use client';
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import AccountsComponent from '@/component/SettingsComponent/AccountsComponent';
import { useSelector } from 'react-redux';
import { FiMessageSquare } from 'react-icons/fi';
import { getSmtpConfigApiRequest } from '@/network/api';
import SmtpComponent from '@/component/SettingsComponent/SmtpComponent';
import Card from '@/component/common/Card';
import { FormGroup, FormLabel, FormSelect } from '@/component/common/FormElements';
import Button from '@/component/common/Button';
import NotificationComponent from '@/component/SettingsComponent/NotificationComponent/NotificationComponent';


const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  const companyData = useSelector((state: any) => state.company.companyData);

  const getSmtpConfig = async () => {
    try {
      const response = await getSmtpConfigApiRequest();
      console.log(response?.data);
      if (response?.data) {
        setSmtpConfig(response?.data);
      }
    } catch (error) {
      console.log(error);
    }
  };





  const settingsSections = [
    {
      id: 'account',
      name: 'Account',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      description: 'User profile settings'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      description: 'Alert and update preferences'
    },

    {
      id: 'smtp',
      name: 'SMTP',
      icon: (
        <FiMessageSquare className='w-5 h-5' />
      ),
      description: 'SMTP Configuration'
    }
  ];

  useEffect(() => {
    getSmtpConfig();
  }, []);

  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <AccountsComponent />
        );
        case 'notifications':
          return (
            <>
            <NotificationComponent companyData={companyData}/>
            </>
           
          );
          
      case 'smtp':
        return (
          <SmtpComponent smtpConfig={smtpConfig} setSmtpConfig={setSmtpConfig} />
        )

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div>
          <div className="text-2xl font-semibold">Settings</div>
          <div className="text-gray-600">Configure your AI Receptionist preferences</div>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-200 relative overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {settingsSections.map(section => (
            <div
              key={section.id}
              className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer min-w-[100px] transition-all  ${activeTab === section.id
                ? 'bg-blue-100 text-blue-700'
                : 'border-transparent hover:bg-gray-50'
                }`}
              onClick={() => setActiveTab(section.id)}
            >
              <div className={`mb-2 ${activeTab === section.id ? 'text-primary' : 'text-gray-500'}`}>
                {section.icon}
              </div>
              <div className="text-sm font-medium">{section.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        {renderSettingsContent()}
      </div>
    </div>
  );
};

export default Settings;
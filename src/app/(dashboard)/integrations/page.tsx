'use client';
export const runtime = 'edge';

import Button from '@/component/common/Button'
import Card from '@/component/common/Card'
import Link from 'next/link'
import React from 'react'
import { FaSlack, FaHubspot, FaCalendar, FaAppStore} from 'react-icons/fa'

type Props = {}

const integrations = [
  {
    name: 'Calendar',
    description: 'Sync your calendar with Google and Outlook',
    icon: <FaCalendar className="w-8 h-8" />,
    path: '/integrations/synced-calendars',
    connected: false
  },
  {
    name: 'Zoho',
    description: 'Connect your Zoho CRM for integration',
    icon: <FaAppStore className="w-8 h-8" />,
    path: '/integrations/zoho',
    connected: false,
    // status: "coming soon"
  },
]

const AppIntegrations = (props: Props) => {
  return (
    <div className='flex flex-col gap-4 pt-5'>
        <div className='w-full h-full'>
            <h1 className='text-2xl font-bold'>App Integrations</h1>
            <p className='text-sm text-gray-500 mt-2'>
                Connect your apps to your account to get started
            </p>  
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
                {integrations.map((integration, index) => (
                    <Card key={index} className='p-4 border rounded-lg hover:shadow-md transition-shadow flex flex-col gap-2'>
                        <div className='flex items-center gap-3 mb-3'>
                            {integration.icon}
                            <h3 className='text-lg font-semibold'>{integration.name}</h3>
                        </div>
                        <p className='text-sm text-gray-600 mb-4'>{integration.description}</p>
                        <Link href={integration.path}>
                        <Button 
                        disabled={(integration as any).status === "coming soon"}
                            className={`w-full py-2 px-4 rounded-md ${
                                integration.connected 
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            >
                                {(integration as any).status === "coming soon" ? (integration as any).status : integration.connected ? 'Connected' : 'Configure'}
                            </Button>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  )
}

export default AppIntegrations
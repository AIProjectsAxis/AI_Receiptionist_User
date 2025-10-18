"use client"
export const runtime = 'edge';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/component/common/Table';
import Button from '@/component/common/Button';
import Card from '@/component/common/Card';
import { getAssistantListApiRequest, getCalendarEventsApiRequest, getCallListApiRequest, getCompanyCountsStatsApiRequest, getCompanyOnBoardingApiRequest } from '@/network/api';
import { Bot, Loader2, NotebookTabs, X } from 'lucide-react';
import { GrAction } from 'react-icons/gr';
import { FormInput, FormSelect } from '@/component/common/FormElements';

import { formatDate, formatDateForAPI, formatDuration } from '@/_utils/general';
import { IoLanguageOutline } from 'react-icons/io5';
import { CiCircleInfo } from 'react-icons/ci';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { createAgentApiRequest } from '@/network/api';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const singleLoader = useRef(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [companyCountsStats, setCompanyCountsStats] = useState<any>({});
  const [isLoader, setIsLoader] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [scrolled, setScrolled] = useState(false);
  const [callListData, setCallListData] = useState<any>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [calanderBookings, setCalanderBookings] = useState<any[]>([]);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const companyData = useSelector((state: any) => state.company.companyData);


  const defaultPrompt = {
    voice: "Xb7hH8MSUJpSbSDYk0k2",
    system_prompt: "You are a witty, friendly, and slightly quirky voice assistant for Mary's Dental, a dental clinic located at 123 North Face Place, Anaheim, California. The clinic operates from 8 AM to 5 PM, Monday through Saturday, and is closed on Sundays. Dr. Mary Smith is the practicing dentist.\n\nYour primary job is to:\n\nAnswer common questions about the clinic.\n\nBook appointments in a smooth, natural, and friendly way.\n\nWhen a user interacts with you, your goal is to:\n\nAsk for their full name.\n\nAsk the reason or purpose for the dental appointment.\n\nAsk their preferred date and time.\n\nConfirm all details clearly before wrapping up.\n\nTone & Style Guidelines:\n\nKeep responses short and conversational — just like a real phone call.\n\nUse casual, natural phrases like \"Umm…\", \"Cool!\", \"I mean…\", \"No worries!\", etc.\n\nBe a little funny or quirky when appropriate, but never at the cost of clarity.\n\nAlways be polite and helpful — you're the friendly face (well, voice) of the clinic.\n\nIf the user doesn't specify what they want, politely steer the conversation toward either answering a question or booking an appointment.\n\nNever ramble. Short, quick replies work best.",
    first_message: "Hello, this is Mary from Mary's Dental. How can I assist you today?",
    end_call_message: "Thank you for contacting us. If you need anything else, feel free to reach out anytime. Have a great day!",
    voicemail_message: "Thank you for contacting us. We are unable to answer your call right now. Please leave a message and we will get back to you as soon as possible.",
    availability: companyData?.business_hours
  };

  const { handleSubmit, errors, resetForm, values, setFieldValue } = useFormik({
    initialValues: {
      name: '',
      description: '',
      // type: 'inbound'
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      description: Yup.string().required('Description is required'),
      // type: Yup.string().required('Type is required')
    }),
    onSubmit: async (values) => {
      setBtnLoading(true);
      const payload = {
        ...defaultPrompt,
        name: values.name,
        description: values.description,
        // type: values.type
      }
      try {
        const response = await createAgentApiRequest(payload);
        if (response) {
          router.push(`/ai-agents/${response.data?.assistant?.id}`);
          toast.success('Agent created successfully', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
         
          // setShowCreatePopup(false);
          // resetForm();
        } else {
          toast.error('Failed to create agent', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
        }
      } catch (error) {
        console.error('Error creating agent:', error);
        toast.error('Failed to create agent', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } finally {
        setLoading(false);
        setBtnLoading(false);
      }
    }
  });
  // Handle scroll event for fixed header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getOnBoarding = async () => {
    const res = await getCompanyOnBoardingApiRequest();
  };

  // Handle routing based on company data status
  useEffect(() => {
    if (!companyData) return; // Don't redirect if company data is not loaded yet
    
    if (companyData?.status_onboarding === "completed" && companyData?.status === "pending") {
      router.push('/approval-pending');
      return;
    } else if (companyData?.status_onboarding === "completed" && companyData?.status === "approved") {
      // Don't redirect to dashboard if we're already on dashboard
      return;
    } else if (companyData?.status === "pending" && (companyData?.status_onboarding === "pending_onboarding" || companyData?.status_onboarding !== "completed" || companyData?.status_onboarding === "step_1" || companyData?.status_onboarding === "step_2" || companyData?.status_onboarding === "step_3")) {
      router.push('/onboarding');
      return;
    }
  }, [companyData, router]);

  // Stat card data
  const statCards = [
    {
      title: 'Total Calls',
      link: '/call-history',
      value: companyCountsStats?.calls || 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      ),
      color: 'primary'
    },
    {
      title: 'Assistant',
      link: '/ai-agents',
      value: companyCountsStats?.assistant || 0,
      icon: (
        (<Bot />)
      ),
      color: 'success'
    },
    {
      title: 'Phone Numbers',
      link: '/phone-setup',
      value: companyCountsStats?.phone_numbers || 0,
      icon: (
        <NotebookTabs />
      ),
      color: 'info'
    },
    {
      title: 'Actions',
      link: '/actions-management',
      value: companyCountsStats?.actions || 0,
      change: '+12%',
      changeDirection: 'down',
      icon: (
        <GrAction />
      ),
      color: 'warning'
    }
  ];

  // Table columns
  const callsColumns = [
    {
      header: 'Caller',
      accessor: 'caller',
      render: (row: any) => (
        <div className="font-medium py-[5px]">{row.caller}</div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'datetime',
      render: (row: any) => {
        return <div className="font-medium text-sm">{formatDate(row.started_at)}</div>
      }
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row: any) => {
        return <div className="font-medium text-sm">{formatDuration(row.duration_ms)}</div>
      }
    },
  ];

  const appointmentsColumns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row: any) => (
        <div className="font-medium">{row?.name || "--"}</div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'datetime',
      render: (row: any) => (
        <div className="font-medium">{formatDate(row?.end_time)}</div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: any) => {
        let badgeClass = 'bg-blue-100 text-blue-800';

        if (row.status === 'Pending') {
          badgeClass = 'bg-yellow-100 text-yellow-800';
        } else if (row.status === 'Confirmed') {
          badgeClass = 'bg-green-100 text-green-800';
        } else if (row.status === 'Cancelled') {
          badgeClass = 'bg-red-100 text-red-800';
        }

        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>{row.status}</span>;
      }
    },
  ];
  const getStatusColorClasses = (isActive: boolean): { dot: string; text: string; avatarBg: string; avatarText: string; toggleBg: string; } => {
    if (isActive) {
      return { dot: 'bg-green-500', text: 'text-green-600', avatarBg: 'bg-blue-100', avatarText: 'text-blue-600', toggleBg: 'bg-blue-600' };
    }
    return { dot: 'bg-yellow-500', text: 'text-yellow-600', avatarBg: 'bg-gray-100', avatarText: 'text-gray-600', toggleBg: 'bg-gray-300' };
  };

  const getCompanyCountsStats = async () => {
    const response = await getCompanyCountsStatsApiRequest();
    setCompanyCountsStats(response?.data);
    setIsLoader(false);
  }

  const getAllCallListData = async () => {
    try {
      const response = await getCallListApiRequest();
      setCallListData(response.data?.calls.slice(0, 4));
    } catch (error) {
      console.error('Error fetching call list:', error);
    }
  }

  const getAllAgents = async () => {
    const response = await getAssistantListApiRequest();
    setAgents(response.data?.assistants.slice(0, 2));
  }

  const getCalendarEvents = async () => {
    const startDate = new Date();
    const endDate = new Date();
    const startDateStr = formatDateForAPI(startDate);
    const endDateStr = formatDateForAPI(endDate);
    endDate.setDate(endDate.getDate() + 30);
    const response = await getCalendarEventsApiRequest(undefined, startDateStr, endDateStr);
    const data = response.data?.bookings.slice(0, 8);
    setCalanderBookings(data);
  }

  useEffect(() => {
    if (!singleLoader.current && companyData) {
      // Only run API calls if we're not about to redirect
      const shouldRedirect = 
        (companyData?.status_onboarding === "completed" && companyData?.status === "pending") ||
        (companyData?.status === "pending" && (companyData?.status_onboarding === "pending_onboarding" || companyData?.status_onboarding !== "completed" || companyData?.status_onboarding === "step_1" || companyData?.status_onboarding === "step_2" || companyData?.status_onboarding === "step_3"));
      
      if (!shouldRedirect) {
        setIsLoader(true);
        getCompanyCountsStats();
        getOnBoarding();
        getAllCallListData();
        getAllAgents();
        getCalendarEvents();
      }
    }
    singleLoader.current = true;
  }, [companyData]);

  return (
    <>
      {showCreatePopup && (
        <form onSubmit={handleSubmit} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <Card className="w-[550px] p-6 relative">
            <button
              onClick={() => setShowCreatePopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <div className=''>
              <Bot className='w-10 h-10' />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Agent</h2>
              <p className="text-gray-500 mb-6 text-sm">Configure your new virtual assistant with basic details</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name
                </label>
                <FormInput
                  value={values.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFieldValue('name', e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Enter agent name"
                  className="w-full"
                  name="name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <FormInput
                  value={values.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFieldValue('description', e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Enter agent role"
                  className="w-full"
                  name="description"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Type
                </label>
                <Select>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent className='w-full   '>
                  <SelectItem className='w-full bg-white cursor-pointer' value="inbound">Inbound</SelectItem>
                  <SelectItem className='w-full bg-white cursor-pointer' value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
                <select defaultValue="inbound" className='w-full bg-white border border-gray-300 rounded-md p-2' onChange={(e) => setFieldValue('type', e.target.value)}>
                  <option className='cursor-pointer' value="inbound">Inbound</option>
                  <option className='cursor-pointer' value="outbound">Outbound</option>
                </select>
              </div> */}

              <Button
                variant="primary"
                className="w-full mt-6"
                type="submit"
                disabled={btnLoading}
              >
                {btnLoading && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
                Create Agent
              </Button>
            </div>
          </Card>
        </form>
      )}
      {isLoader ? (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          <div className="pt-4 pb-8">
            <h1 className='text-3xl mb-4 font-bold'>{companyCountsStats?.name} Dashboard</h1>
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <Link key={index} href={stat.link} className="bg-white/70  cursor-pointer backdrop-blur-sm border border-gray-200 rounded-lg p-5 shadow-md transition-all duration-200 hover:translate-y-[-3px] hover:shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'primary' ? 'bg-blue-100 text-blue-600' : stat.color === 'success' ? 'bg-green-100 text-green-600' : stat.color === 'info' ? 'bg-cyan-100 text-cyan-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {stat.icon}
                    </div>
                    <div className="font-medium text-gray-700">{stat.title}</div>
                  </div>
                  <div className="text-3xl font-bold mb-2 text-gray-900">{stat.value}</div>
                  {/* <div className={`flex items-center space-x-2 text-sm font-medium ${stat.changeDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {stat.changeDirection === 'up' ? (
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  ) : (
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                  )}
                </svg>
                <span>{stat.change} from last month</span>
              </div> */}
                </Link>
              ))}
            </div>

            {/* Active AI Agents Section */}
            <div className="flex items-center justify-between my-8">
              <h2 className="text-xl font-semibold text-gray-900">Active AI Agents</h2>
              <Button variant="text" onClick={() => router.push('/ai-agents')}>View All</Button>
            </div>

            <div className="grid grid-cols-3 gap-5 mb-8">
              {agents.map((agent: any) => {
                const statusColors = getStatusColorClasses(agent.is_active);
                return (
                  <div
                    key={agent.id}
                    onClick={() => router.push(`/ai-agents/${agent.id}`)}
                    className="group relative rounded-2xl  bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-6 pt-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-14 h-14 flex items-center justify-center rounded-xl text-xl font-bold uppercase ${statusColors.avatarBg} ${statusColors.avatarText}`}
                        >
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <h3
                            className="text-lg font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-[200px] md:max-w-[200px] lg:max-w-[248px]"
                            title={agent.name}
                          >
                            {agent.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-1 pb-6 mt-4'>
                      <div className="px-6 flex items-center gap-3">
                        <span><CiCircleInfo /></span>
                        <p className="text-gray-600 text-sm max-w-[200px] truncate line-clamp-3">{agent.description}</p>
                      </div>
                      {/* <div className="px-6 flex items-center gap-3">
                        <span><IoLanguageOutline /></span>
                        <p className="text-gray-600 text-sm max-w-[200px] truncate line-clamp-3">{agent.language}</p>
                      </div> */}
                    </div>

                  </div>
                );
              })}

              {/* "Create New Agent" Card */}
              <div className="bg-white/60 border border-dashed border-blue-300 rounded-lg p-5 shadow-md transition-all duration-200 hover:bg-white/80 hover:border-blue-500 cursor-pointer flex items-center justify-center"
                onClick={() => setShowCreatePopup(true)}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-600">Create New Agent</h3>
                  <p className="text-sm text-gray-600">Set up another AI receptionist</p>
                </div>
              </div>
            </div>

            {/* Activity Tables Section */}
            <div className="grid grid-cols-2 gap-5">
              <Card
                title="Recent Calls"
                subtitle="Latest call activity"
                actions={
                  <Button
                    variant="text"
                    onClick={() => router.push('/call-history')}
                  >
                    View All
                  </Button>
                }
              >
                <Table columns={callsColumns} data={callListData} />
              </Card>

              <Card
                title="Upcoming Appointments"
                subtitle="Scheduled appointments"
                actions={
                  <Button
                    variant="text"
                    onClick={() => router.push('/appointments')}
                  >
                    View All
                  </Button>
                }
              >
                <Table columns={appointmentsColumns} data={calanderBookings} />
              </Card>
            </div>
          </div>

          {/* Appointment Modal */}
          {showAppointmentModal && (
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
              <div className="bg-white/80 backdrop-blur-lg rounded-lg w-[500px] max-w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-xl animate-modalFadeIn">
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Schedule New Appointment</h3>
                  <button
                    className="text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 p-1 rounded-md transition-all duration-150"
                    onClick={() => setShowAppointmentModal(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Enter client name" />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select a service</option>
                      <option value="consultation">Consultation</option>
                      <option value="followup">Follow-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="flex space-x-4 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="Add any relevant notes"></textarea>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-200 flex justify-end space-x-3">
                  <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>Cancel</Button>
                  <Button variant="primary">Schedule</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Dashboard;
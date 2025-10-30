"use client";
export const runtime = 'edge';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Card from '@/component/common/Card';
import Button from '@/component/common/Button';
import { FormInput, FormSelect } from '@/component/common/FormElements';
import { createAgentApiRequest, createCloneAgent, deleteAgentApiRequest, getAssistantListApiRequest, updateAgentApiRequest } from '@/network/api';
import { Bot, CopyPlus, Loader2, PhoneCallIcon, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import { CiCircleInfo } from "react-icons/ci";
import { IoLanguageOutline } from "react-icons/io5";
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { MdDeleteOutline } from 'react-icons/md';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/component/common/select';
import { useSelector } from 'react-redux';


// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/component/common/select';

interface Agent {
  id: string;
  name: string;
  description: string;
  first_message: string;
  language: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
  recording_enabled: boolean;
  hipaa_enabled: boolean;
  is_active: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const singleTimePageLoad = useRef(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentIdToDelete, setAgentIdToDelete] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const router = useRouter();
  const companyData = useSelector((state: any) => state.company.companyData);
  console.log(companyData, "companyData");
  const defaultPrompt = {
    voice: "Xb7hH8MSUJpSbSDYk0k2",
    system_prompt: "You are a witty, friendly, and slightly quirky voice assistant for Mary's Dental, a dental clinic located at 123 North Face Place, Anaheim, California. The clinic operates from 8 AM to 5 PM, Monday through Saturday, and is closed on Sundays. Dr. Mary Smith is the practicing dentist.\n\nYour primary job is to:\n\nAnswer common questions about the clinic.\n\nBook appointments in a smooth, natural, and friendly way.\n\nWhen a user interacts with you, your goal is to:\n\nAsk for their full name.\n\nAsk the reason or purpose for the dental appointment.\n\nAsk their preferred date and time.\n\nConfirm all details clearly before wrapping up.\n\nTone & Style Guidelines:\n\nKeep responses short and conversational — just like a real phone call.\n\nUse casual, natural phrases like \"Umm…\", \"Cool!\", \"I mean…\", \"No worries!\", etc.\n\nBe a little funny or quirky when appropriate, but never at the cost of clarity.\n\nAlways be polite and helpful — you're the friendly face (well, voice) of the clinic.\n\nIf the user doesn't specify what they want, politely steer the conversation toward either answering a question or booking an appointment.\n\nNever ramble. Short, quick replies work best.",
    first_message: "Hello, this is Mary from Mary's Dental. How can I assist you today?",
    end_call_message: "Thank you for contacting us. If you need anything else, feel free to reach out anytime. Have a great day!",
    voicemail_message: "Thank you for contacting us. We are unable to answer your call right now. Please leave a message and we will get back to you as soon as possible.",
    availability: companyData?.business_hours
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const sortOptions: SelectOption[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'recent', label: 'Recently Updated' }
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10 per page' },
    { value: '20', label: '20 per page' },
    { value: '30', label: '30 per page' },
    { value: '40', label: '40 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' }
  ];

  const getStatusColorClasses = (isActive: boolean): { dot: string; text: string; avatarBg: string; avatarText: string; toggleBg: string; } => {
    if (isActive) {
      return { dot: 'bg-green-500', text: 'text-green-600', avatarBg: 'bg-blue-100', avatarText: 'text-blue-600', toggleBg: 'bg-blue-600' };
    }
    return { dot: 'bg-yellow-500', text: 'text-yellow-600', avatarBg: 'bg-gray-100', avatarText: 'text-gray-600', toggleBg: 'bg-gray-300' };
  };

  const getAllAgents = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const response = await getAssistantListApiRequest(page, size);
      const assistants = response.data?.assistants.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        first_message: assistant.first_message,
        language: assistant.language,
        created_at: assistant.created_at,
        updated_at: assistant.updated_at,
        status: assistant.is_active ? 'active' : 'inactive',
        recording_enabled: assistant.recording_enabled,
        hipaa_enabled: assistant.hipaa_enabled,
        is_active: assistant.is_active,
        system_prompt: assistant.system_prompt,
        voice: assistant.voice,
        end_call_message: assistant.end_call_message,
        voicemail_message: assistant.voicemail_message
      }));
      setAgents(assistants);
      
      // Set pagination metadata
      setTotalPages(response.data?.total_pages || 1);
      setTotalCount(response.data?.total_count || assistants.length);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!singleTimePageLoad.current) {
      getAllAgents();
      singleTimePageLoad.current = true;
    }
  }, []);

  useEffect(() => {
    if (singleTimePageLoad.current) {
      getAllAgents(currentPage, pageSize);
    }
  }, [currentPage, pageSize]);

  const handleCreateCloneAgent = async (agentId: string) => {
    try {
      const response = await createCloneAgent(agentId);
      if (response) {
        getAllAgents();
        toast.success('Clone agent created successfully', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        toast.error('Failed to create clone agent');
      }
    } catch (error) {
      console.error('Error creating clone agent:', error);
    }
  }

  const { handleSubmit, errors, resetForm, values, setFieldValue } = useFormik({
    initialValues: {
      name: '',
      description: '',  
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
          
          setShowCreatePopup(false);
          resetForm();
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

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteAgentApiRequest(agentIdToDelete);
      if (response) {
        toast.success('Agent deleted successfully', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowDeleteConfirm(false);
        getAllAgents();
        setAgentIdToDelete('');
      } else {
        toast.error('Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  }

  return (
    <div className='pt-5'>
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
                <select defaultValue="inbound"  className='w-full bg-white border border-gray-300 rounded-md p-2' onChange={(e) => setFieldValue('type', e.target.value)}>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-base xl:text-lg text-gray-500 mt-1">Manage your virtual receptionists</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="primary"
            className="text-white"
            onClick={() => setShowCreatePopup(true)}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Agent
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <FormInput
              placeholder="Search agents..."
              value={searchQuery}
              disabled={loading}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-lg"
              style={{
                paddingLeft: '40px'
              }}
            />
            <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto justify-end">
          <span className="text-sm text-gray-600">Show:</span>
          <FormSelect
            value={pageSize.toString()}
            disabled={loading}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handlePageSizeChange(parseInt(e.target.value))}
            options={pageSizeOptions}
            className="min-w-[120px] w-full sm:w-auto"
          />
          <span className="text-sm text-gray-600">Sort by:</span>
          <FormSelect
            value={sortBy}
            disabled={loading}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
            options={sortOptions}
            className="min-w-[180px] w-full sm:w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full mt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const statusColors = getStatusColorClasses(agent.is_active);
            return (
              <div
                key={agent.id}
                onClick={() => router.push(`/ai-agents/${agent.id}`)}
                className="group relative rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
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
                        className="text-lg font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-[260px] md:max-w-[200px] lg:max-w-[260px]"
                        title={agent.name}
                      >
                        {agent.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className='space-y-1 mt-4'>
                  <div className="px-6 flex items-center gap-3">
                    <span><CiCircleInfo /></span>
                    <p className="text-gray-600 text-sm max-w-[200px] truncate line-clamp-3">{agent.description}</p>
                  </div>
                  {/* <div className="px-6 flex items-center gap-3">
                    <span><IoLanguageOutline /></span>
                    <p className="text-gray-600 text-sm max-w-[200px] truncate line-clamp-3">{agent.language}</p>
                  </div> */}
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-gray-200/70 border-t mt-6">
                  <div className="flex gap-3">
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateCloneAgent(agent.id);
                      }}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                      title="Clone Agent"
                    >
                      <CopyPlus className="w-5 h-5 text-gray-600" />
                    </button> */}
                    {/* <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                      title="Call Agent"
                    >
                      <PhoneCallIcon className="w-5 h-5 text-gray-600" />
                    </button> */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgentIdToDelete(agent.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 rounded-md bg-red-400 hover:bg-red-600 transition-colors cursor-pointer"
                      title="Delete Agent"
                    >
                      <MdDeleteOutline className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    Updated {new Date(agent.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[2000]  bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this agent? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setAgentIdToDelete('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} agents
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2"
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "secondary"}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 min-w-[40px] ${
                      currentPage === pageNum 
                        ? "bg-[#6D4AFF] text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="secondary"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
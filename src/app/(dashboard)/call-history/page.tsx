"use client";
export const runtime = 'edge';

import Button from '@/component/common/Button';
import Card from '@/component/common/Card';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Table from '@/component/common/Table';
import { FormInput, FormSelect } from '@/component/common/FormElements';
import { getAssistantListApiRequest, getCallListApiRequest } from '@/network/api';
import { Eye, PauseIcon, PlayIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';


interface Call {
  id: string;
  company_id: string;
  assistant_id: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  recording_url: string;
  caller: string;
}

interface Column<T> {
  header: string;
  accessor: keyof T | 'actions';
  render?: (row: T) => React.ReactNode;
}

interface ColumnDefinition extends Column<Call> { }

interface CallListResponse {
  calls: Call[];
  total_number_of_calls: number;
}

const CallHistory: React.FC = () => {

  const router = useRouter()

  const [callsData, setCallsData] = useState<Call[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCalls, setTotalCalls] = useState<number>(0);
  const itemsPerPage = 10;
  const [agents, setAgents] = useState<any[]>([]);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
  };

  const callsColumns: ColumnDefinition[] = [
    {
      header: '#',
      accessor: 'id',
      render: (row: Call) => {
        const index = callsData.findIndex(call => call.id === row.id);
        return (
          <div className="font-medium text-gray-900">{((currentPage - 1) * itemsPerPage) + index + 1}</div>
        );
      },
    },
    {
      header: 'Agent',
      accessor: 'assistant_id',
      render: (row) => agents.find((agent: any) => agent.id === row.assistant_id)?.name || 'N/A',
    },  
    {
      header: 'Caller',
      accessor: 'caller',
      render: (row) => (
        <div className="font-medium text-gray-900">{row.caller}</div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: 'started_at',
      render: (row) => formatDateTime(row.started_at),
    },
    {
      header: 'Duration',
      accessor: 'duration_ms',
      render: (row) => formatDuration(row.duration_ms),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
        
          <div onClick={() => {
            const audioElement = document.getElementById(`audio-${row.id}`) as HTMLAudioElement;
            if (!audioElement) {
              const newAudio = new Audio(row.recording_url);
              newAudio.id = `audio-${row.id}`;
              document.body.appendChild(newAudio);
            }
            
            const audio = document.getElementById(`audio-${row.id}`) as HTMLAudioElement;
            
            if (isPlaying === row.id) {
              audio.pause();
              audio.currentTime = 0;
              setIsPlaying('');
            } else {
              if (isPlaying) {
                const currentAudio = document.getElementById(`audio-${isPlaying}`) as HTMLAudioElement;
                if (currentAudio) {
                  currentAudio.pause();
                  currentAudio.currentTime = 0;
                }
              }
              audio.play();
              setIsPlaying(row.id);
            }
          }}>
            <Button variant="text" size="sm" className={`text-blue-600 hover:text-blue-700 cursor-pointer ${isPlaying === row.id ? '!bg-[#4361ee14 ] text-white' : 'text-gray-500'}`}>Recording
              {isPlaying === row.id ? <PauseIcon className='w-4 h-4' /> : <PlayIcon className='w-4 h-4' />}
            </Button>
          </div>
          <Button variant="text" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => router.push(`/call-history/${row.id}`)}>
            <Eye className='w-4 h-4' />
          </Button>
        </div>
      ),
    },
  ];

  const getAllCallListData = async () => {
    try {
      setLoading(true);
      const response = await getCallListApiRequest(statusFilter);
      const data = response.data as CallListResponse;
      setCallsData(data.calls);
      setTotalCalls(data.total_number_of_calls);
    } catch (error) {
      console.error('Error fetching call list:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAllAgents = async () => {
    try {
      const response = await getAssistantListApiRequest();
      const assistants = response.data?.assistants.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
      }));
      setAgents(assistants);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }


  const totalPages = Math.ceil(totalCalls / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${
            currentPage === i 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          } px-3 py-1 rounded-md`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  // Initial load
  useEffect(() => {
    getAllAgents();
  }, []);

  // Run when statusFilter changes
  useEffect(() => {
    getAllCallListData();
  }, [statusFilter]);

  return (
    <div className="w-full pt-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Call History</h1>
          <p className="text-base md:text-lg text-gray-500 mt-1">Review and analyze your AI receptionist's call log</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <FormSelect
            value={statusFilter}
            id="agent-filter"
            name='agent-filter'
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              {
                setStatusFilter(e.target.value)
              }}
            disabled={loading}
            options={[{value: '', label: 'All Agents'}, ...agents.map((agent: any) => ({ value: agent.id, label: agent.name }))]}
            className="min-w-[150px] w-[200px] sm:w-auto"
          />
        </div>
      </div>

      <Card
        title="Call Log"
        subtitle="All calls handled by your AI receptionist"
        isLoading={loading} 
        className="overflow-x-auto"
      >
        <Table columns={callsColumns} data={callsData} />

        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 px-1 sm:px-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCalls)} of {totalCalls} calls
          </div>
          <div className="flex items-center gap-1">
            <button 
              className="bg-white text-gray-700 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            {renderPaginationButtons()}
            <button 
              className="bg-white text-gray-700 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CallHistory;
'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Card from '@/component/common/Card';
import { getAssistantListApiRequest, getCallDetailsApiRequest } from '@/network/api';
import { PauseIcon, PlayIcon, PhoneIcon, ClockIcon, MessageSquare, FileText, UserIcon } from 'lucide-react';
import Button from '@/component/common/Button';
import { useParams } from 'next/navigation';

interface Message {
    message: string;
    time: number;
    role: string;
    duration?: number;
    secondsFromStart: number;
}

interface Call {
    id: string;
    company_id: string;
    assistant_id: string;
    started_at: string;
    ended_at: string;
    duration_ms: number;
    duration_minutes: number;
    duration_seconds: number;
    recording_url: string;
    caller: string;
    summary: string;
    transcript: string;
    messages: Message[];
}

export default function CallDetails() {
    const { id } = useParams();
    const [call, setCall] = useState<Call | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateStr: string): string => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            // Check if date is valid
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            return date.toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'local' // This will use the user's local timezone
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

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

    const getCallDetails = async () => {
        try {
            setLoading(true);
            const response = await getCallDetailsApiRequest(id as string);
            console.log("call details---", response.data);
            setCall(response.data || null);
        } catch (error) {
            console.error('Error fetching call details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllAgents();
        getCallDetails();
    }, [id]);

    // Check for existing audio element and its state when call data is loaded
    useEffect(() => {
        if (call) {
            const existingAudio = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
            if (existingAudio) {
                setAudioElement(existingAudio);
                setIsPlaying(!existingAudio.paused);

                // Re-add event listeners if they were lost
                existingAudio.addEventListener('play', () => setIsPlaying(true));
                existingAudio.addEventListener('pause', () => setIsPlaying(false));
                existingAudio.addEventListener('ended', () => {
                    setIsPlaying(false);
                    existingAudio.currentTime = 0;
                });
                existingAudio.addEventListener('error', () => setIsPlaying(false));
            }
        }
    }, [call]);

    // Clean up audio element when component unmounts (navigation away)
    useEffect(() => {
        const cleanupAudio = () => {
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
                audioElement.remove();
            }
            // Also check for any existing audio element with this call's ID
            const existingAudio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
            if (existingAudio) {
                existingAudio.pause();
                existingAudio.currentTime = 0;
                existingAudio.remove();
            }
        };

        // Clean up when component unmounts
        return cleanupAudio;
    }, [audioElement, id]);

    // Additional cleanup for browser navigation events
    useEffect(() => {
        const handleBeforeUnload = () => {
            const existingAudio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
            if (existingAudio) {
                existingAudio.pause();
                existingAudio.currentTime = 0;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const existingAudio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
                if (existingAudio) {
                    existingAudio.pause();
                    existingAudio.currentTime = 0;
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="min-h-screen text-center py-20">
                <h2 className="text-3xl font-bold text-black">Call not found</h2>
                <p className="mt-4 text-gray-400">The requested call details could not be found.</p>
            </div>
        );
    }

    return (
        <Card className="min-h-screen bg-white p-8 pt-0">
            <div className="max-w-6xl mx-auto">
                <div className='flex justify-between items-start'>
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-black bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Call Details
                        </h1>
                        <p className="text-gray-400 mt-2">Detailed analysis of the conversation</p>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                        <div className="flex items-center gap-2">

                            {
                                agents.find(agent => agent.id === call.assistant_id) && (
                                    <>
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <UserIcon className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {agents.find(agent => agent.id === call.assistant_id)?.name || "Unknown Agent"}
                                        </p>
                                    </>
                                )
                            }


                        </div>
                        <Button
                            variant="text"
                            style={{ border: '1px solid #E0E0E0' }}
                            className={`
                                    bg-gradient-to-r from-blue-500 to-purple-500 
                                    hover:from-blue-600 hover:to-purple-600 
                                    text-white rounded-xl px-6 py-3
                                    flex items-center justify-center gap-3 
                                    transition-all duration-300 shadow-lg
                                    hover:shadow-xl transform hover:-translate-y-0.5
                                    ${isPlaying ? 'bg-opacity-90' : ''}
                                `}
                            onClick={() => {
                                let currentAudio = audioElement;

                                if (!currentAudio) {
                                    currentAudio = new Audio(call.recording_url);
                                    currentAudio.id = `audio-${call.id}`;
                                    document.body.appendChild(currentAudio);
                                    setAudioElement(currentAudio);

                                    // Add event listeners to track audio state
                                    currentAudio.addEventListener('play', () => setIsPlaying(true));
                                    currentAudio.addEventListener('pause', () => setIsPlaying(false));
                                    currentAudio.addEventListener('ended', () => {
                                        setIsPlaying(false);
                                        if (currentAudio) currentAudio.currentTime = 0;
                                    });
                                    currentAudio.addEventListener('error', () => setIsPlaying(false));
                                }

                                if (isPlaying) {
                                    currentAudio?.pause();
                                    if (currentAudio) currentAudio.currentTime = 0;
                                } else {
                                    currentAudio?.play().catch(error => {
                                        console.error('Error playing audio:', error);
                                        setIsPlaying(false);
                                    });
                                }
                            }}
                        >
                            {isPlaying ? (
                                <>
                                    <PauseIcon className="w-6 h-6" />
                                    <span className="font-medium">Pause Recording</span>
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="w-6 h-6" />
                                    <span className="font-medium">Play Recording</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <PhoneIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Caller</h3>
                                    <p className="text-xl font-semibold text-black">{call.caller}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-lg">
                                    <ClockIcon className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Duration</h3>
                                    <p className="text-xl font-semibold text-black">{formatDuration(call.duration_ms)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-gray-400 text-sm mb-2">Start Time</h3>
                                    <p className="text-lg text-black font-medium">{formatDateTime(call.started_at)}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm mb-2">End Time</h3>
                                    <p className="text-lg text-black font-medium">{formatDateTime(call.ended_at)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grigrid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-green-500/20 rounded-lg">
                                    <MessageSquare className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-black">Call Summary</h3>
                            </div>
                            <p className="text-gray-600">{call.summary}</p>
                        </div>
                    </Card>

                    <Card className="border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-orange-500/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-orange-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-black">Transcript</h3>
                            </div>
                            <div className="space-y-6 pr-2 max-h-[600px] overflow-y-auto bg-gradient-to-b from-gray-50/30 to-transparent p-4 rounded-2xl">
                                {call.messages && call?.messages?.slice(1)?.map((message: any, index: number) => {
                                    // Skip system messages
                                    if (message.role === 'system') return null;

                                    // Handle tool calls
                                    if (message.role === 'tool_calls') {
                                        console.log('Tool calls message:', message);
                                        return (
                                            <div key={index} className="relative flex items-start gap-6">
                                                <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wrench h-5 w-5 text-white">
                                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div>

                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-semibold text-gray-900">System Action</h4>
                                                            <span className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full font-medium">{message.secondsFromStart.toFixed(1)}s</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/70 p-5 rounded-2xl border border-orange-200/50 shadow-lg backdrop-blur-sm">
                                                        <div className="flex items-center gap-3 mb-3">

                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div>

                                                                        <p className="text-sm font-medium text-orange-900">
                                                                            {message.toolCalls?.map((toolCall: any, toolIndex: number) => (
                                                                                <span key={toolIndex}>
                                                                                    {toolCall.function.name}
                                                                                    {toolIndex < message.toolCalls.length - 1 && ', '}
                                                                                </span>
                                                                            ))}
                                                                        </p>
                                                                        <p className="text-xs text-orange-700 mb-2">Function call executed</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">Processing</div>
                                                                    </div>
                                                                </div>
                                                                {message.toolCalls?.map((toolCall: any, toolIndex: number) =>
                                                                    toolCall.function.arguments ? (
                                                                        <div key={toolIndex} className="mt-2 p-2 bg-orange-100/50 rounded-lg border border-orange-200/50">
                                                                            <p className="text-xs font-medium text-orange-800 mb-1">Arguments:</p>
                                                                            <pre className="text-xs text-orange-700 whitespace-pre-wrap break-words">
                                                                                {(() => {
                                                                                    try {
                                                                                        const parsedArgs = JSON.parse(toolCall.function.arguments);
                                                                                        return JSON.stringify(parsedArgs, null, 2);
                                                                                    } catch (error) {
                                                                                        return toolCall.function.arguments;
                                                                                    }
                                                                                })()}
                                                                            </pre>
                                                                        </div>
                                                                    ) : null
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Handle tool call results
                                    if (message.role === 'tool_call_result') {
                                        return (
                                            <div key={index} className="relative flex items-start gap-6">
                                                <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wrench h-5 w-5 text-white">
                                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-semibold text-gray-900">System Result</h4>
                                                            <span className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full font-medium">{message.secondsFromStart.toFixed(1)}s</span>
                                                        </div>

                                                    </div>
                                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/70 p-5 rounded-2xl border border-orange-200/50 shadow-lg backdrop-blur-sm">
                                                        <div className="flex items-center gap-3 mb-3">

                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between">
                                                                    <div>

                                                                        <p className="text-sm font-medium text-orange-900">{message.name}</p>
                                                                        <p className="text-xs text-orange-700 mb-2">Function result</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-green-200">Success</div>
                                                                    </div>

                                                                </div>
                                                                {message.result && typeof message.result === 'object' && (
                                                                    <div className="mt-2 p-2 bg-orange-100/50 rounded-lg border border-orange-200/50">
                                                                        <p className="text-xs font-medium text-orange-800 mb-1">Result:</p>
                                                                        <pre className="text-xs text-orange-700 whitespace-pre-wrap break-words">
                                                                            {JSON.stringify(message.result, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Handle user and bot messages
                                    const isUser = message.role === 'user';
                                    const agentName = agents.find(agent => agent.id === call.assistant_id)?.name || "Agent";

                                    return (
                                        <div key={index} className={`relative flex items-start gap-6 ${isUser ? 'flex-row-reverse' : ''}`}>
                                            <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${isUser ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'}`}>
                                                {isUser ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-5 w-5 text-white">
                                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot h-5 w-5 text-white">
                                                        <path d="M12 8V4H8"></path>
                                                        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                                        <path d="M2 14h2"></path>
                                                        <path d="M20 14h2"></path>
                                                        <path d="M15 13v2"></path>
                                                        <path d="M9 13v2"></path>
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`flex items-center justify-between mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                    <h4 className="text-sm font-semibold text-gray-900">{isUser ? 'Caller' : 'AI Assistant'}</h4>
                                                    <span className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full font-medium">{message.secondsFromStart.toFixed(1)}s</span>
                                                </div>
                                                <div className={` p-5 rounded-2xl border shadow-lg backdrop-blur-sm ${isUser ? 'from-emerald-50 to-emerald-100/70 border-emerald-200/50' : 'from-slate-50 to-gray-50/80 border-slate-200/50'}`}>
                                                    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isUser ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}>
                                                            {isUser ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-4 w-4 text-emerald-600">
                                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                                    <circle cx="12" cy="7" r="4"></circle>
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot h-4 w-4 text-blue-600">
                                                                    <path d="M12 8V4H8"></path>
                                                                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                                                    <path d="M2 14h2"></path>
                                                                    <path d="M20 14h2"></path>
                                                                    <path d="M15 13v2"></path>
                                                                    <path d="M9 13v2"></path>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 mb-2">{isUser ? 'Caller' : `${agentName} (AI Assistant)`}</p>
                                                            <p className="text-sm text-gray-700 leading-relaxed">{message.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Card>
    );
}

import React, { useEffect, useState } from 'react'
import Card from '../common/Card';
import Button from '../common/Button';
import { Clock, Loader2, ChevronDown, ChevronUp, Link, Edit as EditIcon, FileIcon, X, Upload } from 'lucide-react';
import ManageAvailability from './ManageAvailiblity';

import { CardContent, CardHeader } from '../ui/card';
import { CardTitle } from '../ui/card';
import { useForm } from 'react-hook-form';
import { getCalendarAvailabilityApiRequest, getCalendarListApiRequest, getKnowledgeBaseDocumentsByIdApiRequest, getKnowledgeBaseDocumentsListApiRequest, updateAgentApiRequest, uploadKnowledgeBaseDocumentsApiRequest } from '@/network/api';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/component/common/select';
import { useParams } from 'next/navigation';
import { formatDate } from '@/_utils/general';
import { toast } from 'react-toastify';

// Utility functions
const getFileIconBgColor = (type: string) => {
    const colors: Record<string, string> = {
        'pdf': 'bg-red-100',
        'doc': 'bg-blue-100',
        'docx': 'bg-blue-100',
        'txt': 'bg-gray-100',
        'default': 'bg-gray-100'
    };
    return colors[type?.toLowerCase()] || colors.default;
};

const getFileIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
        'pdf': <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        'doc': <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        'docx': <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
        'txt': <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        'default': <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    };
    return icons[type?.toLowerCase()] || icons.default;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const statusClasses = (status: string) => {
    const classes: Record<string, { text: string; icon: JSX.Element }> = {
        'done': {
            text: 'text-green-600',
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        },
        'pending': {
            text: 'text-yellow-600',
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        'error': {
            text: 'text-red-600',
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        }
    };
    return classes[status?.toLowerCase()] || classes.pending;
};

type Props = {}

interface Calendar {
    id: string;
    name: string;
    type: string;
    status: string;
    provider_id: string;
    email: string;
    company_id: string;
    created_at: string;
    updated_at: string;
}

interface CalendarResponse {
    calendars: Calendar[];
}

const SettingsComponent = ({ agentDataForSettings, getAgentById, getKnowledgeBase, knowledgeBaseList, calendarList, agentName }: { agentDataForSettings: any, getAgentById: any, getKnowledgeBase: any, knowledgeBaseList: any, calendarList: any, agentName: string }) => {
    const availabilityDataFromServer = agentDataForSettings?.availability
    const { id } = useParams();
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [availability, setAvailability] = useState<Record<string, any>>(availabilityDataFromServer || {});
    // const [calendarList, setCalendarList] = useState<Calendar[]>([]);
    const [knowledgeBaseCollapsed, setKnowledgeBaseCollapsed] = useState(false);
    const [availabilityCollapsed, setAvailabilityCollapsed] = useState(false);
    // const [knowledgeBaseList, setKnowledgeBaseList] = useState<any[]>([]);
    const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>(agentDataForSettings?.file_ids || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm({
        defaultValues: {
            calendarId: '',
        },
    });

    const convertAvailabilityFormat = (apiAvailability: any) => {
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const formattedAvailability: any = {};

        daysOfWeek.forEach(day => {
            const dayLower = day.toLowerCase();
            const slots = apiAvailability?.[dayLower] || [];

            formattedAvailability[day] = {
                enabled: slots.length > 0,
                timeSlots: slots.map((slot: any, index: number) => ({
                    id: `${day}-${index}`,
                    startTime: convertTimeTo12Hour(slot.start_time),
                    endTime: convertTimeTo12Hour(slot.end_time)
                }))
            };
        });
        return formattedAvailability;
    };

    const convertTimeTo12Hour = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const handleAvailabilitySave = (availabilityData: any) => {
        setAvailability(availabilityData);
        setIsAvailabilityModalOpen(false);
    };


    const handleChangeCalendar = async (value: string) => {
        const payload = {
            ...agentDataForSettings,
            calendar_id: value
        }
        try {
            const res = await updateAgentApiRequest(id as string, payload)
            getAgentById()
        } catch (error) {
            console.log("error", error)
        }
    }



    const toggleKnowledgeBase = (knowledgeBaseId: string) => {
        setSelectedKnowledgeBases(prev => {
            if (prev.includes(knowledgeBaseId)) {
                return prev.filter(id => id !== knowledgeBaseId);
            } else {
                return [...prev, knowledgeBaseId];
            }
        });
    };

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];
            
            // Define allowed file types
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/msword', // .doc
                'text/plain', // .txt
                'text/markdown', // .md
                'application/rtf', // .rtf
                'application/vnd.oasis.opendocument.text' // .odt
            ];
            
            const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf', '.odt'];
            
            files.forEach(file => {
                const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
                const maxSize = 10 * 1024 * 1024; // 10MB limit
                
                if (!isValidType) {
                    invalidFiles.push(file.name);
                } else if (file.size > maxSize) {
                    invalidFiles.push(`${file.name} (file too large - max 10MB)`);
                } else {
                    validFiles.push(file);
                }
            });
            
            if (invalidFiles.length > 0) {
                toast.error(`Invalid files: ${invalidFiles.join(', ')}. Supported formats: PDF (max 10MB each), only PDF files are supported`);
                e.target.value = ''; // Reset input
                return;
            }
            
            setSelectedFiles(validFiles as any);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            toast.error("Please select files to upload");
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();

            Array.from(selectedFiles).forEach((file: File) => {
                formData.append('file', file);
            });

            console.log('Uploading files:', Array.from(selectedFiles).map(f => ({ name: f.name, type: f.type, size: f.size })));
            
            const response = await uploadKnowledgeBaseDocumentsApiRequest(formData);
            console.log('Upload response:', response);
            
            await getKnowledgeBase();

            toast.success("Files uploaded successfully!");
            setIsFileUploadModalOpen(false);
            setSelectedFiles(null);
        } catch (error: any) {
            console.error('Error uploading files:', error);
            
            // Provide more specific error messages
            let errorMessage = "Failed to upload files. Please try again.";
            
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.error) {
                errorMessage = error.error;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            // Check for specific file type errors
            if (errorMessage.toLowerCase().includes('docx') || errorMessage.toLowerCase().includes('word')) {
                errorMessage = "DOCX files are not supported. Please convert to PDF or use a different format.";
            }
            
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    const resetFileUpload = () => {
        setSelectedFiles(null);
        setIsFileUploadModalOpen(false);
    };

    useEffect(() => {
        // listCalendar()
    }, []);

    const onSubmit = async (values: any) => {
        const payload = {
            ...agentDataForSettings,
            availability: availability,
            file_ids: [...selectedKnowledgeBases]
        }
        try {
            setIsSaving(true)
            const res = await updateAgentApiRequest(id as string, payload)
            getAgentById()
            toast.success("Availability updated successfully!");
        } catch (error) {
            console.log("error", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="flex justify-end absolute right-0 top-[21px] ">
                <Button
                    disabled={isSaving}
                    type="submit"
                    className="h-12 bg-gradient-to-r from-[#6D4AFF] to-[#9B6DFF] hover:from-[#5a3ce0] hover:to-[#8257ff] transition-all duration-300 w-[171px] text-white flex items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save'
                    )}
                </Button>
            </div>
            <Card style={{ borderTopLeftRadius: "0px", borderTopRightRadius: "0px" }}>
                <CardHeader className="flex  flex-row items-center !px-0 !py-0 mb-6 justify-between " >
                    <CardTitle className='text-lg font-semibold'> Manage Knowledge Base for {agentName || ''}</CardTitle>
                    <div className='flex items-center gap-2'>
                        <Button
                            className='bg-white relative z-[2000] hover:bg-gray-50 h-[40px] text-base text-[#6D4AFF] border border-[#6D4AFF]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5'
                            size="xl"
                            onClick={() => setIsFileUploadModalOpen(true)}
                        >
                            Add File
                        </Button>
                        {/* <span className='cursor-pointer' onClick={() => setKnowledgeBaseCollapsed(!knowledgeBaseCollapsed)}>
                                {knowledgeBaseCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                            </span> */}
                    </div>
                </CardHeader>
                <div className={``}>

                    {knowledgeBaseList.length === 0 && (
                        <>
                            <div className="flex items-center p-3 md:p-4 px-0 bg-white rounded-md border border-gray-200 gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-200">
                                    <FileIcon className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 text-sm md:text-base mb-1 truncate">No files found in knowledge base</div>
                                </div>
                            </div>
                        </>
                    )}
                    <div className=' max-h-[300px] overflow-y-auto'>
                        {knowledgeBaseList.map((doc: any) => (
                            <div key={doc.id} className="flex mt-2 items-center p-3 md:p-4 px-0 bg-white rounded-md border border-gray-200 gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 ${getFileIconBgColor(doc.type)}`}>
                                    {getFileIcon(doc.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-800 text-sm md:text-base mb-1 truncate" title={doc.name}>{doc.name}</div>
                                    <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs text-gray-500">
                                        <span>{formatFileSize(doc.bytes)}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="whitespace-nowrap">Uploaded: {formatDate(doc?.created_at?.split('T')[0])}</span>
                                        <span className="hidden md:inline">•</span>
                                        <span className={`flex items-center gap-1 whitespace-nowrap ${statusClasses(doc.status).text}`}>
                                            {statusClasses(doc.status).icon}
                                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                    <Button
                                        type="button"
                                        size="sm" className="p-1.5  border-2 border-rose-50" title="Select Document" onClick={() => {
                                            toggleKnowledgeBase(doc.id)
                                        }}>
                                        {selectedKnowledgeBases.includes(doc.id) ? "✓ Selected" : 'Select'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                        
                    </div>
                </div>
            </Card>
            {/* Availability Settings */}
            <Card className="backdrop-blur-lg bg-white/80 border border-gray-200/50 shadow-xl transition-all duration-300 hover:shadow-2xl" >
                <CardHeader className="pb-3 flex !px-0 flex-row items-center justify-between ">
                    <div className="flex items-center justify-between w-full">
                        <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D4AFF] to-[#9B6DFF] text-xl font-bold">Availability Settings</CardTitle>
                        <div className="flex items-center gap-2">
                            {/* <Button
                                type="button"
                                size="sm"
                                className="gap-2 bg-white/90 h-10 hover:bg-white border border-[#6D4AFF]/30 text-[#6D4AFF] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAvailabilityModalOpen(true);
                                }}
                            >
                                <Clock className="h-4 w-4" />
                                Manage Availability
                            </Button> */}
                            {/* <span className='cursor-pointer' onClick={() => setAvailabilityCollapsed(!availabilityCollapsed)}>

                            {availabilityCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                            </span> */}
                        </div>
                    </div>
                </CardHeader>
                <div >
                {!availabilityCollapsed && (
                    <CardContent className='!px-0'>
                        <p className="text-sm text-gray-600 mb-6">
                            Configure your AI agent's availability with our intelligent scheduling system. Set custom hours for each day to optimize your virtual assistant's performance.
                        </p>
                        <div className='flex items-center gap-4 mb-8'>
                            <div>
                                <p className="font-medium text-gray-700">Calendar Integration</p>
                            </div>
                            <div className="gap-4 w-[80%] rounded-xl p-4 bg-white/50 backdrop-blur ">
                                <div className="relative">
                                    <select
                                        name='calendar_Id'
                                        className="w-full px-4 py-2 rounded-lg bg-white/70 backdrop-blur border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/50 appearance-none cursor-pointer transition-all duration-300"
                                        onChange={(e) => {
                                            handleChangeCalendar(e.target.value);
                                        }}
                                        value={agentDataForSettings?.calendar_id || ""}
                                    >
                                        <option className='text-gray-500' value="">Select your calendar</option>
                                        {calendarList.map((calendar: Calendar) => (
                                            <option
                                                key={calendar.id}
                                                value={calendar.id}
                                                className="py-2 px-3 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {calendar.name} ({calendar.email})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-[#6D4AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {Object.keys(availability || {}).length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#6D4AFF]/5 to-[#9B6DFF]/5 rounded-xl border border-[#6D4AFF]/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-[#6D4AFF]/10 rounded-full">
                                            <Clock className="h-6 w-6 text-[#6D4AFF]" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">Active Schedule</h4>
                                            <p className="text-sm text-gray-600">Your custom availability is configured</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        className="bg-white hover:bg-gray-50 h-[40px] text-base text-[#6D4AFF] border border-[#6D4AFF]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                        size="sm"
                                        onClick={() => setIsAvailabilityModalOpen(true)}
                                    >
                                        <Clock className="h-4 w-4" />
                                        Manage Availability
                                    </Button>
                                </div>

                                <div className="space-y-3 mt-6 h-[333px] overflow-y-auto">
                                    {Object.entries(availability).map(([day, slots]: [string, any[]]) => {
                                        if (slots?.length > 0) {
                                            return (
                                                <div key={day} className="border border-gray-200/50 rounded-xl p-4 bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                                                    <h4 className="font-medium capitalize mb-3 text-gray-700">{day}</h4>
                                                    <div className="space-y-2">
                                                        {slots.map((slot: any, index: number) => (
                                                            <div key={index} className="flex items-center text-sm bg-white/70 rounded-lg p-2">
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 text-[#6D4AFF]" />
                                                                    <span className="text-gray-600">{slot.start_time} - {slot.end_time}</span>
                                                                    {slot.is_emergency && (
                                                                        <div className="ml-2 px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                                                                            Emergency Hours
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-r from-[#6D4AFF]/5 to-[#9B6DFF]/5 rounded-xl border border-dashed border-[#6D4AFF]/30 backdrop-blur-sm">
                                <div className="p-4 bg-[#6D4AFF]/10 rounded-full mb-4">
                                    <Clock className="h-8 w-8 text-[#6D4AFF]" />
                                </div>
                                <h4 className="font-semibold text-gray-800">No Schedule Configured</h4>
                                <p className="text-sm text-gray-600 text-center mt-2 mb-4 max-w-md">
                                    Set up your AI agent's availability to start managing appointments automatically
                                </p>
                                <Button
                                    type="button"
                                    className="bg-gradient-to-r from-[#6D4AFF] to-[#9B6DFF] text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                    size="sm"
                                    onClick={() => setIsAvailabilityModalOpen(true)}
                                >
                                    Configure Availability
                                </Button>
                            </div>
                        )}
                    </CardContent>
                )}
                </div>
            </Card>
            {/* File Upload Modal */}
            {isFileUploadModalOpen && (
                <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Upload Files to Knowledge Base</h3>
                                <button
                                    onClick={resetFileUpload}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-gray-600">
                                    Upload documents to help your AI agent answer questions accurately.
                                    Supported formats: PDF (max 10MB each), only PDF files are supported
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <input
                                        type="file"
                                        id="fileInput"
                                        multiple
                                        accept=".pdf"
                                        onChange={handleFileSelection}
                                        className="hidden"
                                    />
                                    <label htmlFor="fileInput" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                            <p className="text-lg font-medium text-gray-700 mb-2">
                                                {selectedFiles ? `${selectedFiles.length} file(s) selected` : 'Click to select files'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {selectedFiles ? 'Click to change selection' : 'Drag and drop files here or click to browse'}
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {selectedFiles && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-gray-700">Selected Files:</h4>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                            {Array.from(selectedFiles).map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        onClick={resetFileUpload}
                                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleFileUpload}
                                        disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
                                        className="flex-1 bg-[#6D4AFF] hover:bg-[#5a3ce0] text-white"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Upload Files'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ManageAvailability
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                calendarId={form.getValues("calendarId")}
                onSave={(availabilityData: any) => handleAvailabilitySave(availabilityData)}
                initialAvailability={convertAvailabilityFormat(availabilityDataFromServer)}
            />
        </form>
    )
}

export default SettingsComponent;
"use client"
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCampaignByIdApiRequest } from "@/network/api";
import { Loader2, ChevronLeft, Pause, Play, Download, Phone, PhoneCall, PhoneMissed, Eye, X } from "lucide-react";
import { Input } from '@/component/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/component/common/select';
import Button from '@/component/common/Button';
import Card from '@/component/common/Card';
import { CardHeader, CardTitle, CardContent } from '@/component/ui/card';

// Helper: status color
const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
        case 'running':
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'paused':
            return 'bg-yellow-100 text-yellow-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        case 'completed':
            return 'bg-blue-100 text-blue-800';
        case 'ended':
            return 'bg-gray-200 text-black';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// Helper: format time (mm:ss)
const formatTime = (msOrSec: number) => {
    if (!msOrSec) return '0:00';
    let ms = msOrSec;
    if (ms < 1000 * 60 * 60) ms = ms * 1000; // if seconds, convert to ms
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper: format time string
const formatTimeString = (iso: string) => {
    if (!iso) return '-';
    const date = new Date(iso);
    return date.toLocaleString();
};

// Helper: format duration in mm:ss
const formatDuration = (ms: number) => {
  if (!ms || isNaN(ms) || ms < 0) return '-';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Helper: categorize interactions for progress bar
const categorizeInteractions = (contacts: any[] = []) => {
    let planned = 0, ongoing = 0, finished = 0;
    // Since we don't have call status yet, all contacts are considered planned
    planned = contacts.length;
    return { planned, ongoing, finished };
};

const CampaignIdPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [campaignStatus, setCampaignStatus] = useState('Start');
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Map contacts for table display
    const contacts = React.useMemo(() => {
        if (!campaign?.contacts) return [];
        return campaign.contacts.map((contact: any, index: number) => ({
            id: contact.id || index,
            name: contact.name || '',
            phone: contact.phone_number || '',
            email: contact.email || '',
            additionalData: contact.additional_data || {},
            status: 'planned', // Default status since no calls yet
            timestamp: campaign.created_at || '',
            duration: 0,
        }));
    }, [campaign]);

    // Filtering, searching, and pagination
    const filteredContacts = React.useMemo(() => {
        let data = contacts;
        if (activeFilter !== 'All') {
            data = data.filter((contact: any) => {
                const status = (contact.status || '').toLowerCase();
                if (activeFilter === 'Planned') return status === 'planned' || status === 'pending' || status === 'scheduled';
                if (activeFilter === 'Ongoing') return status === 'ongoing' || status === 'retry' || status === 'in progress';
                if (activeFilter === 'Finished') return status === 'finished' || status === 'completed' || status === 'ended' || status === 'failed';
                return true;
            });
        }
        if (searchTerm) {
            data = data.filter((contact: any) =>
                (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (contact.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return data;
    }, [contacts, activeFilter, searchTerm]);

    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredContacts.slice(startIndex, endIndex);

    // Handlers
    const handleFilterClick = (filter: string) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };
    const handleContactView = (contact: any) => setSelectedContact(contact);
    const closeModal = () => setSelectedContact(null);

    // Audio player handlers
    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };
    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };
    const handleLoadedMetadata = () => {
        if (audioRef.current) setAudioDuration(audioRef.current.duration);
    };

    // Download contacts (CSV)
    const downloadContacts = () => {
        if (!campaign?.contacts) return;
        const csv = [
            'Name,Phone,Email,Additional Data',
            ...campaign.contacts.map((c: any) => {
                const additionalDataStr = c.additional_data ? Object.entries(c.additional_data).map(([k, v]) => `${k}:${v}`).join(';') : '';
                return `${c.name || ''},${c.phone_number || ''},${c.email || ''},"${additionalDataStr}"`;
            })
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${campaign.name || 'contacts'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Fetch campaign data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await getCampaignByIdApiRequest(String(id));
                console.log("campaign", res?.data?.campaign);
                setCampaign(res?.data?.campaign);
            } catch (e) {
                setCampaign(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Progress bar stats
    const stats = categorizeInteractions(contacts);
    const total = campaign ? (campaign.total_contacts || 0) : 0;
    const plannedWidth = total > 0 ? (stats.planned / total) * 100 : 0;
    const ongoingWidth = total > 0 ? (stats.ongoing / total) * 100 : 0;
    const finishedWidth = total > 0 ? (stats.finished / total) * 100 : 0;

    return (
        <div className="container mx-auto py-[24px]">
            {loading && (
                <div className="h-full text-center w-full flex justify-center items-center content-center mt-10">
                    <Loader2 className="mr-2 animate-spin" size={50} />
                </div>
            )}
            {!loading && campaign && (
                <>
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="flex items-center gap-2">
                            <ChevronLeft
                                className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => { router.back() }}
                            />
                            <h1 className="text-lg md:text-2xl font-semibold">{campaign?.name || campaign?.Name}</h1>
                            <span className={`px-3 py-1.5 rounded-full ${getStatusColor(campaign?.status || campaign?.Status)} text-base`}>
                                {campaign?.status || campaign?.Status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="default"
                                className="bg-[#2563EB] text-white hover:bg-[#2563EB] h-[40px]"
                                size="sm"
                                onClick={downloadContacts}
                            >
                                <Download className="mr-2 h-4 w-4" /> Export Contacts
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card className="h-[114px]">
                            <CardHeader className="flex !p-0 flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Total Contacts</CardTitle>
                                <Phone className="h-[18px] w-[18px] text-[#3B82F6]" />
                            </CardHeader>
                            <CardContent className="!p-0 mt-2">
                                <div className="text-2xl font-bold">{campaign?.total_contacts ?? 0}</div>
                            </CardContent>
                        </Card>
                        <Card className="h-[114px]">
                            <CardHeader className="flex !p-0 flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Scheduled</CardTitle>
                                <Phone className="h-[18px] w-[18px] text-[#10B981]" />
                            </CardHeader>
                            <CardContent className="!p-0 mt-2">
                                <div className="text-2xl font-bold">{campaign?.calls_counter_scheduled ?? 0}</div>
                            </CardContent>
                        </Card>
                        <Card className="h-[114px]">
                            <CardHeader className="flex !p-0 flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">In Progress</CardTitle>
                                <Phone className="h-[18px] w-[18px] text-[#F59E0B]" />
                            </CardHeader>
                            <CardContent className="!p-0 mt-2">
                                <div className="text-2xl font-bold">{campaign?.calls_counter_in_progress ?? 0}</div>
                            </CardContent>
                        </Card>
                        <Card className="h-[114px]">
                            <CardHeader className="flex !p-0 flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Completed</CardTitle>
                                <Phone className="h-[18px] w-[18px] text-[#3B82F6]" />
                            </CardHeader>
                            <CardContent className="!p-0 mt-2">
                                <div className="text-2xl font-bold">{campaign?.calls_counter_ended ?? 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="bg-[#F9FAFB]">
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-[80%] flex items-center justify-between bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-gray-400 h-3 rounded-l-full transition-all duration-300"
                                                style={{ width: `${plannedWidth}%` }}
                                                title={`Planned: ${stats.planned} contacts`}
                                            ></div>
                                            <div
                                                className="bg-orange-400 h-3 transition-all duration-300"
                                                style={{ width: `${ongoingWidth}%` }}
                                                title={`Ongoing: ${stats.ongoing} contacts`}
                                            ></div>
                                            <div
                                                className="bg-green-500 h-3 rounded-r-full transition-all duration-300"
                                                style={{ width: `${finishedWidth}%` }}
                                                title={`Finished: ${stats.finished} contacts`}
                                            ></div>
                                        </div>
                                        <div className="text-sm font-medium">
                                            <span>
                                                {total || 0} total contacts
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gray-400 rounded"></div>
                                            <span>Planned: {stats.planned}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-400 rounded"></div>
                                            <span>Ongoing: {stats.ongoing}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                                            <span>Finished: {stats.finished}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="w-full">
                        <h3 className="text-lg font-semibold">Contacts</h3>
                        <div className="w-full">

                            {/* Contacts Table */}
                            <div className="mt-5">
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="border-b border-gray-200">
                                            <tr className="bg-[#F9FAFB]">
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Additional Data</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentData.map((contact: any, index: number) => (
                                                <tr className="border-b border-gray-100 h-[57px] hover:bg-gray-50 transition-colors" key={contact.id || index}>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                        {contact.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                        {contact.phone || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                        {contact.email || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                        {Object.keys(contact.additionalData).length > 0 ? (
                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                {Object.entries(contact.additionalData).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contact.status)}`}>
                                                            {contact.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer">
                                                        <Eye
                                                            className="h-5 w-5 text-gray-600 hover:text-blue-600 transition-colors"
                                                            onClick={() => handleContactView(contact)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} results
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                className="w-8 h-8 p-0"
                                            >
                                                «
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {(() => {
                                                    const maxVisiblePages = 7;
                                                    const pages = [];
                                                    if (totalPages <= maxVisiblePages) {
                                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                                    } else {
                                                        const currentPageIndex = currentPage - 1;
                                                        const totalPagesIndex = totalPages - 1;
                                                        pages.push(1);
                                                        if (currentPage <= 4) {
                                                            for (let i = 2; i <= Math.min(5, totalPages - 2); i++) pages.push(i);
                                                            if (totalPages > 5) {
                                                                pages.push('...');
                                                                pages.push(totalPages);
                                                            }
                                                        } else if (currentPage >= totalPages - 3) {
                                                            if (totalPages > 5) pages.push('...');
                                                            for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) pages.push(i);
                                                        } else {
                                                            pages.push('...');
                                                            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                                                            pages.push('...');
                                                            pages.push(totalPages);
                                                        }
                                                    }
                                                    return pages.map((page, index) => (
                                                        <div key={index}>
                                                            {page === '...' ? (
                                                                <span className="px-2 py-1 text-gray-500">...</span>
                                                            ) : (
                                                                <Button
                                                                    variant={currentPage === page ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => handlePageChange(page as number)}
                                                                    className="w-8 h-8 p-0"
                                                                >
                                                                    {page}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="w-8 h-8 p-0"
                                            >
                                                »
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Modal */}
                    {selectedContact && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
                            <div className="bg-white relative rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gray-900">{selectedContact.name || '-'}</span>
                                        <span className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(selectedContact.status)}`}>{selectedContact.status}</span>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors text-2xl absolute top-4 right-4"
                                        aria-label="Close"
                                    >
                                        <X className="h-7 w-7" />
                                    </button>
                                </div>

                                {/* Contact Info Grid */}
                                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-blue-500" />
                                        <span className="text-sm text-gray-500">Phone:</span>
                                        <span className="font-medium text-gray-900">{selectedContact.phone || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">Email:</span>
                                        <span className="font-medium text-gray-900">{selectedContact.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                                        <span className="text-sm text-gray-500">Campaign Created:</span>
                                        <span className="font-medium text-gray-900">{campaign?.created_at ? formatTimeString(campaign.created_at) : '-'}</span>
                                    </div>
                                </div>

                                {/* Additional Data Section */}
                                {Object.keys(selectedContact.additionalData).length > 0 && (
                                    <div className="px-8 py-6 border-b border-gray-100">
                                        <div className="font-semibold text-gray-700 mb-4">Additional Data</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(selectedContact.additionalData).map(([key, value]) => (
                                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-sm font-medium text-gray-600 mb-1">{key}</div>
                                                    <div className="text-gray-900">{String(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Campaign Info Section */}
                                <div className="px-8 py-6">
                                    <div className="bg-blue-50 rounded-lg p-5 mb-4">
                                        <div className="font-semibold text-gray-700 mb-2">Campaign Information</div>
                                        <div className="text-gray-800 text-sm">
                                            <div className="mb-2"><strong>Name:</strong> {campaign?.name || '-'}</div>
                                            <div className="mb-2"><strong>Description:</strong> {campaign?.description || '-'}</div>
                                            <div className="mb-2"><strong>Type:</strong> {campaign?.type || '-'}</div>
                                            <div className="mb-2"><strong>Frequency:</strong> {campaign?.frequency || '-'} calls per minute</div>
                                            <div className="mb-2"><strong>Status:</strong> {campaign?.status || '-'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CampaignIdPage;
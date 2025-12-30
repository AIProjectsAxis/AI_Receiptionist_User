"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import { FaCode } from "react-icons/fa";
import Card from "../common/Card";
import { UseFormReturn } from "react-hook-form";

import { getActionListApiRequest, updateAgentApiRequest } from "@/network/api";
import { useParams, useRouter } from "next/navigation";
import Button from "../common/Button";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface Action {
    id: number;
    name: string;
    type: string;
    tags: string[];
    selected?: boolean;
}

interface BookingFormData {
    date: string;
    time: string;
    duration: number;
    name: string;
}




export default function ActionsConfigureComponent({ agentDataForSettings, setAgentDataForSettings, agentName }: { agentDataForSettings: any, setAgentDataForSettings: any, agentName: string }) {
    const { id } = useParams()
    const router = useRouter()
    const [selectedActions, setSelectedActions] = useState<number[]>(agentDataForSettings?.actions || []);
    const [showBookingForm, setShowBookingForm] = useState(false);

    const [actionList, setActionList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [bookingData, setBookingData] = useState<BookingFormData>({
        date: '',
        time: '',
        duration: 30,
        name: ''
    });

    const getAllActionList = async () => {
        try {
            setIsLoading(true);
            const response = await getActionListApiRequest();
            const data = response?.data?.actions;
            // Filter out hidden action types
            const hiddenTypes = ['booking_lookup', 'reschedule_appointment', 'cancel_appointment', 'booking_appointment', 'check_availability'];
            const filteredData = data?.filter((action: any) => !hiddenTypes.includes(action.function_type)) || [];
            setActionList(filteredData);
        } catch (error) {
            console.error('Error fetching action list:', error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getAllActionList();
    }, []);

    const toggleActionSelection = (actionId: number) => {
        setSelectedActions(prev => {
            const newState = prev.includes(actionId)
                ? prev.filter(id => id !== actionId)
                : [...prev, actionId];

            return newState;
        });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = {
            ...agentDataForSettings,
            actions: selectedActions
        }
        try {
            const response = await updateAgentApiRequest(id as string, payload)
            toast.success("Actions updated successfully!");
            setAgentDataForSettings(payload);
            getAllActionList();
        } catch (error) {
            console.log(error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
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
            <Card className="p-6" style={{ borderTopLeftRadius: "0px", borderTopRightRadius: "0px" }}>
                <div className="space-y-6 min-h-[500px]">

                    {/* Selection summary */}
                    <span className="text-black font-semibold text-lg">Manage Actions for {agentName || ''}</span>
                    {actionList.length > 0 && (<div className="flex items-center justify-between">
                        <p className="text-sm text-[#6D4AFF] rounded-md font-medium">
                            <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                                {selectedActions.length > 0 ? `${selectedActions.length} actions selected` : "No actions selected"}
                            </span>
                        </p>
                        <Button
                            type="button"
                            onClick={() => router.push('/actions-management')}
                            className="bg-[#6D4AFF] hover:bg-[#5a3ce0] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                        >
                            Create Your Action
                        </Button>
                    </div>)}

                    {/* Action List */}
                    {isLoading && (
                        <div className="flex items-center !mt-20 justify-center h-full">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6D4AFF]"></div>
                        </div>
                    )}
                    {!isLoading && actionList.length === 0 && (
                        <div className="flex flex-col items-center justify-center !mt-20 h-full text-center">
                            <div className="bg-gray-100 rounded-full p-6 mb-4">
                                <FaCode className="text-gray-400 text-3xl" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Actions Available</h3>
                            <p className="text-gray-500 mb-6 max-w-md">
                                You haven't created any actions yet. Actions allow your AI agent to perform specific tasks like booking appointments, sending notifications, and more.
                            </p>
                            <Button
                                type="button"
                                onClick={() => router.push('/actions-management')}
                                className="bg-[#6D4AFF] hover:bg-[#5a3ce0] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
                            >
                                Create Your First Action
                            </Button>
                        </div>
                    )}
                    {/* Action List */}
                    {actionList.length > 0 && !isLoading && actionList.map((action: any) => (
                        <div
                            key={action.id}
                            className={`relative rounded-md border p-4 mt-2 ${selectedActions.includes(action.id)
                                ? "border-[#6D4AFF] bg-[#F4F1FF]"
                                : "border-gray-200"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <FaCode className="text-[#6D4AFF]" />
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium">{action.name}</div>
                                        <span className="text-xs text-white bg-gray-400 px-2 py-0.5 rounded">
                                            {action.function_type || action.type}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleActionSelection(action.id)}
                                    className={`text-sm font-medium px-4 py-1.5 rounded-md border ${selectedActions.includes(action.id)
                                        ? "bg-[#6D4AFF] text-white"
                                        : "text-gray-500 border-gray-300 hover:border-[#6D4AFF] hover:text-[#6D4AFF]"
                                        }`}
                                >
                                    {selectedActions.includes(action.id) ? "✓ Selected" : "Select"}
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {/* {action.tags.map((tag: any, index: any) => (
                  <span
                    key={index}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tag.includes("notification")
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tag}
                  </span>
                ))} */}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white rounded-lg p-6 w-[400px]">
                        <h2 className="text-xl font-semibold mb-4">Check Calendar Availability</h2>
                        <form onSubmit={() => { }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={bookingData.date}
                                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={bookingData.duration}
                                    onChange={(e) => setBookingData({ ...bookingData, duration: parseInt(e.target.value, 10) })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                                    min="15"
                                    step="15"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#6D4AFF] rounded-md hover:bg-[#5a3ce0]"
                                >
                                    Check Availability
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </form>
    );
}

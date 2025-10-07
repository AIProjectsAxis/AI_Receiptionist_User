"use client"
// export const runtime = 'edge';

import React, { useEffect, useRef, useState } from 'react'
import { FaPlus } from 'react-icons/fa';
import { X, Phone, Check, Trash2 } from 'lucide-react';
import { MdDeleteOutline } from 'react-icons/md';
import Card from '@/component/common/Card';
import CustomSelect from '@/component/ui/Select';
import Button from '@/component/common/Button';
import { Input } from '@/component/ui/input';
import { assignPhoneNumberApiRequest, buyPhoneNumberApiRequest, getAlReadyHavePhoneNumberApiRequest, getAssistantListApiRequest, currentSubscriptionApiRequest, listPhoneNumberApiRequest, deletePhoneNumberApiRequest } from '@/network/api';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';

interface PhoneNumber {
    id: string;
    phone_number: string;
    status: string;
    country: string;
    assistant_id?: string;
    friendly_name: string;
    locality: string;
    region: string;
    monthly_price: number;
    currency: string;
    capabilities: {
        voice: boolean;
        SMS: boolean;
        MMS: boolean;
    };
    created_at: string;
    updated_at: string;
    twilio_phone_sid: string;
    company_id: string;
}

interface Country {
    code: string;
    name: string;
    flag: string;
}

const PhoneSetup = () => {
    const params = useParams();
    const singlePageRender = useRef(false);
    const [showBuyNumberModal, setShowBuyNumberModal] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('US');
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [agentData, setAgentData] = useState<any[]>([]);
    const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
    const [listPhoneNumberForPurchase, setListPhoneNumberForPurchase] = useState<PhoneNumber[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [locality, setLocality] = useState('');
    const [areaCode, setAreaCode] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectDeleteNumber, setSelectDeleteNumber] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const countries: Country[] = [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    ];

    const formatPhoneNumber = (phoneNumber: string) => {
        // Remove any non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Format based on country code
        if (phoneNumber.startsWith('+1')) { // US/Canada
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        } else if (phoneNumber.startsWith('+44')) { // UK
            return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
        }

        return phoneNumber; // Return original if no matching format
    };

    const getCountryFlag = (phoneNumber: string) => {
        // Extract country code from phone number
        let countryCode = '';
        if (phoneNumber.startsWith('+1')) {
            // Check area code for US/CA
            const areaCode = phoneNumber.substring(2, 5);
            // Canadian area codes
            const canadianAreaCodes = ['403', '587', '780', '250', '604', '778', '236', '204', '431', '506', '709', '902', '782', '416', '647', '437', '519', '226', '548', '613', '343', '705', '249', '807', '905', '289', '365', '418', '581', '367', '514', '438', '450', '579', '819', '873', '306', '639'];
            countryCode = canadianAreaCodes.includes(areaCode) ? 'CA' : 'US';
        } else if (phoneNumber.startsWith('+44')) {
            countryCode = 'GB';
        }

        const country = countries.find(c => c.code === countryCode);
        return country?.flag || '🌐';
    };

    const handleNumberSelect = (number: string) => {
        setSelectedNumber(number);
    };

    const getAllReadHavePhoneNumber = async () => {
        try {
            setLoading(true);
            const response = await getAlReadyHavePhoneNumberApiRequest();
            setAvailableNumbers(response?.data?.phone_numbers || []);
        } catch (error) {
            console.error('Error fetching phone numbers:', error);
        } finally {
            setLoading(false);
        }
    };

    const assignPhoneNumber = async (id: string, agentId: string) => {
        try {

            // Update the state directly after successful assignment
            setAvailableNumbers(prevNumbers =>
                prevNumbers.map(number =>
                    number.id === id
                        ? { ...number, assistant_id: agentId }
                        : number
                )
            );
            await assignPhoneNumberApiRequest(id, { assistant_id: agentId });
        } catch (error) {
            console.error('Error assigning phone number:', error);
        }
    };



    const listAgentData = async () => {
        try {
            const res = await getAssistantListApiRequest(1, 1000);
            setAgentData(res?.data?.assistants);
           
        }
        catch (error) {
            console.error('Error listing agent data:', error);
        }
    }

    const listPhoneNUmberList = async () => {
        try {
            setLoading(true);
            const response = await listPhoneNumberApiRequest(selectedCountry, locality, areaCode);
            setListPhoneNumberForPurchase(response?.data?.numbers || []);
        } catch (error) {
            console.error('Error fetching phone numbers:', error);
        } finally {
            setLoading(false);
        }
    }

    const buyPhoneNumber = async () => {
        try {
            setPurchaseLoading(true);
            const payload = {
                phone_number: selectedNumber,
            }
            const response: any = await buyPhoneNumberApiRequest(payload);
            const latestAgnet = agentData?.reduce((latestObj: any, currentObj: any) => {
                return new Date(currentObj.created_at) > new Date(latestObj.created_at) ? currentObj : latestObj
            })
            assignPhoneNumber(response?.data?.phone_number?.id, latestAgnet?.id);
            toast.success("Phone number purchased successfully and assigned to the latest agent", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setTimeout(() => {
                getAllReadHavePhoneNumber();
                listAgentData();
                setShowBuyNumberModal(false);
            }, 1500);

           
        } catch (error: any) {
            console.error('Error buying phone number:', error);
            console.log("error?.response?.data?.message", error?.message);
            toast.error(error?.message, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        } finally {
            setPurchaseLoading(false);
        }
    }

    const fetchSubscriptionData = async () => {
        try {
            const response = await currentSubscriptionApiRequest();
            console.log("response fetchSubscriptionData----", response?.data?.subscription);
            setSubscriptionData(response?.data?.subscription);
        } catch (error) {
            console.error('Error fetching subscription data:', error);
        }
    }

    const handleDeletePhoneNumber = async (id: string) => {
        try {
            setDeleteLoading(true);
            await deletePhoneNumberApiRequest(id);
            await getAllReadHavePhoneNumber();
            setOpenDeleteModal(false);
            setSelectDeleteNumber(null);
            toast.success("Phone number deleted successfully", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        } catch (error: any) {
            console.error('Error deleting phone number:', error);
            toast.error(error?.message || "Failed to delete phone number", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        } finally {
            setDeleteLoading(false);
        }
    }

    useEffect(() => {
        if (!singlePageRender.current) {
            getAllReadHavePhoneNumber();
            listPhoneNUmberList();
            listAgentData();
            fetchSubscriptionData();
           
            singlePageRender.current = true;
        }
    }, []);

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D4AFF]"></div>
        </div>
    );


    const renderPhoneNumberList = (numbers: PhoneNumber[]) => (
        numbers.map((number) => (
            <div
                key={number.id}
                className={`group border border-gray-200 justify-between py-4 hover:bg-[#6D4AFF]/10 rounded-lg transition-all duration-200 cursor-pointer relative ${number.assistant_id === params?.id ? 'bg-[#6D4AFF]/10' : ''}`}
                onClick={() => handleNumberSelect(number.phone_number)}
            >
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#6D4AFF]/10 rounded-lg">
                                <span className="text-xl">{getCountryFlag(number.phone_number)}</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{formatPhoneNumber(number.phone_number)}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <CustomSelect
                                options={agentData.map((agent) => ({
                                    value: agent.id,
                                    label: agent.name
                                }))}
                                value={agentData
                                    .map((agent) => ({
                                        value: agent.id,
                                        label: agent.name
                                    }))
                                    .find((option) => option.value === number.assistant_id)
                                }
                                onChange={(option) => {
                                    if (option) {
                                        assignPhoneNumber(number.id, option.value);
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDeleteModal(true);
                                    setSelectDeleteNumber(number.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                title="Delete phone number"
                            >
                                <MdDeleteOutline className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Created:</span>
                                <span>{new Date(number.created_at).toLocaleDateString()}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Last Updated:</span>
                                <span>{new Date(number.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ))
    );

    return (
        <>
            <div className="p-8 shadow-lg bg-white">
                <div className="space-y-8">
                    <div className=" rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-[#6D4AFF]/10 rounded-lg">
                                <Phone className="w-5 h-5 text-[#6D4AFF]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Phone Setup</h2>
                                <p className="text-sm text-gray-500">
                                    Configure your phone number settings
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="relative w-64 text-lg font-semibold text-gray-900">
                                Available Phone Numbers
                            </div>
                            {subscriptionData !== null && (
                                <Button
                                    disabled={loading}
                                    onClick={() => setShowBuyNumberModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#6D4AFF] rounded-lg font-medium text-white hover:bg-[#5a3ce0] transition-colors duration-200"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    Buy New Number
                                </Button>
                            )}
                        </div>

                        <div className={`"mt-4 rounded-xl  ${loading ? " flex items-center justify-center" : "grid grid-cols-2 gap-4 "}   bg-gray-50/50 p-4 text-sm   divide-y divide-gray-100"`}>
                            {loading ? (
                                <LoadingSpinner />
                            ) : availableNumbers.length > 0 ? (
                                renderPhoneNumberList(availableNumbers)
                            ) : (
                                <div className="col-span-2 flex flex-col items-center justify-center py-12">
                                    <Phone className="w-12 h-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Phone Numbers Available</h3>
                                    <p className="text-sm text-gray-500 text-center mb-6">
                                        You haven't configured any phone numbers yet. Click the button below to get started.
                                    </p>
                                    {subscriptionData !== null ? (
                                        <Button
                                            onClick={() => setShowBuyNumberModal(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#6D4AFF] rounded-lg font-medium text-white hover:bg-[#5a3ce0] transition-colors duration-200"
                                        >
                                            <FaPlus className="w-4 h-4" />
                                            Buy New Number
                                        </Button>
                                    ) : (
                                        <>
                                            <p className='text-sm text-red-500'>
                                                No active subscription. Please purchase a subscription to manage phone numbers.
                                            </p>
                                        </>
                                    )
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showBuyNumberModal && (
                <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-scaleFade">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#6D4AFF]/10 rounded-lg">
                                    <FaPlus className="w-4 h-4 text-[#6D4AFF]" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Buy New Number</h3>
                            </div>
                            <button
                                onClick={() => setShowBuyNumberModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <CustomSelect
                                key="country-select"
                                options={countries.map(country => ({
                                    value: country.code,
                                    label: `${country.flag} ${country.name}`
                                }))}
                                value={countries.find(country => country.code === selectedCountry)
                                    ? {
                                        value: selectedCountry,
                                        label: `${countries.find(c => c.code === selectedCountry)?.flag} ${countries.find(c => c.code === selectedCountry)?.name}`
                                    }
                                    : null}
                                onChange={(option) => option && setSelectedCountry(option.value)}
                                placeholder="Select a country"
                                className="mb-2"
                            />
                            <div className='flex items-center w-full gap-2'>
                                <div className="relative w-full">
                                    <Input
                                        id="locality"
                                        name="locality"
                                        type="text"
                                        placeholder="Enter locality (e.g. Toronto)"
                                        value={locality}
                                        onChange={(e) => setLocality(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#6D4AFF] focus:border-[#6D4AFF] transition-all duration-200"
                                    />
                                </div>

                                <div className="relative w-full">
                                    <Input
                                        id="areaCode"
                                        name="areaCode"
                                        type="text"
                                        maxLength={3}
                                        placeholder="Enter area code (e.g. 416)"
                                        value={areaCode}
                                        onChange={(e) => setAreaCode(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#6D4AFF] focus:border-[#6D4AFF] transition-all duration-200"
                                    />
                                </div>
                                <Button
                                    onClick={listPhoneNUmberList}
                                    className="px-4 w-[200px] py-2 bg-[#6D4AFF] text-white rounded-lg hover:bg-[#5a3ce0] transition-colors"
                                >
                                    Search
                                </Button>
                            </div>
                        </div>

                        <div className={`max-h-72 min-h-72 overflow-y-auto rounded-lg border border-gray-100 ${listPhoneNumberForPurchase.length === 0 || loading ? 'flex items-center justify-center' : ''}`}>
                            {loading ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {listPhoneNumberForPurchase.length > 0 ? listPhoneNumberForPurchase.map((number) => (
                                        <div
                                            key={number.phone_number}
                                            className={`flex items-center justify-between p-4 hover:bg-[#6D4AFF]/10 rounded-lg transition-all duration-200 cursor-pointer ${selectedNumber === number.phone_number ? 'bg-[#6D4AFF]/10' : ''
                                                }`}
                                            onClick={() => handleNumberSelect(number.phone_number)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <span className="text-xl">{getCountryFlag(number.phone_number)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-700 font-medium">{formatPhoneNumber(number.friendly_name)}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">{number.locality}, {number.region}</span>
                                                        <span className="text-xs text-gray-400">|</span>
                                                        <span className="text-xs text-gray-500">${number.monthly_price}/{number.currency}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {number.capabilities.voice && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Voice</span>}
                                                        {number.capabilities.SMS && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">SMS</span>}
                                                        {number.capabilities.MMS && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">MMS</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedNumber === number.phone_number && (
                                                    <Check className="w-5 h-5 text-[#6D4AFF]" />
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Phone className="w-12 h-12 text-gray-300 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Numbers Found</h3>
                                            <p className="text-sm text-gray-500 text-center">
                                                Try adjusting your search criteria
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={buyPhoneNumber}
                                className="px-4 py-2 bg-[#6D4AFF] text-white rounded-lg hover:bg-[#5a3ce0] transition-colors"
                                disabled={loading || !selectedNumber || purchaseLoading}
                            >
                                {purchaseLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Purchasing...</span>
                                    </div>
                                ) : (
                                    'Purchase Number'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {openDeleteModal && (
                <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 animate-scaleFade">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this phone number? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={() => {
                                    setOpenDeleteModal(false);
                                    setSelectDeleteNumber(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDeletePhoneNumber(selectDeleteNumber || '')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
            .animate-scaleFade {
            animation: scaleFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes scaleFadeIn {
            0% {
                opacity: 0;
                transform: scale(0.95);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
            }
        `}</style>
        </>
    );
}

export default PhoneSetup

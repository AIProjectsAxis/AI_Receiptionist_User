
"use client"
export const runtime = 'edge';

import React, { useEffect, useRef, useState } from 'react'
import { FaPlus } from 'react-icons/fa';
import { X, Phone, Globe, Search, Check, Delete, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import CustomSelect from '../ui/Select';
import Button from '../common/Button';
import { assignPhoneNumberApiRequest, getAlReadyHavePhoneNumberApiRequest, buyPhoneNumberApiRequest, listPhoneNumberApiRequest, deletePhoneNumberApiRequest, currentSubscriptionApiRequest, getAssistantListApiRequest } from '@/network/api';
import { useParams } from 'next/navigation';
import { Input } from '../ui/input';
import { MdDeleteOutline } from 'react-icons/md';
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

const PhoneNumberComponent = ({ agentName }: { agentName: string }) => {
  const params = useParams();
  const singlePageRender = useRef(false);

  const [showBuyNumberModal, setShowBuyNumberModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [listPhoneNumberForPurchase, setListPhoneNumberForPurchase] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectDeleteNumber, setSelectDeleteNumber] = useState<string | null>(null);
  const [locality, setLocality] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPhoneNumberForAssign, setSelectedPhoneNumberForAssign] = useState<{ id: string, assistant_id?: string } | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [purcheNumberLoading, setPurcheNumberLoading] = useState(false);
  const [deleteNumberLoading, setDeleteNumberLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const countries: Country[] = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  ];

  const handleNumberSelect = (number: string) => {
    setSelectedNumber(number);

  };
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

  const assignPhoneNumber = async (id: string, currentAssistantId?: string) => {
    try {
      setAssignLoading(true);
      await assignPhoneNumberApiRequest(id, {
        assistant_id: currentAssistantId === params?.id ? '' : params?.id,
      });

      // Update local state instead of refetching
      setAvailableNumbers((prevNumbers: any) =>
        prevNumbers.map((number: any) => {
          if (number.id === id) {
            return {
              ...number,
              assistant_id: currentAssistantId === params?.id ? undefined : params?.id
            };
          }
          return number;
        })
      );

      if (currentAssistantId === params?.id) {
        toast.success('Phone number unassigned successfully!');
      } else if (currentAssistantId && currentAssistantId !== params?.id) {
        const previousAgentName = agents.find(agent => agent.id === currentAssistantId)?.name || 'the previous agent';
        toast.success(`Phone number reassigned from ${previousAgentName} successfully!`);
      } else {
        toast.success('Phone number assigned successfully!');
      }

    } catch (error) {
      console.error('Error assigning phone number:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignClick = (id: string, currentAssistantId?: string) => {
    setSelectedPhoneNumberForAssign({ id, assistant_id: currentAssistantId });
    setShowAssignModal(true);
  };

  const confirmAssignPhoneNumber = async () => {
    if (selectedPhoneNumberForAssign) {
      await assignPhoneNumber(selectedPhoneNumberForAssign.id, selectedPhoneNumberForAssign.assistant_id);
      setShowAssignModal(false);
      setSelectedPhoneNumberForAssign(null);
    }
  };

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
      const payload = {
        phone_number: selectedNumber,
      }
      // setLoading(true);
      setPurcheNumberLoading(true);
      const response = await buyPhoneNumberApiRequest(payload);
      toast.success('Phone number purchased successfully!');
      setShowBuyNumberModal(false);
      setSelectedNumber(null);
      listPhoneNUmberList();
      await getAllReadHavePhoneNumber();
    } catch (error) {
      console.error('Error buying phone number:', error);
    } finally {
      setLoading(false);
      setPurcheNumberLoading(false);
    }
  }
  const handleDeletePhoneNumber = async (id: string) => {
    try {
      setDeleteNumberLoading(true);
      await deletePhoneNumberApiRequest(id);
      await getAllReadHavePhoneNumber();
      toast.success('Phone number deleted successfully!');
      setOpenDeleteModal(false);
      setSelectDeleteNumber(null);

    } catch (error) {
      console.error('Error deleting phone number:', error);
    } finally {
      setDeleteNumberLoading(false);
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

  const getAllAgents = async () => {
    try {
      const response = await getAssistantListApiRequest();
      const assistants = response.data?.assistants.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
      }));
      setAgents(assistants || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }

  useEffect(() => {
    if (!singlePageRender.current) {
      getAllReadHavePhoneNumber();
      fetchSubscriptionData();
      getAllAgents();
      singlePageRender.current = true;
    }
  }, []);

  useEffect(() => {
    listPhoneNUmberList();
  }, [selectedCountry]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D4AFF]"></div>
    </div>
  );

  const renderPhoneNumberList = (numbers: PhoneNumber[]) => {
    if (numbers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Phone className="w-12 h-12 mb-4 text-gray-400" />
          {subscriptionData !== null && (
            <>
              <p className="text-lg font-medium">No phone numbers available</p>
              <p className="text-sm">Click "Buy New Number" to purchase a phone number</p>
            </>
          )}
          {!loading &&  subscriptionData === null && (
            <p className="text-sm text-center text-red-500">
              No active subscription. Please subscribe to manage phone numbers.
            </p>
          )}
        </div>
      );
    }

    return numbers.map((number) => (
      <div
        key={number.id}
        className={`flex items-center justify-between p-4 hover:bg-[#6D4AFF]/10 rounded-lg transition-all duration-200 cursor-pointer ${number.assistant_id === params?.id ? 'bg-[#6D4AFF]/10' : ''}`}
        onClick={() => handleNumberSelect(number.phone_number)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <span className="text-xl">{getCountryFlag(number.phone_number)}</span>
          </div>
          <div>
            <span className="text-gray-700 font-medium">{formatPhoneNumber(number.phone_number)}</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-500">Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Created: {new Date(number.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Last Updated: {new Date(number.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row items-end gap-2">
          <div className="relative group">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAssignClick(number.id, number.assistant_id);
              }}
              className="px-3 py-1 text-sm bg-[#6D4AFF] text-white rounded-lg hover:bg-[#5a3ce0] transition-colors flex items-center gap-2"
            >
              {number.assistant_id === params?.id ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Selected</span>
                </>
              ) : (
                <>
                  <FaPlus className="w-4 h-4" />
                  <span>Select</span>
                </>
              )}
            </Button>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white text-gray-900 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {number.assistant_id === params?.id
                ? "Click to unassign phone number from agent"
                : "Click to assign phone number to agent"
              }
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDeleteModal(true);
              setSelectDeleteNumber(number.id);
            }}
            className="px-3 py-2 h-[39px] text-sm !bg-red-400 button-secondary !hover:bg-red-600 !text-white rounded-lg  transition-colors flex items-center gap-2"
          >
            <MdDeleteOutline className="w-5 h-5" />
          </Button>

        </div>
      </div>
    ))
  };

  return (
    <>
      <Card className="p-8 shadow-lg" style={{ borderTopLeftRadius: "0px", borderTopRightRadius: "0px" }}>
        <div className="space-y-8">
          <div className="bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#6D4AFF]/10 rounded-lg">
                <Phone className="w-5 h-5 text-[#6D4AFF]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage Phone Number for {agentName || ''}</h2>
                <p className="text-sm text-gray-500">
                  Select an existing phone number or purchase a new one for your assistant
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="relative w-64 text-lg font-semibold text-gray-900">
                Available Phone Numbers
              </div>
              {subscriptionData !== null && <Button
                disabled={loading}
                onClick={() => setShowBuyNumberModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#6D4AFF] rounded-lg font-medium text-white hover:bg-[#5a3ce0] transition-colors duration-200"
              >
                <FaPlus className="w-4 h-4" />
                Buy New Number
              </Button>}
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-sm h-72 overflow-y-auto divide-y divide-gray-100">
              {loading ? <LoadingSpinner /> : renderPhoneNumberList(availableNumbers)}
            </div>
          </div>
        </div>
      </Card>

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
                className="mb-2 cursor-pointer"
              />
              <div className='flex items-center w-full gap-2'>
                <div className=" relative" style={{ width: "100%" }}>
                  <Input
                    type="text"
                    placeholder="Enter locality (e.g. Toronto)"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#6D4AFF] focus:border-[#6D4AFF] transition-all duration-200"
                  />
                </div>

                <div className=" relative" style={{ width: "100%" }}>
                  <Input
                    type="text"
                    maxLength={3}
                    placeholder="Enter area code (e.g. 416)"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-[#6D4AFF] focus:border-[#6D4AFF] transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (locality.trim() && areaCode.trim()) {
                      toast.warning('Please use only one filter: either locality OR area code, not both.');
                      return;
                    }
                    listPhoneNUmberList();
                  }}
                  className="px-4 py-2 bg-[#6D4AFF] w-52 text-white rounded-lg hover:bg-[#5a3ce0] transition-colors"
                >
                  Search
                </Button>
              </div>

            </div>

            <div className={`max-h-72 min-h-72 overflow-y-auto  rounded-lg border border-gray-100 ${listPhoneNumberForPurchase.length === 0 || loading ? 'flex items-center justify-center' : ''}`}>
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
                      <div className="flex items-center  gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <span className="text-xl">{getCountryFlag(number.phone_number)}</span>
                        </div>
                        <div>
                          <span className="text-gray-700 font-medium">{number?.friendly_name}</span>
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
                  )) : <div className='text-center text-lg text-gray-500'>No numbers found</div>}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={buyPhoneNumber}
                className="px-4 py-2 bg-[#6D4AFF] text-white rounded-lg hover:bg-[#5a3ce0] transition-colors"
                disabled={purcheNumberLoading}
              >
                {purcheNumberLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {purcheNumberLoading ? 'Purchasing...' : 'Purchase Number'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openDeleteModal && (
        <div className="fixed inset-0 z-[2000]  bg-opacity-130 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this phone number? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setOpenDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDeletePhoneNumber(selectDeleteNumber || '')}
              >
                {deleteNumberLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteNumberLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              {/* <div className="p-2 bg-[#6D4AFF]/10 rounded-lg">
                {selectedPhoneNumberForAssign?.assistant_id === params?.id ? (
                  <X className="w-4 h-4 text-[#6D4AFF]" />
                ) : (
                  <Check className="w-4 h-4 text-[#6D4AFF]" />
                )}
              </div> */}
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPhoneNumberForAssign?.assistant_id === params?.id
                  ? 'Unassign Phone Number'
                  : selectedPhoneNumberForAssign?.assistant_id && selectedPhoneNumberForAssign?.assistant_id !== params?.id
                    ? 'Reassign Phone Number'
                    : 'Assign Phone Number'
                }
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {selectedPhoneNumberForAssign?.assistant_id === params?.id
                ? 'Are you sure you want to unassign this phone number from the agent? The agent will no longer be able to receive calls on this number.'
                : selectedPhoneNumberForAssign?.assistant_id && selectedPhoneNumberForAssign?.assistant_id !== params?.id
                  ? (
                    <>
                      This phone number is already assigned to{' '}
                      <span className="font-semibold">
                        {agents.find(agent => agent.id === selectedPhoneNumberForAssign?.assistant_id)?.name || 'another agent'}
                      </span>
                      . Would you like to proceed and reassign it to this agent?
                    </>
                  )
                  : 'Are you sure you want to assign this phone number to the agent? The agent will be able to receive calls on this number.'
              }
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPhoneNumberForAssign(null);
                }}
                disabled={assignLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className={selectedPhoneNumberForAssign?.assistant_id === params?.id
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-[#6D4AFF] hover:bg-[#5a3ce0]"
                }
                onClick={confirmAssignPhoneNumber}
                disabled={assignLoading}
              >
                {assignLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>
                      {selectedPhoneNumberForAssign?.assistant_id === params?.id
                        ? 'Unassigning...'
                        : selectedPhoneNumberForAssign?.assistant_id && selectedPhoneNumberForAssign?.assistant_id !== params?.id
                          ? 'Reassigning...'
                          : 'Assigning...'
                      }
                    </span>
                  </div>
                ) : (
                  selectedPhoneNumberForAssign?.assistant_id === params?.id
                    ? 'Unassign'
                    : selectedPhoneNumberForAssign?.assistant_id && selectedPhoneNumberForAssign?.assistant_id !== params?.id
                      ? 'Reassign'
                      : 'Assign'
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

export default PhoneNumberComponent
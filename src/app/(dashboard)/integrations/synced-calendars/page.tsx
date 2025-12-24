"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Plus, Calendar, ChevronDown, ChevronRight, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/component/common/Button";
import { connectCalendarApiRequest, disconnectCalendarApiRequest, fetchLatestCalendarApiRequest, getCalendarListApiRequest, removeCalendarAccountApiRequest } from "@/network/api";

interface Calendar {
  id: string;
  name: string;
  color: string;
  hexColor: string;
  isDefaultCalendar: boolean;
  is_connected: boolean;
  connected_account_id: string;
  calendar_id?: string;
  canEdit: boolean;
  isRemovable: boolean;
  owner: {
    name: string;
    address: string;
  };
}

interface CalendarList {
  google: Record<string, Calendar[]>;
  outlook: Record<string, Calendar[]>;
  others: Record<string, Calendar[]>;
}

// PKCE helper functions
const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
};

const base64UrlEncode = (buffer: Uint8Array): string => {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
};

const CalendarsPage = () => {
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("google");
  const [calendarList, setCalendarList] = useState<CalendarList>({ google: {}, outlook: {}, others: {} });
  const [connectedCalendarList, setConnectedCalendarList] = useState<Record<string, any[]>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);
  const [connectingCalendars, setConnectingCalendars] = useState<Record<string, boolean>>({});
  const [disconnectingCalendars, setDisconnectingCalendars] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchCalendarList = async () => {
    try {
      const res = await getCalendarListApiRequest();
      if (res?.data?.data?.calendars) {
        setConnectedCalendarList(res.data.data.calendars);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // router.push(`/integrations/calendars?type=${value}`);
  };

  const toggleAccountExpanded = (accountEmail: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountEmail]: !prev[accountEmail]
    }));
  };

  const openRemoveDialog = (email: string) => {
    setAccountToRemove(email);
    setIsRemoveDialogOpen(true);
  };

  const handleRemoveAccount = () => {
    if (!accountToRemove) return;

    removeCalendarAccountApiRequest(accountToRemove).then((res) => {
      if (res) {
        fetchLatestCalendar();
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsRemoveDialogOpen(false);
      setAccountToRemove(null);
    });
  };

  const connectNewAccount = async () => {
    if (activeTab === "google") {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_GOOGLE_URL}integrations/success`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email openid profile',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state: "google"
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else if (activeTab === "outlook") {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later use
      sessionStorage.setItem('outlook_code_verifier', codeVerifier);
      
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_OUTLOOK_REDIRECT_URI}integrations/success`,
        response_type: 'code',
        scope: 'offline_access openid profile https://graph.microsoft.com/Calendars.Read https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read',
        state: "outlook",
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    }
  };

  const fetchLatestCalendar = async () => {
    setIsLoading(true);
    try {
      const res = await fetchLatestCalendarApiRequest();;

      if (res?.data?.calendars) {
        const calendarsData = res.data.calendars;

        // Ensure the data structure matches our interface
        const formattedCalendars: CalendarList = {
          google: calendarsData.google || {},
          outlook: calendarsData.outlook || {},
          others: calendarsData.others || {}
        };

        setCalendarList(formattedCalendars);

        // Set initial expanded state
        const initialExpandedState: Record<string, boolean> = {};

        // Handle Outlook calendars
        if (formattedCalendars.outlook && Object.keys(formattedCalendars.outlook).length > 0) {
          Object.keys(formattedCalendars.outlook).forEach(email => {
            initialExpandedState[email] = true;
          });
        }

        // Handle Google calendars
        if (formattedCalendars.google && Object.keys(formattedCalendars.google).length > 0) {
          Object.keys(formattedCalendars.google).forEach(email => {
            initialExpandedState[email] = true;
          });
        }

        setExpandedAccounts(initialExpandedState);
      } else {
        setCalendarList({ google: {}, outlook: {}, others: {} });
      }
    } catch (err) {
      console.error('Error fetching calendars:', err);
      setCalendarList({ google: {}, outlook: {}, others: {} });
    } finally {
      setIsLoading(false);
    }
  };

  const getCalendarsByProvider = (provider: string): Record<string, Calendar[]> => {
    if (provider === 'outlook') {
      return calendarList?.outlook || {};
    } else if (provider === 'google') {
      return calendarList?.google || {};
    }
    return {};
  };

  const disconnectCalendar = (calendarId: string) => {
    console.log('Disconnecting calendar:', calendarId);
    setDisconnectingCalendars(prev => ({ ...prev, [calendarId]: true }));
    disconnectCalendarApiRequest(calendarId).then((res) => {
      if (res) {
        fetchLatestCalendar();
      }
    }).catch((err) => {
      console.error('Error disconnecting calendar:', err);
    }).finally(() => {
      setDisconnectingCalendars(prev => ({ ...prev, [calendarId]: false }));
    });
  }

  const connectCalendar = (calendarId: string, connectedAccountId: string, calendarData: any) => {
    console.log('Connecting calendar:', calendarId);
    // console.log('Calendar data:', calendarData);
    console.log('Connected Account ID:', connectedAccountId);
    console.log('Calendar ID to send:', calendarData?.calendar_id);
    
    setConnectingCalendars(prev => ({ ...prev, [calendarId]: true }));
    
    // Use the calendar_id from the calendar data, fallback to calendarId if not available
    const actualCalendarId = calendarData?.calendar_id || calendarId;
    
    console.log('Sending calendar_id:', actualCalendarId);
    console.log('Sending connected_account_id:', connectedAccountId);
    
    connectCalendarApiRequest({
      calendar_id: actualCalendarId,
      connected_account_id: connectedAccountId
    }).then((res) => {
      if (res?.data) {
        fetchLatestCalendar();
      }
    }).catch((err) => {
      console.error('Error connecting calendar:', err);
    }).finally(() => {
      setConnectingCalendars(prev => ({ ...prev, [calendarId]: false }));
    });
  }

  useEffect(() => {
    const type = searchParams.get("type");
    if (type && ["google", "outlook", "other"].includes(type)) {
      setActiveTab(type);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLatestCalendar();
  }, []);

  useEffect(() => {
    console.log('Active Tab:', activeTab);
    console.log('Current Calendar List:', calendarList);
    const calendars = getCalendarsByProvider(activeTab);
    console.log('Filtered Calendars for', activeTab, ':', calendars);
  }, [activeTab, calendarList]);

  return (
    <div className="w-full  pt-5 min-h-screen">
      <div className="border border-gray-100 bg-white p-8 shadow-sm rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Connected Calendars</h2>
            <p className="text-sm text-gray-500 mt-2">Manage your calendar integrations and availability</p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all duration-200"
              onClick={() => connectNewAccount()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>
      </div>

      {/* Remove Account Confirmation Dialog */}
      {isRemoveDialogOpen && (
        <div className="fixed inset-0 bg-black z-[1000] bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Remove Account</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to remove this account? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                className="px-4 py-2 text-gray-600 cursor-pointer border hover:bg-gray-100 rounded-lg transition-colors duration-200"
                onClick={() => setIsRemoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <button
                className="px-4 py-2 bg-red-600 text-white cursor-pointer rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={handleRemoveAccount}
              >
                Remove Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex gap-6 mb-8">
            <button
              onClick={() => handleTabChange("google")}
              className={`pb-4 px-2 font-medium transition-all duration-200 ${activeTab === "google" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Google Calendar
            </button>
            <button
              onClick={() => handleTabChange("outlook")}
              className={`pb-4 px-2 font-medium transition-all duration-200 ${activeTab === "outlook" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Outlook Calendar
            </button>
          </div>

          <div>
            {activeTab === "google" && (
              <div className="space-y-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Loader2 className="h-14 w-14 text-indigo-600 animate-spin mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Loading Calendars</h3>
                    <p className="text-gray-500 max-w-md">
                      Please wait while we fetch your connected calendars...
                    </p>
                  </div>
                ) : Object.keys(getCalendarsByProvider('google')).length > 0 ? (
                  Object.entries(getCalendarsByProvider('google')).map(([email, calendars]) => (
                    <div key={email} className=" rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                      <div className="p-8">
                        <div className={`flex items-center justify-between ${expandedAccounts[email] ? 'border-b border-gray-100 pb-6 mb-6' : ''}`}>
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-inner">
                              <svg className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">{email}</h3>
                              <p className="text-sm text-gray-500 mt-1">Google Account</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                              onClick={() => openRemoveDialog(calendars?.[0]?.connected_account_id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2 inline" />
                              Remove Account
                            </button>
                            <button
                              className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                              onClick={() => toggleAccountExpanded(email)}
                            >
                              {expandedAccounts[email] ?
                                <ChevronDown className="h-5 w-5 text-gray-400" /> :
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              }
                            </button>
                          </div>
                        </div>

                        {expandedAccounts[email] && (
                          <div className="space-y-4 pl-[4.7rem]">
                            {calendars.map((calendar: any) => (
                              <div key={calendar.id} className="flex items-center justify-between p-5 bg-gray-50/70 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-sm"
                                    style={{ backgroundColor: calendar.backgroundColor || '#f3f4f6' }}>
                                    <Calendar className="h-6 w-6" style={{ color: calendar.foregroundColor || '#0078d4' }} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-800 text-lg">{calendar.summary}</h4>
                                    <div className="flex gap-2 mt-2">
                                      {calendar.accessRole === "owner" && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
                                          Owner
                                        </span>
                                      )}
                                      {calendar.primary && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                                          Primary
                                        </span>
                                      )}
                                      {calendar.selected && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                                          Selected
                                        </span>
                                      )}
                                      {calendar.description && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-100 font-medium">
                                          {calendar.description}
                                        </span>
                                      )}
                                    
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {calendar.is_connected ? (
                                    <button
                                      className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 font-medium transition-all duration-200"
                                      onClick={() => disconnectCalendar(calendar.calendar_id)}
                                      disabled={disconnectingCalendars[calendar.id]}
                                    >
                                      {disconnectingCalendars[calendar.calendar_id] ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                          Disconnecting...
                                        </>
                                      ) : (
                                        "Disconnect"
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 font-medium transition-all duration-200"
                                      onClick={() => connectCalendar(calendar.id, calendar.connected_account_id, calendar)}
                                      disabled={connectingCalendars[calendar. id]}
                                    >
                                      {connectingCalendars[calendar.id] ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                          Connecting...
                                        </>
                                      ) : (
                                        "Connect"
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="bg-gray-100 p-8 rounded-full mb-6">
                      <Calendar className="h-14 w-14 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Google Calendars Connected</h3>
                    <p className="text-gray-500 max-w-md mb-8">
                      Connect your Google Calendar to manage all your schedules in one place.
                    </p>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100" onClick={() => connectNewAccount()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Google Account
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "outlook" && (
              <div className="space-y-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Loader2 className="h-14 w-14 text-indigo-600 animate-spin mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Loading Calendars</h3>
                    <p className="text-gray-500 max-w-md">
                      Please wait while we fetch your connected calendars...
                    </p>
                  </div>
                ) : (
                  <div>
                    {Object.keys(calendarList?.outlook || {}).length > 0 ? (
                      Object.entries(calendarList.outlook).map(([email, calendars]) => {
                        return (
                          <div key={email} className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                            <div className="p-8">
                              <div className={`flex items-center justify-between ${expandedAccounts[email] ? 'border-b border-gray-100 pb-6 mb-6' : ''}`}>
                                <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-inner">
                                    <svg className="h-7 w-7 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M7,2V4H17V2A1,1 0 0,1 18,1H19A1,1 0 0,1 20,2V4H21A1,1 0 0,1 22,5V19A1,1 0 0,1 21,20H3A1,1 0 0,1 2,19V5A1,1 0 0,1 3,4H4V2A1,1 0 0,1 5,1H6A1,1 0 0,1 7,2M4,7V18H20V7H4M6,9H18V11H6V9M6,12H18V14H6V12M6,15H18V17H6V15Z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-800">{email}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Microsoft Account</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                                    onClick={() => openRemoveDialog(calendars?.[0]?.connected_account_id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2 inline" />
                                    Remove Account
                                  </button>
                                  <button
                                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                    onClick={() => toggleAccountExpanded(email)}
                                  >
                                    {expandedAccounts[email] ?
                                      <ChevronDown className="h-5 w-5 text-gray-400" /> :
                                      <ChevronRight className="h-5 w-5 text-gray-400" />
                                    }
                                  </button>
                                </div>
                              </div>

                              {expandedAccounts[email] && (
                                <div className="space-y-4 pl-[4.7rem]">
                                  {calendars.map((calendar: any) => (
                                    <div key={calendar.id} className="flex items-center justify-between p-5 bg-gray-50/70 rounded-xl border border-gray-100">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white rounded-xl shadow-sm">
                                          <Calendar className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-gray-800 text-lg">{calendar.name}</h4>
                                          <div className="flex gap-2 mt-2">
                                            {/* {calendar.canEdit && (
                                              <span className="px-3 py-1 text-xs rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
                                                Can Edit
                                              </span>
                                            )} */}
                                            {/* {calendar.isDefaultCalendar && (
                                              <span className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                                                Default
                                              </span>
                                            )}
                                            {!calendar.isRemovable && (
                                              <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                                                Primary
                                              </span>
                                            )} */}
                                            {calendar.owner && (
                                              <span className="px-3 py-1 text-xs rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-medium">
                                                Owner: {calendar.owner.name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {calendar.is_connected ? (
                                          <button
                                            className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 font-medium transition-all duration-200"
                                            onClick={() => disconnectCalendar(calendar.calendar_id || '')}
                                            disabled={disconnectingCalendars[calendar.calendar_id || '']}
                                          >
                                            {disconnectingCalendars[calendar.calendar_id || ''] ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                                Disconnecting...
                                              </>
                                            ) : (
                                              "Disconnect"
                                            )}
                                          </button>
                                        ) : (
                                          <button
                                            className="px-5 py-2.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 font-medium transition-all duration-200"
                                            onClick={() => connectCalendar(calendar.calendar_id || '', calendar.connected_account_id, calendar)}
                                            disabled={connectingCalendars[calendar.calendar_id || '']}
                                          >
                                            {connectingCalendars[calendar.calendar_id || ''] ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                                                Connecting...
                                              </>
                                            ) : (
                                              "Connect"
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-100 p-8 rounded-full mb-6">
                          <Calendar className="h-14 w-14 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Outlook Calendars Connected</h3>
                        <p className="text-gray-500 max-w-md mb-8">
                          Connect your Outlook Calendar to manage all your schedules in one place.
                        </p>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100" onClick={() => connectNewAccount()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Outlook Account
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "other" && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-gray-100 p-8 rounded-full mb-6">
                  <Calendar className="h-14 w-14 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Other Calendars Connected</h3>
                <p className="text-gray-500 max-w-md mb-8">
                  Connect additional calendar services to manage all your schedules in one place.
                </p>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100" onClick={() => connectNewAccount()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarsPage;
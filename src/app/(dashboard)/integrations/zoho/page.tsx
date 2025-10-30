'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import Button from '@/component/common/Button';
import Card from '@/component/common/Card';
import { FaBuilding, FaCheckCircle, FaExclamationTriangle, FaTrash, FaSync } from 'react-icons/fa';
import { ArrowRight, Shield, Users, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { zohoDisconnectApiRequest, zohoIntegrationListApiRequest } from '@/network/api';
import { toast } from 'react-toastify';

interface ZohoIntegration {
  id: string;
  email: string;
  expiry: string | null;
  provider: string;
  company_id: string;
  domain: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface ZohoIntegrationResponse {
  success: boolean;
  message: string;
  data: {
    integrations: ZohoIntegration[];
  };
}

const ZohoIntegrationPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<ZohoIntegration[]>([]);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [integrationId, setIntegrationId] = useState<string>("");

  const fetchZohoIntegration = async () => {
    try {
      setLoading(true);
      const response = await zohoIntegrationListApiRequest();
      console.log("response==>", response?.data?.integrations);
      const integrations = response?.data?.integrations;

      if (response) {

        if (integrations && integrations.length > 0) {
          setIntegrations(integrations);
          setHasIntegrations(true);
        } else {
          setHasIntegrations(false);
        }
      }
    } catch (error) {
      console.error('Error fetching Zoho integration:', error);
      setError('Failed to fetch Zoho integration');
      setHasIntegrations(false);
    } finally {
      setLoading(false);
    }
  };


  const handleZohoLogin = async () => {
    setIsConnecting(true);

    try {
      // Validate environment variables before proceeding
      const requiredEnvVars = [
        process.env.NEXT_PUBLIC_ZCRM_BASE_URL,
        process.env.NEXT_PUBLIC_ZCRM_SCOPE,
        process.env.NEXT_PUBLIC_ZCRM_CLIENT_ID,
        process.env.NEXT_PUBLIC_ZCRM_REDIRECT_URI
      ];

      const missingVars = requiredEnvVars.filter(varName => !varName);
      console.log(missingVars);

      if (missingVars.length > 0) {
        console.error('Missing environment variables:', missingVars);
        alert('Integration configuration incomplete. Please contact support.');
        return;
      }
      // Construct OAuth URL
      const authUrl = `https://accounts.zoho.com/oauth/v2/auth?${new URLSearchParams({
        scope: "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL",
        client_id: process.env.NEXT_PUBLIC_ZCRM_CLIENT_ID || '',
        response_type: 'code',
        access_type: 'offline',
        redirect_uri: process.env.NEXT_PUBLIC_ZCRM_REDIRECT_URI || '',
        state: 'zoho'
      })}`;

      // Redirect to Zoho OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Zoho OAuth:', error);
      alert('Failed to connect to Zoho. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrationId(integrationId);
    setShowDeleteConfirm(true);
    // TODO: Implement disconnect API call
    try {
      const response = await zohoDisconnectApiRequest(integrationId);
      console.log('Disconnecting integration:', response);
      if (response) {
        toast.success('Zoho integration disconnected successfully',{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        fetchZohoIntegration();
      }
    } catch (error) {
      console.error('Error disconnecting Zoho integration:', error);
      toast.error('Failed to disconnect Zoho integration',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

    }
  };

  const handleRefresh = async () => {
    // TODO: Implement refresh API call
    console.log('Refreshing integration');
    alert('Refresh functionality will be implemented soon.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (expiry: string | null) => {
    if (!expiry) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    const expiryDate = new Date(expiry);
    const now = new Date();
    if (expiryDate > now) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (expiry: string | null) => {
    if (!expiry) {
      return 'Active';
    }
    const expiryDate = new Date(expiry);
    const now = new Date();
    if (expiryDate > now) {
      return 'Expires Soon';
    }
    return 'Expired';
  };

  useEffect(() => {
    fetchZohoIntegration();
  }, []);

  const features = [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Contact Management',
      description: 'Sync contacts and leads between Zoho CRM and your AI receptionist'
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: 'Activity Tracking',
      description: 'Track calls, meetings, and interactions automatically'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure Integration',
      description: 'Enterprise-grade security with OAuth 2.0 authentication'
    }
  ];

  if (loading) {
    return (
      <div className="w-full pt-5 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-screen w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full pt-5 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 bg-red-50 border-red-200">
            <div className="text-center">
              <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Integration</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-5 min-h-screen bg-gray-50">
      <div className="  px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaBuilding className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Zoho CRM Integration</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {hasIntegrations
              ? 'Manage your connected Zoho CRM integrations and sync settings'
              : 'Connect your Zoho CRM to sync contacts, track interactions, and streamline your customer relationship management'
            }
          </p>
        </div>

        {hasIntegrations ? (
          // Connected Integrations View
          <div className="space-y-6">
            {/* Connected Integrations */}
            <Card className="p-6 bg-white shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Connected Integrations</h2>
                </div>
                <Button
                  onClick={handleZohoLogin}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <FaBuilding className="mr-2 h-4 w-4" />
                  Add Another
                </Button>
              </div>

              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <FaBuilding className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{integration.email}</h3>
                            {getStatusIcon(integration.expiry)}
                            <span className={`text-xs px-2 py-1 rounded-full ${!integration.expiry
                              ? 'bg-green-100 text-green-800'
                              : new Date(integration.expiry) > new Date()
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {getStatusText(integration.expiry)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Organization ID: {integration.organization_id}</p>
                            <p>Domain: {integration.domain}</p>
                            <p>Connected: {formatDate(integration.created_at)}</p>
                            {integration.expiry && (
                              <p className="text-orange-600">
                                Expires: {formatDate(integration.expiry)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRefresh()}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                          title="Refresh Integration"
                        >
                          <FaSync className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setIntegrationId(integration.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white p-2"
                          title="Disconnect Integration"
                        >
                          <FaTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Integration Features */}
            <Card className="p-6 bg-white shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Features</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          // Connect Integration View (Original UI)
          <>
            {/* Main Integration Card */}
            <Card className="mb-8 p-8 bg-white shadow-lg border-0">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Left Side - Info */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <FaBuilding className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Connect Zoho CRM</h2>
                      <p className="text-gray-600">Secure OAuth 2.0 Authentication</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{feature.title}</h3>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side - Action */}
                <div className="flex-shrink-0 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mb-6">
                    <FaBuilding className="h-16 w-16 text-orange-600" />
                  </div>

                  <Button
                    onClick={handleZohoLogin}
                    disabled={isConnecting}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-orange-100 transition-all duration-200 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Zoho CRM
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 mt-3 max-w-xs">
                    You'll be redirected to Zoho's secure login page
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Security Notice */}
        {/* <Card className="p-6 mt-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Secure Connection</h3>
              <p className="text-blue-800 text-sm">
                This integration uses OAuth 2.0 for secure authentication. We never store your Zoho credentials.
                You can revoke access at any time from your Zoho account settings.
              </p>
            </div>
          </div>
        </Card> */}

        {/* Status Messages */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-4 p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                Development Mode: Ensure all Zoho environment variables are configured
              </p>
            </div>
          </Card>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/80  bg-opacity-130 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to disconnect this Zoho integration?</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDisconnect(integrationId || "")}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default ZohoIntegrationPage;

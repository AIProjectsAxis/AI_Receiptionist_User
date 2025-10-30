"use client"    
export const runtime = 'edge';

import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { 
  FormGroup, 
  FormLabel, 
  FormInput, 
  FormHelper 
} from '../common/FormElements';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status?: string;
  lastSync?: string;
  description: string;
}

interface OnboardingData {
  documents?: Array<{ id: string; name: string; size: number; type: string; url: string }>;
  integrations?: string[];
}

interface KnowledgeBaseProps {
  onboardingData: OnboardingData;
  onStepChange: (step: number) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onboardingData, onStepChange }) => {
  const [documents, setDocuments] = useState<Document[]>(onboardingData.documents || []);
  const [integrations, setIntegrations] = useState<string[]>(onboardingData.integrations || []);
  const [connectedSources, setConnectedSources] = useState<Integration[]>([
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      type: 'calendar',
      status: 'connected',
      lastSync: '10 minutes ago',
      description: 'Calendar integration for appointment scheduling'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      type: 'crm',
      status: 'connected',
      lastSync: '25 minutes ago',
      description: 'Customer data and lead management'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      type: 'communication',
      status: 'connected',
      lastSync: '1 hour ago',
      description: 'SMS notifications and reminders'
    }
  ]);
  const [newIntegration, setNewIntegration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSources: Integration[] = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      type: 'crm',
      description: 'Sync customer data, leads, and opportunities'
    },
    {
      id: 'Make.com',
      name: 'Make.com',
      type: 'automation',
      description: 'Connect apps & Design workflows'
    },
    {
      id: 'microsoft_365',
      name: 'Microsoft 365',
      type: 'calendar',
      description: 'Connect with Outlook and Microsoft Teams'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'payment',
      description: 'Process payments and handle billing'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      type: 'automation',
      description: 'Create custom workflows with thousands of apps'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    
    setDocuments([...documents, ...newDocuments]);
  };

  const removeDocument = (documentId: string) => {
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };

  const handleConnect = (sourceId: string) => {
    const sourceToConnect = availableSources.find(source => source.id === sourceId);
    
    if (sourceToConnect) {
      setConnectedSources([
        ...connectedSources,
        {
          ...sourceToConnect,
          status: 'connected',
          lastSync: 'Just now'
        }
      ]);
      
      if (!integrations.includes(sourceId)) {
        setIntegrations([...integrations, sourceId]);
      }
    }
  };

  const handleDisconnect = (sourceId: string) => {
    setConnectedSources(connectedSources.filter(source => source.id !== sourceId));
    setIntegrations(integrations.filter(i => i !== sourceId));
  };

  const handleAddIntegration = () => {
    if (!newIntegration.trim()) return;
    
    if (!integrations.includes(newIntegration.trim())) {
      setIntegrations([...integrations, newIntegration.trim()]);
      setConnectedSources([
        ...connectedSources,
        {
          id: newIntegration.trim(),
          name: newIntegration.trim(),
          type: 'custom',
          status: 'connected',
          lastSync: 'Just now',
          description: 'Custom integration'
        }
      ]);
    }
    
    setNewIntegration('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Card
      title="Knowledge Base & Integrations"
      subtitle="Upload documents and connect your business systems"
    >
      <div className="max-w-[900px]">
        {/* Document Upload Section */}
        <section className="mb-6 pb-5 border-b border-gray-200 last:mb-0 last:pb-0 last:border-b-0">
          <div className="text-lg font-semibold text-gray-800 mb-4">Knowledge Documents</div>
          
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <div className="text-gray-600">Drag and drop files here or</div>
              <label>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <Button variant="secondary">Browse Files</Button>
              </label>
              <div className="text-xs text-gray-500 mt-2">
                Supported formats: PDF (Max 10MB per file), only PDF files are supported
              </div>
            </div>
          </div>
          
          {documents.length > 0 && (
            <div>
              <div className="font-semibold text-gray-700 mb-3 text-sm">
                Uploaded Documents ({documents.length})
              </div>
              
              <div className="flex flex-col gap-3 mb-4">
                {documents.map(doc => (
                  <div 
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="w-9 h-9 bg-primary-50 text-primary-500 rounded-md flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 text-sm mb-1 break-words">{doc.name}</div>
                      <div className="text-xs text-gray-500">
                        {doc.type.split('/')[1].toUpperCase()} · {formatFileSize(doc.size)}
                      </div>
                    </div>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <FormHelper>
            Upload documents like brochures, product specifications, or service descriptions to help your AI receptionist understand your business better.
          </FormHelper>
        </section>
        
        {/* Integrations Section */}
        <section className="mb-6 pb-5 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-800 mb-1">Connected Sources</div>
          <div className="text-sm text-gray-600 mb-4">Your active data integrations</div>
          
          {connectedSources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 mb-6">
              {connectedSources.map(source => (
                <div 
                  key={source.id}
                  className="flex gap-4 p-4 bg-white/90 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                      source.type === 'calendar' ? 'bg-primary-50 text-primary-500' :
                      source.type === 'crm' ? 'bg-emerald-50 text-emerald-500' :
                      source.type === 'communication' ? 'bg-red-50 text-red-500' :
                      source.type === 'payment' ? 'bg-amber-50 text-amber-500' :
                      source.type === 'automation' ? 'bg-purple-50 text-purple-500' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {/* SVG icons remain the same */}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-lg font-medium text-gray-800">{source.name}</div>
                      <div className="text-sm font-medium text-green-500">Connected</div>
                    </div>
                    <div className="text-gray-600 text-sm mb-2">{source.description}</div>
                    <div className="text-gray-500 text-xs mb-4">Last synced: {source.lastSync}</div>
                    <div className="flex gap-3">
                      <Button variant="secondary" size="sm">Configure</Button>
                      <Button variant="secondary" size="sm">Sync Now</Button>
                      <Button 
                        variant="text" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => handleDisconnect(source.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-600 mb-4">
              No connected sources. Connect data sources to enhance your AI receptionist.
            </div>
          )}
          
          <div className="text-lg font-semibold text-gray-800 mb-1 mt-8">Available Sources</div>
          <div className="text-sm text-gray-600 mb-4">Add new data sources to enhance your AI receptionist's capabilities</div>
          
          <div className="grid grid-cols-1 gap-4 mb-6">
            {availableSources
              .filter(source => !connectedSources.some(cs => cs.id === source.id))
              .map(source => (
                <div 
                  key={source.id}
                  className="flex gap-4 p-4 bg-white/70 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Similar structure to connected sources but with different styling */}
                </div>
              ))}
          </div>
          
          <div className="mt-4 mb-4">
            <FormLabel>Request New Integration</FormLabel>
            <div className="flex gap-3">
              <FormInput
                value={newIntegration}
                onChange={(e) => setNewIntegration(e.target.value)}
                placeholder="E.g., Your custom CRM system"
              />
              <Button 
                variant="secondary" 
                onClick={handleAddIntegration}
                disabled={!newIntegration.trim()}
              >
                Request Integration
              </Button>
            </div>
          </div>
          
          <FormHelper>
            Integrations allow your AI receptionist to access external systems to provide better service.
          </FormHelper>
        </section>
      </div>
    </Card>
  );
};

export default KnowledgeBase;
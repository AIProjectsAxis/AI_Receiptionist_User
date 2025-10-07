"use client"
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, MessageSquare, Globe, Settings, Database } from 'lucide-react';
import Button from '../../common/Button';
import { toast } from 'react-toastify';

import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';

interface ApiRequestActionComponentProps {
    isOpen: boolean;
    onClose: () => void;

    initialData?: any;
    isEdit: boolean;
    setViewEditActionId: (id: string) => void;
    setShowApiRequestForm: (show: boolean) => void;
    getAllActionList: () => void;
    viewEditActionId: string;
}

interface Message {
    content: string;
    type: 'request-start' | 'request-failed';
    blocking?: boolean;
    end_call_after_spoken_enabled?: boolean;
}

interface HeaderProperty {
    type: 'string';
    value: string;
    name: string;
}

interface BodyProperty {
    description: string;
    type: 'string' | 'number' | 'boolean';
    value: string;
    name: string;
}

const ApiRequestActionComponent: React.FC<ApiRequestActionComponentProps> = ({
    isOpen,
    onClose,

    initialData,
    isEdit,
    setViewEditActionId,
    setShowApiRequestForm,
    getAllActionList,
    viewEditActionId
}) => {

    // Initialize state with useMemo to prevent unnecessary re-initialization
    const initialState = useMemo(() => ({
        name: initialData?.name || '',
        url: initialData?.url || '',
        method: (initialData?.method || 'GET') as 'GET' | 'POST',
        messages: [
            {
                content: initialData?.messages?.[0]?.content || '',
                type: 'request-start' as const,
                blocking: initialData?.messages?.[0]?.blocking ?? true
            },
            {
                content: initialData?.messages?.[1]?.content || '',
                type: 'request-failed' as const,
                end_call_after_spoken_enabled: initialData?.messages?.[1]?.end_call_after_spoken_enabled ?? true
            }
        ],
        headers: initialData?.headers?.properties || {},
        bodyProperties: initialData?.body?.properties || {},
        requiredFields: initialData?.body?.required || []
    }), [initialData]);

    const [name, setName] = useState(initialState.name);
    const [url, setUrl] = useState(initialState.url);
    const [method, setMethod] = useState<'GET' | 'POST'>(initialState.method);
    const [messages, setMessages] = useState<Message[]>(initialState.messages);
    const [headers, setHeaders] = useState<Record<string, HeaderProperty>>(initialState.headers);
    const [bodyProperties, setBodyProperties] = useState<Record<string, BodyProperty>>(initialState.bodyProperties);
    const [requiredFields, setRequiredFields] = useState<string[]>(initialState.requiredFields);
    const [headerCounter, setHeaderCounter] = useState(0);
    const [bodyPropertyCounter, setBodyPropertyCounter] = useState(0);
    const [btnLoader, setBtnLoader] = useState(false)
    const [errors, setErrors] = useState<{ name?: string; url?: string; bodyProperties?: Record<string, string> }>({});
    // Memoized handlers to prevent re-creation on every render
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, '');
        setName(value);
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    }, [errors.name]);

    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (errors.url) {
            setErrors(prev => ({ ...prev, url: undefined }));
        }
    }, [errors.url]);

    const handleMethodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setMethod(e.target.value as 'GET' | 'POST');
    }, []);

    const handleMessageChange = useCallback((index: number, field: keyof Message, value: any) => {
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[index] = { ...newMessages[index], [field]: value };
            return newMessages;
        });
    }, []);

    const addHeader = useCallback(() => {
        const newKey = `header_${headerCounter}`;
        setHeaders(prev => ({
            ...prev,
            [newKey]: {
                type: 'string',
                value: '',
                name: ''
            }
        }));
        setHeaderCounter(prev => prev + 1);
    }, [headerCounter]);

    const removeHeader = useCallback((key: string) => {
        setHeaders(prev => {
            const newHeaders = { ...prev };
            delete newHeaders[key];
            return newHeaders;
        });
    }, []);

    const updateHeader = useCallback((key: string, field: keyof HeaderProperty, value: string) => {
        setHeaders(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    }, []);


    const addBodyProperty = useCallback(() => {
        const newKey = `property_${bodyPropertyCounter}`;
        setBodyProperties(prev => ({
            ...prev,
            [newKey]: {
                description: '',
                type: 'string',
                value: '',
                name: ''
            }
        }));
        setBodyPropertyCounter(prev => prev + 1);
    }, [bodyPropertyCounter]);

    const removeBodyProperty = useCallback((key: string) => {
        setBodyProperties(prev => {
            const newProperties = { ...prev };
            delete newProperties[key];
            return newProperties;
        });

        setRequiredFields(prev => prev.filter(field => field !== key));
    }, []);

    const updateBodyProperty = useCallback((key: string, field: keyof BodyProperty, value: string) => {
        setBodyProperties(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
        if (errors.bodyProperties && errors.bodyProperties[key] && (field === 'name' || field === 'value')) {
            setErrors(prev => {
                if (!prev.bodyProperties) return prev;
                const newBodyProps = { ...prev.bodyProperties };
                delete newBodyProps[key];
                // If no more errors, remove bodyProperties from errors
                if (Object.keys(newBodyProps).length === 0) {
                    const { bodyProperties, ...rest } = prev;
                    return rest;
                }
                return { ...prev, bodyProperties: newBodyProps };
            });
        }
    }, [errors.bodyProperties]);

    const toggleRequired = useCallback((key: string) => {
        setRequiredFields(prev =>
            prev.includes(key)
                ? prev.filter(field => field !== key)
                : [...prev, key]
        );
    }, []);

    const handleSave = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const newErrors: { name?: string; url?: string; bodyProperties?: Record<string, string> } = {};
        if (!name) {
            newErrors.name = 'Action Name is required';
        }
        if (!url) {
            newErrors.url = 'API URL is required';
        }
        let bodyPropErrors: Record<string, string> = {};
        for (const key of requiredFields) {
            const property = bodyProperties[key];
            if (!property || !property.name || property.value === '') {
                bodyPropErrors[key] = 'Name and value are required';
            }
        }
        if (Object.keys(bodyPropErrors).length > 0) {
            newErrors.bodyProperties = bodyPropErrors;
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }
        try {
            setBtnLoader(true)
            // Convert headers to the expected format
            const formattedHeaders: Record<string, { type: string; value: string }> = {};
            Object.entries(headers).forEach(([key, header]) => {
                if (header.name && header.value) {
                    formattedHeaders[header.name] = {
                        type: header.type,
                        value: header.value
                    };
                }
            });

            // Convert body properties to the expected format
            const formattedBodyProperties: Record<string, { description: string; type: string; value: string }> = {};
            Object.entries(bodyProperties).forEach(([key, property]) => {
                if (property.name) {
                    formattedBodyProperties[property.name] = {
                        description: property.description,
                        type: property.type,
                        value: property.value
                    };
                }
            });

            // Update required fields to use property names instead of keys
            const formattedRequiredFields = requiredFields.map(key => {
                const property = bodyProperties[key];
                return property ? property.name : key;
            }).filter(Boolean);

            const data = {
                type: "apiRequest",
                name: name,
                messages: messages,
                function: {
                    name: "api_request_tool"
                },
                url: url,
                method: method,
                headers: Object.keys(formattedHeaders).length > 0 ? {
                    type: "object",
                    properties: formattedHeaders
                } : null,
                body: Object.keys(formattedBodyProperties).length > 0 ? {
                    type: "object",
                    properties: formattedBodyProperties,
                    required: formattedRequiredFields
                } : null,
                async: false,
                server: null
            };


            if (viewEditActionId) {
                await updateActionApiRequest(viewEditActionId, data);
                setName("")
                setUrl("")
                setMethod("GET")
                setMessages([])
                setHeaders({})
                setBodyProperties({})
                setRequiredFields([])
                toast.success('API Request tool updated successfully',{
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                  });

            } else {
                await createActionApiRequest(data);
                toast.success('API Request tool created successfully',{
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                  });
            }
            setViewEditActionId("")
            onClose();
            getAllActionList();
        } catch (error) {
            console.error('Error saving API request:', error);
            toast.error('Failed to save API request',{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
              });
        } finally {
            setBtnLoader(false)
        }
    }, [name, messages, url, method, headers, bodyProperties, requiredFields, viewEditActionId, onClose, getAllActionList]);

    const getApiRequestData = async () => {
        const response = await getActionByIdApiRequest(viewEditActionId as string);
        const actionData = response?.data?.action;
        setName(actionData?.name || '');
        setUrl(actionData?.url || '');
        setMethod(actionData?.method || 'GET');
        setMessages(actionData?.messages || []);
        setHeaders(actionData?.headers || {});
        setBodyProperties(actionData?.body?.properties || {});
        setRequiredFields(actionData?.body?.required || []);
        setHeaderCounter(Object.keys(actionData?.headers?.properties || {}).length);
        setBodyPropertyCounter(Object.keys(actionData?.body?.properties || {}).length);

    }


    useEffect(() => {
        if (viewEditActionId) {
            getApiRequestData();
        }
    }, [viewEditActionId]);

    if (!isOpen) return null;

    return (
        <form onSubmit={handleSave} className="bg-white rounded-xl w-full  overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mt-2 pb-4  border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">API Request Action</h2>
                        <p className="text-sm text-gray-500">Configure your API request settings</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 ">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSave}
                        // disabled={!name || !url}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"

                    >
                        {btnLoader ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6D4AFF]"></div> :<Save className="w-4 h-4" />}
                        {viewEditActionId? "Update" : "Create"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mt-6 px-1">
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${errors.name ? 'text-red-600' : 'text-gray-700'}`}>Action Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="Enter action name (no spaces)"
                                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                                <p className="text-xs text-gray-500 mt-1">No spaces allowed</p>

                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                                <select
                                    value={method}
                                    onChange={handleMethodChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${errors.url ? 'text-red-600' : 'text-gray-700'}`}>API URL *</label>
                            <input
                                type="url"
                                value={url}
                                onChange={handleUrlChange}
                                placeholder="https://api.example.com/endpoint"
                                className={`w-full px-3 py-2 border ${errors.url ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.url && <p className="text-xs text-red-600 mt-1">{errors.url}</p>}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Messages
                        </h3>

                        {messages.map((message, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {message.type.replace('-', ' ')}
                                    </span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {message.type}
                                    </span>
                                </div>

                                <textarea
                                    value={message.content}
                                    onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                                    placeholder={`Enter ${message.type} message...`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={3}
                                />

                                <div className="flex items-center gap-4 mt-3">
                                    {message.type === 'request-start' && (
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={message.blocking}
                                                onChange={(e) => handleMessageChange(index, 'blocking', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Blocking</span>
                                        </label>
                                    )}

                                    {message.type === 'request-failed' && (
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={message.end_call_after_spoken_enabled}
                                                onChange={(e) => handleMessageChange(index, 'end_call_after_spoken_enabled', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">End call after spoken</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Headers */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Headers</h3>
                            <Button
                                onClick={addHeader}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Header
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(headers).map(([key, header]) => (
                                <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                                    <input
                                        type="text"
                                        value={header.name}
                                        onChange={(e) => updateHeader(key, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Header name (e.g., Authorization)"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={(e) => updateHeader(key, 'value', e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Header value (e.g., Bearer token)"
                                    />
                                    <button
                                        onClick={() => removeHeader(key)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove header"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body Properties */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Body Properties
                            </h3>
                            <Button
                                onClick={addBodyProperty}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Property
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(bodyProperties).map(([key, property]) => (
                                <div key={key} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <input
                                            type="text"
                                            value={property.name}
                                            onChange={(e) => updateBodyProperty(key, 'name', e.target.value)}
                                            className={`flex-1 px-3 py-2 border ${errors.bodyProperties && errors.bodyProperties[key] ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium`}
                                            placeholder="Property name"
                                        />
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={requiredFields.includes(key)}
                                                    onChange={() => toggleRequired(key)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700">Required</span>
                                            </label>
                                            <button
                                                onClick={() => removeBodyProperty(key)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Type
                                            </label>
                                            <select
                                                value={property.type}
                                                onChange={(e) => updateBodyProperty(key, 'type', e.target.value as 'string' | 'number' | 'boolean')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Value
                                            </label>
                                            <input
                                                type={property.type === 'number' ? 'number' : 'text'}
                                                value={property.value}
                                                onChange={(e) => updateBodyProperty(key, 'value', e.target.value)}
                                                className={`w-full px-3 py-2 border ${errors.bodyProperties && errors.bodyProperties[key] ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                                                placeholder={`Enter ${property.type} value`}
                                            />
                                            {errors.bodyProperties && errors.bodyProperties[key] && (
                                                <p className="text-xs text-red-600 mt-1">{errors.bodyProperties[key]}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={property.description}
                                            onChange={(e) => updateBodyProperty(key, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="Property description"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}

        </form>
    );
};

export default ApiRequestActionComponent;
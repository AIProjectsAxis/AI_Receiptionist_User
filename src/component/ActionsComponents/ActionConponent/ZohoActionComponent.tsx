import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/component/ui/form';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import Button from '@/component/common/Button';
import { X, Database, CheckCircle } from 'lucide-react';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest, zohoIntegrationListApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import Card from '@/component/common/Card';

const FormSchema = z.object({
    actionName: z.string().min(1, "Action name is required"),

    zohoIntegrationId: z.string().min(1, "Please select a Zoho integration"),

});

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

type Props = {
    isEdit: boolean;
    setViewEditActionId: (id: string) => void;
    setShowZohoActionForm: (show: boolean) => void;
    getAllActionList: () => void;
    viewEditActionId: string;
};

const ZohoActionComponent = ({
    isEdit,
    setViewEditActionId,
    viewEditActionId,
    setShowZohoActionForm,
    getAllActionList
}: Props) => {
    const [loading, setLoading] = useState(false);
    const [zohoIntegrations, setZohoIntegrations] = useState<ZohoIntegration[]>([]);
    const [editActionData, setEditActionData] = useState<any>(null);

    const handleClose = () => {
        setShowZohoActionForm(false);
        setViewEditActionId("");
        form.reset();
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            actionName: "",
            zohoIntegrationId: "",
        }
    });

    const fetchZohoIntegrations = async () => {
        try {
            const response = await zohoIntegrationListApiRequest();
            if (response?.data?.integrations) {
                setZohoIntegrations(response.data.integrations);
            }
        } catch (error) {
            console.error('Error fetching Zoho integrations:', error);
            toast.error('Failed to fetch Zoho integrations',{
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

    const getActionById = async () => {
        try {
            const response = await getActionByIdApiRequest(viewEditActionId);
            const actionData = response?.data?.action;
            setEditActionData(actionData);

            form.reset({
                actionName: actionData?.name || "",
                zohoIntegrationId: actionData?.zoho_account_id || "",

            });
        } catch (error) {
            console.error('Error fetching action by id:', error);
            toast.error('Failed to fetch action details',{
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

    useEffect(() => {
        fetchZohoIntegrations();
        if (viewEditActionId) {
            getActionById();
        }
    }, [isEdit, viewEditActionId]);

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        try {
            setLoading(true);

            const payload = {
                name: data.actionName,
                zoho_account_id: data.zohoIntegrationId,
                type: "zoho",
            }

            if (viewEditActionId) {
                await updateActionApiRequest(viewEditActionId, payload);
                toast.success("Zoho action updated successfully!",{
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                  });
            } else {
                await createActionApiRequest(payload);
                toast.success("Zoho action created successfully!",{
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

            handleClose();
            getAllActionList();
            setViewEditActionId("");
        } catch (error) {
            console.error('Error submitting Zoho action:', error);
            toast.error(isEdit ? 'Failed to update Zoho action' : 'Failed to create Zoho action',{
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
            setLoading(false);
        }
    };




    return (
        <Card className=" w-full !p-0 !border-none !shadow-none  overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mt-2 pb-4  border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <Database className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isEdit ? 'Edit Zoho Action' : 'Create Zoho Action'}
                        </h2>
                        <p className="text-sm text-gray-500">Configure your Zoho CRM integration action</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 ">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                        type="submit"
                        onClick={form.handleSubmit(onSubmit)}
                    >
                        {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
                        {viewEditActionId ? "Update" : "Create"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mt-6  px-1">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="actionName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Action Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter action name"
                                                className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            />
                                        </FormControl>
                                        <FormMessage className='text-red-500 text-[12px]' />
                                    </FormItem>
                                )}
                            />



                            {/* Zoho Integration Selection */}
                            <FormField
                                control={form.control}
                                name="zohoIntegrationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zoho Integration *</FormLabel>
                                        <FormControl>
                                            <div className='bg-white rounded-lg border-2 px-3 py-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200'>
                                                <select
                                                    {...field}
                                                    className="w-full outline-none rounded-lg border-none  border-gray-200 focus:border-blue-500  bg-white"
                                                >
                                                    <option value="">Select a Zoho integration</option>
                                                    {zohoIntegrations.map((integration) => (
                                                        <option key={integration.id} value={integration.id}>
                                                            {integration.email}
                                                        </option>
                                                    ))}
                                                </select>

                                            </div>
                                        </FormControl>
                                        <FormMessage className='text-red-500 text-[12px]' />
                                    </FormItem>
                                )}
                            />

                            {/* Integration Status */}
                            {zohoIntegrations.length === 0 && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                                        <p className="text-yellow-800 text-sm">
                                            No Zoho integrations found. Please connect a Zoho CRM integration first.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Available Integrations Info */}
                        {/* {zohoIntegrations.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Available Zoho Integrations</h4>
                  <div className="space-y-2">
                    {zohoIntegrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <p className="font-medium text-gray-900">{integration.email}</p>
                          <p className="text-sm text-gray-600">
                            Org ID: {integration.organization_id} • Domain: {integration.domain}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            getStatusText(integration.expiry) === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getStatusText(integration.expiry)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(integration.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
                    </form>
                </Form>
            </div>

            {/* Footer */}

        </Card>
    );
};

export default ZohoActionComponent;
'use client'
import React, { useState } from 'react'
import Card from '@/component/common/Card';
import { FormGroup, FormLabel, FormSelect } from '@/component/common/FormElements';
import Button from '@/component/common/Button';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateCompanyApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { getCompanyDataThunkRequest } from '@/lib/Redux/SliceActions/CompanyActions';

const notificationSchema = z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    callSummaries: z.string().min(1, { message: 'Call summary frequency is required' })
});

const NotificationComponent = ({companyData}: {companyData: any}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useDispatch();
    
    const form = useForm({
        resolver: zodResolver(notificationSchema),
        defaultValues: {
            emailNotifications: companyData?.email_enabled,
            smsNotifications: companyData?.sms_enabled,
            callSummaries: companyData?.call_reports
        }
    });

    const callSummaryOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ];

    const handleNotificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        form.setValue('callSummaries', e.target.value);
    };

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            console.log('Notification settings:', data);
            const payload = {
                sms_enabled: data.smsNotifications,
                email_enabled: data.emailNotifications,
                call_reports: data.callSummaries
            }
            // TODO: Add API call here
           console.log( 'payload0--=', payload)
           const response = await updateCompanyApiRequest(payload)
           if(response){
            toast.success('Notification settings updated successfully', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
            });
            dispatch(getCompanyDataThunkRequest() as any)
           }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSwitch = (field: 'emailNotifications' | 'smsNotifications') => {
        const currentValue = form.watch(field);
        form.setValue(field, !currentValue);
    };

    return (
        <Card
            title="Notification Settings"
            subtitle="Manage how you receive updates and alerts"
        >
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel htmlFor="emailNotifications" className="text-base font-medium text-gray-900 m-0">
                                    Email Notifications
                                </FormLabel>
                                <button
                                    type="button"
                                    onClick={() => toggleSwitch('emailNotifications')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        form.watch('emailNotifications') ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            form.watch('emailNotifications') ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Receive important updates and alerts via email
                            </p>
                        </div>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel htmlFor="smsNotifications" className="text-base font-medium text-gray-900 m-0">
                                    SMS Notifications
                                </FormLabel>
                                <button
                                    type="button"
                                    onClick={() => toggleSwitch('smsNotifications')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        form.watch('smsNotifications') ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            form.watch('smsNotifications') ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Receive text message alerts for urgent matters
                            </p>
                        </div>
                    </div>

                    {/* Call Summary Reports */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <FormGroup>
                            <FormLabel htmlFor="callSummaries" className="text-base font-medium text-gray-900 mb-2">
                                Call Summary Reports
                            </FormLabel>
                            <FormSelect
                                id="callSummaries"
                                name="callSummaries"
                                value={form.watch('callSummaries')}
                                onChange={handleNotificationChange}
                                options={callSummaryOptions}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-sm text-gray-600 mt-2">
                                Choose how often you want to receive call summary reports
                            </p>
                        </FormGroup>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSubmitting}
                        className="min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default NotificationComponent
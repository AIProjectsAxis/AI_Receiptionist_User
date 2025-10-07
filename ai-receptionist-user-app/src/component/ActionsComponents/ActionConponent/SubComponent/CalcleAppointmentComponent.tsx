import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/component/ui/form';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';
import { toast } from 'react-toastify';

const FormSchema = z.object({
    toolName: z.string().min(1, { message: "Tool name is required" }),
    messages: z.object({
        requestStart: z.string().min(1, { message: "Request start message is required" }),
        requestFailed: z.string().min(1, { message: "Request failed message is required" })
    })
});

const CalcleAppointmentComponent = ({ setShowCancelAppointmentForm, isEdit, setViewEditActionId, getAllActionList, viewEditActionId }: { setShowCancelAppointmentForm: (show: boolean) => void, isEdit: boolean, setViewEditActionId: (id: string) => void, getAllActionList: () => void, viewEditActionId: string }) => {
    const [btnLoading, setBtnLoading] = useState(false)

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            toolName: '',
            messages: {
                requestStart: '',
                requestFailed: ''
            }
        }
    });

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        try {
            // Validate form data before submission
            // if (!data.toolName || !data.messages.requestStart || !data.messages.requestFailed) {
            //     toast.error("Please fill in all required fields");
            //     return;
            // }

            const payload = {
                type: "function",
                name: data.toolName,
                async_: null,
                messages: [
                    {
                        contents: null,
                        content: data.messages.requestStart,
                        conditions: null,
                        type: "request-start",
                        blocking: true
                    },
                    {
                        contents: null,
                        content: data.messages.requestFailed,
                        conditions: null,
                        type: "request-failed",
                        end_call_after_spoken_enabled: true
                    }
                ],
                function: {
                    name: "calendar_cancel_appointment",
                    description: "Use this function to cancel an existing appointment. Requires booking ID.",
                    parameters: {
                        type: "object",
                        properties: {
                            booking_id: {
                                type: "string",
                                description: "The unique identifier of the booking to be cancelled."
                            }
                        },
                        required: [
                            "booking_id"
                        ]
                    },
                    strict: false
                },
                server: {
                    url: "https://xeads-voice-assistant-922834411130.asia-south2.run.app/actionCall/cancel",
                    timeout_seconds: null,
                    secret: null,
                    headers: null,
                    backoff_plan: null
                },
                destinations: null,
                knowledge_bases: null,
                function_type: "cancel_appointment",
                notification: null,
                async: false
            };

            setBtnLoading(true);

            if (viewEditActionId) {
                await updateActionApiRequest(viewEditActionId, payload);
                toast.success("Cancel appointment updated successfully");
                getAllActionList();
            } else {
                await createActionApiRequest(payload);
                toast.success("Cancel appointment created successfully");
                getAllActionList();
                form.reset();
            }

            setBtnLoading(false);
            setShowCancelAppointmentForm(false);
            setViewEditActionId("");

        } catch (error: any) {
            console.error('Error submitting form:', error);
            toast.error(error?.response?.data?.message || "Error updating cancel appointment");
            setBtnLoading(false);
        }
    };

    const getCancelAppointmentData = async () => {
        try {
            const res = await getActionByIdApiRequest(viewEditActionId as string)
            const actionData = res?.data?.action;

            // Reset form with proper structure
            form.reset({
                toolName: actionData?.name || '',
                messages: {
                    requestStart: actionData?.messages?.[0]?.content || '',
                    requestFailed: actionData?.messages?.[1]?.content || ''
                }
            });
        } catch (error) {
            console.error('Error fetching cancel appointment data:', error);
        }
    }

    useEffect(() => {
        if (viewEditActionId) {
            getCancelAppointmentData()
        }
    }, [viewEditActionId])



    return (
        <div className="">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg w-full">
                    <div className="flex justify-between items-center mt-2 pb-4  border-b border-gray-200">
                        <h2 className="text-xl font-semibold">Cancel Appointment Configuration</h2>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    isEdit = false
                                    setViewEditActionId("")
                                    setShowCancelAppointmentForm(false)
                                    form.reset()
                                }}
                                className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"

                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                                disabled={btnLoading}
                            >
                                {btnLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
                                {viewEditActionId ? "Update" : "Create"}
                            </button>
                        </div>
                        {/* <button
                            onClick={() => setShowCancelAppointmentForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button> */}
                    </div>

                    <div className="space-y-6 mt-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="toolName"
                                render={({ field }) => (
                                    <FormItem>
                                        <label className="block text-sm font-medium text-gray-700">Tool Name</label>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter Tool Name"
                                                className="w-full mt-1"
                                                onBlur={() => {
                                                    if (!field.value || field.value.trim() === '') {
                                                        form.setError("toolName", { message: "Tool Name is required" });
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage className='text-red-500 text-[12px]' />
                                    </FormItem>
                                )}
                            />
                            <div className='bg-gray-100 space-y-5 p-4 rounded-md'>

                                <FormField
                                    control={form.control}
                                    name="messages.requestStart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <label className="block text-sm font-medium text-gray-700">Request Start Message</label>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter request start message"
                                                    className="w-full mt-1"
                                                    rows={2}
                                                    onBlur={() => {
                                                        if (!field.value || field.value.trim() === '') {
                                                            toast.error("Request Start Message is required");
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="messages.requestFailed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <label className="block text-sm font-medium text-gray-700">Request Failed Message</label>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter request failed message"
                                                    className="w-full mt-1"
                                                    rows={2}
                                                    onBlur={() => {
                                                        if (!field.value || field.value.trim() === '') {
                                                            toast.error("Request Failed Message is required");
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>

                        {/* Form Actions */}

                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CalcleAppointmentComponent;
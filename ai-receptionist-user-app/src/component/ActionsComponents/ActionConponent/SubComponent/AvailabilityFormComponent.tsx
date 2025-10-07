import React, { useEffect, useState } from 'react'
import { Input } from '@/component/ui/input'
import { FaRegCalendarAlt, FaClock, FaCalendarCheck } from 'react-icons/fa'
import { MdOutlineMessage } from 'react-icons/md'
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/component/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from '@/component/ui/textarea'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

const FormSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
})

const AvailabilityFormComponent = ({ isEdit, setShowAvailabilityForm, getAllActionList, setShowSubActions, setViewEditActionId, viewEditActionId }: { isEdit: any, setShowAvailabilityForm: any, getAllActionList: any, setShowSubActions: any, setViewEditActionId: any, viewEditActionId: any }) => {
    const router = useRouter()

    const [editActionData, setEditActionData] = useState<any>(null)
    const [nameBookingAppointment, setNameBookingAppointment] = useState("")
    const [btnLoader, setBtnLoader] = useState(false)
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            description: "",
        }
    })

    useEffect(() => {
        if (isEdit && editActionData) {
            form.reset({
                name: editActionData.name || "",
                description: editActionData.messages?.[0]?.content?.replace("Alright, Checking availability...", "") || ""
            })
        }
    }, [editActionData, isEdit, form])

    const onSubmit = async (values: z.infer<typeof FormSchema>) => {
        try {
            setBtnLoader(true)
            const payload = {
                "updated_at": "2025-06-09T13:32:11.632406Z",
                "type": "function",
                "name": values.name,
                "async_": null,
                "messages": [
                    {
                        "contents": null,
                        "content": "Alright, Checking availability..." + values.description,
                        "conditions": null,
                        "type": "request-start",
                        "blocking": true
                    },
                    {
                        "contents": null,
                        "content": "Sorry, we couldn't find book your appointment ",
                        "conditions": null,
                        "type": "request-failed",
                        "end_call_after_spoken_enabled": true
                    }
                ],
                "function": {
                    "name": "calendar_check_availability",
                    "description": "Use this function to check for checking availability in a calendar system. Ensure that start_time and end_time include time zone (in ISO 8601 format). All required fields must be provided when calling this function to avoid errors.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "calendar_id": {
                                "type": "string",
                                "description": "Unique identifier for the calendar where the appointment will be scheduled."
                            },
                            "start_time": {
                                "type": "string",
                                "description": "Start time in ISO 8601 format including the assistant's local time zone. Do NOT use UTC unless that's the assistant's zone.\n\nExamples:\n- For IST (India Standard Time): 2025-05-26T14:30:00+05:30\n- For Toronto (Eastern Time): 2025-05-26T09:00:00-04:00"
                            },
                            "end_time": {
                                "type": "string",
                                "description": "End time in ISO 8601 format including the assistant's local time zone. Do NOT use UTC unless that's the assistant's zone.\n\nExamples:\n- For IST: 2025-05-26T15:00:00+05:30\n- For Toronto: 2025-05-26T09:30:00-04:00"
                            }
                        },
                        "required": [
                            "start_time",
                            "end_time",
                            "calendar_id"
                        ]
                    },
                    "strict": false
                },
                "server": {
                    "url": "https://xeads-voice-assistant-922834411130.asia-south2.run.app/actionCall/availability",
                    "timeout_seconds": null,
                    "secret": null,
                    "headers": null,
                    "backoff_plan": null
                },
                "destinations": null,
                "knowledge_bases": null,
                "function_type": "check_availability",
                "notification": null,
                "async": false
            }
            if (viewEditActionId) {
                await updateActionApiRequest(viewEditActionId, payload,)
                toast.success("Availability updated successfully")
            }
            if (!viewEditActionId) {
                await createActionApiRequest(payload)
            }
            setBtnLoader(false)
        } catch (error) {
            console.log(error)
            setBtnLoader(false)
        } finally {
            getAllActionList()
            form.reset()
            setShowAvailabilityForm(false)
            setShowSubActions(false)
        }
    }

    const getActionById = async () => {
        try {
            const response = await getActionByIdApiRequest(viewEditActionId as string)
            setEditActionData(response?.data?.action)
            setNameBookingAppointment(response?.data?.action?.name)
            form.setValue("name", response?.data?.action?.name)
            form.setValue("description", response?.data?.action?.messages?.[0]?.content?.replace("Alright, Checking availability...", ""))
        } catch (error) {
            console.error('Error fetching action by id:', error);
        }
    }

    useEffect(() => {
        if (viewEditActionId) {
            getActionById()
        }
    }, [viewEditActionId])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
                <div className="">
                    <div className="flex items-center justify-between  pb-4  border-b border-gray-200">
                        <h2 className="text-xl font-semibold  text-gray-800">Availability</h2>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    isEdit = false
                                    setViewEditActionId("")
                                    setShowAvailabilityForm(false)
                                    router.push("/actions-management")
                                }}
                                className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                {btnLoader ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : null}
                                {viewEditActionId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-6 pt-6">
                        <div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => {
                                    return (
                                        <FormItem>
                                            <FormLabel>Action Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter action name" />
                                            </FormControl>
                                        </FormItem>
                                    )
                                }}
                            />
                        </div>

                        {/* <div className="grid grid-cols-3 gap-4">
                            <button
                                type="button"
                                disabled
                                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border-2 border-gray-200 transition-all duration-200 hover:border-indigo-300"
                            >
                                <FaClock className="text-indigo-600" />
                                Start Time
                            </button>
                            <button
                                disabled
                                type="button"
                                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border-2 border-gray-200 transition-all duration-200 hover:border-indigo-300"
                            >
                                <FaClock className="text-indigo-600" />
                                End Time
                            </button>
                            <button
                                disabled
                                type="button"
                                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border-2 border-gray-200 transition-all duration-200 hover:border-indigo-300"
                            >
                                <FaCalendarCheck className="text-indigo-600" />
                                Calendar ID
                            </button>
                        </div> */}

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                                Start Messages
                            </label>
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => {
                                        return (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Checking availability..." rows={4} />
                                                </FormControl>
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        </div>


                    </div>
                </div>
            </form>
        </Form>
    )
}

export default AvailabilityFormComponent
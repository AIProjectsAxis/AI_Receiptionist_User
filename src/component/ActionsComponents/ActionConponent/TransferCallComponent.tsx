'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/component/ui/form';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/component/common/select';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import { Phone } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '@/app/globals.css'; // Ensure global styles are loaded

interface Destination {
  number: string;
  message: string;
  extension: string;
  description: string;
  transferPlan: {
    mode: string;
  };
  numberE164CheckEnabled: boolean;

}
const e164Regex = /^\+[1-9]\d{1,14}$/;

const FormSchema = z.object({
  toolName: z.string().min(1, { message: "Tool name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  destination: z.object({
    number: z.string()
      .min(1, { message: "Number is required" })
      .regex(e164Regex, { message: 'Phone number must be in E.164 format (e.g., +1234567890)' }),
    message: z.string().optional(),
    extension: z.string().optional(),
    description: z.string().optional(),
    transferPlan: z.object({
      mode: z.string(),
    })
  })
})
const TransferCallComponent = ({ setShowTransferCallForm, getAllActionList, viewEditActionId, setViewEditActionId, isEdit }: { setShowTransferCallForm: (show: boolean) => void, getAllActionList: () => void, viewEditActionId: string, setViewEditActionId: (value: string) => void, isEdit: boolean }) => {
  const [btnLoader, setBtnLoader] = useState(false)

  const [destination, setDestination] = useState<Destination | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      toolName: '',
      description: '',
      destination: {
        number: '',
        message: '',
        extension: '',
        description: '',
        transferPlan: {
          mode: 'blind-transfer',
        },
       
      }
    }
  })

  const handleDestinationChange = (
    field: keyof Destination | 'transferPlan',
    value: string | boolean | { mode?: string; sipVerb?: string }
  ) => {
    if (!destination) return;

    const newDestination = { ...destination };
    if (field === 'transferPlan' && typeof value === 'object') {
      newDestination.transferPlan = {
        ...newDestination.transferPlan,
        ...value
      };
    } else if (field !== 'transferPlan') {
      (newDestination[field as keyof Destination] as any) = value;
    }
    setDestination(newDestination);
  };

  const addDestination = () => {
    setDestination({
      number: '',
      message: '',
      extension: '',
      description: '',
      transferPlan: {
        mode: 'blind-transfer',
      },
      numberE164CheckEnabled: true
    });
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setBtnLoader(true)
      const payload = {
        "type": "transferCall",
        "name": data.toolName,
        "function": {
          "name": "transfer_call_tool",
          "description": data.description,

        },

        "destinations": [
          {
            "type": "number",
            "number": data.destination.number,
            "message": data.destination.message,
            "description": data.destination.description,
            "transferPlan": {
              "mode": data.destination.transferPlan.mode,

            },
            "numberE164CheckEnabled": true
          }
        ]
      }

      if (viewEditActionId) {
        const res = await updateActionApiRequest(viewEditActionId as string, payload)
        toast.success("Transfer call updated successfully",{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
        getAllActionList();
      }
      else {
        const res = await createActionApiRequest(payload)
        toast.success("Transfer call created successfully",{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
        getAllActionList();
      }
      setShowTransferCallForm(false)
      setViewEditActionId("")
      form.reset()

    }
    catch (error) {
      console.error('Error saving transfer call:', error);
      toast.error('Failed to save transfer call',{
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
      setBtnLoader(false)
    }
  }

  const removeDestination = () => {
    setDestination(null);
  };

  const getTransferCallDetailsId = async () => {
    try {
      const res = await getActionByIdApiRequest(viewEditActionId as string);
      const actionData = res?.data?.action;

      form.reset({
        toolName: actionData?.name || '',
        description: actionData?.function?.description || '',
        destination: {
          number: actionData?.destinations?.[0]?.number || '',
          message: actionData?.destinations?.[0]?.message || '',
          description: actionData?.destinations?.[0]?.description || '',
          transferPlan: {
            mode: actionData?.destinations?.[0]?.transfer_plan?.mode || 'blind-transfer'
          },
          extension: '',
        }
      });

      // Also update destination state
      if (actionData?.destinations?.[0]) {
        setDestination({
          number: actionData.destinations[0].number || '',
          message: actionData.destinations[0].message || '',
          description: actionData.destinations[0].description || '',
          extension: '',
          transferPlan: {
            mode: actionData.destinations[0].transfer_plan?.mode || 'blind-transfer'
          },
          numberE164CheckEnabled: true
        });
      }

    } catch (error) {
      console.error('Error fetching transfer call data:', error);
    }
  }

  useEffect(() => {
    if (viewEditActionId) {
      getTransferCallDetailsId();
    }
  }, [viewEditActionId]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `.react-tel-input { width: 100% !important; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleClose = () => {
    setShowTransferCallForm(false);
    setViewEditActionId("");
    form.reset();
  };

  return (
    <div className="bg-white rounded-xl w-full  overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mt-2 pb-4  border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transfer Call Configuration</h2>
            <p className="text-sm text-gray-500">Configure your call transfer settings</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 ">
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
          >
            {btnLoader && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
            {viewEditActionId ? "Update" : "Create"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 px-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tool Name & Description */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${form.formState.errors.toolName ? 'text-red-600' : 'text-gray-700'}`}>Tool Name</label>
                <FormField
                  control={form.control}
                  name="toolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="text"
                          {...field}
                          placeholder="Enter Tool Name"
                          className={`w-full mt-1 px-4 py-2 rounded-lg border ${form.formState.errors.toolName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </FormControl>
                      {form.formState.errors.toolName && (
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.toolName.message as string}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${form.formState.errors.description ? 'text-red-600' : 'text-gray-700'}`}>Description</label>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the tool in a few sentences" className="w-full mt-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} />
                      </FormControl>
                      {form.formState.errors.description && (
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.description.message as string}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Destinations Section */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Call Transfer Destination</h3>
                  <p className="text-sm text-gray-500 mt-1">Configure where and how the call should be transferred</p>
                </div>
                {/* {!destination ? (
                  <button
                    onClick={addDestination}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#6D4AFF] text-white hover:bg-[#5a3ce0] text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Destination
                  </button>
                ) : (
                  <button
                    onClick={removeDestination}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    Remove Destination
                  </button>
                )} */}
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div> 
                    <label htmlFor="destination.number" className={`block text-sm font-medium mb-1 ${form.formState.errors.destination?.number ? 'text-red-600' : 'text-gray-700'}`}>Phone Number</label>
                    <FormField
                      control={form.control}
                      name="destination.number"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl className='w-full'>
                            <PhoneInput
                              country={'us'}
                              value={field.value}
                              onChange={value => field.onChange('+' + value.replace(/[^0-9]/g, ''))}
                              inputClass={`w-[90%] px-3 py-2 rounded-md border ${form.formState.errors.destination?.number ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              inputProps={{
                                name: field.name,
                                required: true,
                                autoFocus: false,
                                id: 'destination-number',
                              }}
                              specialLabel=""
                              inputStyle={{width: '100%'}}
                              enableSearch={true}
                              containerClass='w-full'
                            />
                          </FormControl>
                          {form.formState.errors.destination?.number && (
                            <p className="text-xs text-red-600 mt-1">
                              {form.formState.errors.destination.number.message as string}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Format: E.164 (e.g., +1234567890)</p>
                        </FormItem>
                      )}
                    />

                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message to Customer</label>
                    <FormField
                      control={form.control}
                      name="destination.message"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter Message"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </FormControl>
                          </FormItem>
                        )
                      }}
                    />

                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <FormField
                    control={form.control}
                    name="destination.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter Description"
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Transfer Settings */}
                {/* <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Transfer Settings</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Mode</label>
                      <FormField
                        control={form.control}
                        name="destination.transferPlan.mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                {...field}
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger className='w-full bg-white border-none focus:ring-0 focus:ring-offset-0'>
                                  <SelectValue placeholder="Select Transfer Mode" />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                  <SelectItem value="blind-transfer">Blind Transfer</SelectItem>
                                  <SelectItem value="attended-transfer">Attended Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                    </div>
                  </div>
                </div> */}

                {/* Additional Settings */}
                {/* E.164 checkbox removed, always enforced */}
              </div>

            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}

    </div>
  );
};

const Section = ({
  title,
  items,
  onAdd,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
}) => (
  <div className="border border-gray-200 rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#6D4AFF] text-white hover:bg-[#5a3ce0] text-sm"
      >
        <Plus className="w-4 h-4" /> Add {title.slice(0, -1)}
      </button>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-gray-500">No {title.toLowerCase()} configured.</p>
    ) : (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="px-4 py-2 bg-gray-50 text-gray-900 rounded-md text-sm">
            {item || `${title.slice(0, -1)} ${index + 1}`}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default TransferCallComponent;

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/component/ui/form';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import Button from '@/component/common/Button';
import { PhoneOff, X } from 'lucide-react';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';
import { toast } from 'react-toastify';

const FormSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  description: z.string().min(1, "Description is required"),
  messages: z.object({
    requestStart: z.string().min(1, "Request start message is required"),
    requestComplete: z.string().min(1, "Request complete message is required")
  })
});

type Props = {
  isEdit?: boolean;
  setViewEditActionId?: (id: string) => void;
  setShowEndCallForm?: (show: boolean) => void;
  getAllActionList?: () => void;
  viewEditActionId: string;
};

const EndCallComponent = ({ isEdit, setViewEditActionId, setShowEndCallForm, getAllActionList, viewEditActionId }: Props) => {

  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (setShowEndCallForm) {
      setShowEndCallForm(false);
      setViewEditActionId?.("");
      form.reset()
    }
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      toolName: "",
      description: "",
      messages: {
        requestStart: "Thank you for calling. Have a great day!",
        requestComplete: "Goodbye!"
      }
    }
  });

  const getEndCallData = async () => {
    try {
      const res = await getActionByIdApiRequest(viewEditActionId as string);
      const actionData = res?.data?.action;

      form.reset({
        toolName: actionData?.name || "",
        description: actionData?.function?.description || "",
        messages: {
          requestStart: actionData?.messages?.[0]?.content || "",
          requestComplete: actionData?.messages?.[1]?.content || ""
        }
      });
    } catch (error) {
      console.error('Error fetching end call data:', error);
      toast.error('Failed to fetch end call data',{
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
  };

  useEffect(() => {
    if (viewEditActionId) {
      getEndCallData();
    }
  }, [viewEditActionId]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    try {
      const payload = {
        "type": "endCall",
        "name": data.toolName,
        "async_": null,
        "messages": [
          {
            "contents": null,
            "content": data.messages.requestStart,
            "conditions": null,
            "type": "request-start",
            "blocking": true
          },
          {
            "contents": null,
            "content": data.messages.requestComplete,
            "conditions": null,
            "type": "request-complete",
            "role": "assistant",
            "end_call_after_spoken_enabled": true
          }
        ],
        "function": {
          "name": "end_call_tool",
          "description": data.description
        },
        "server": null,
        "destinations": null,
        "knowledge_bases": null,
        "function_type": null,
        "notification": null,
        "async": false
      };

      if (viewEditActionId) {
        const res = await updateActionApiRequest(viewEditActionId, payload);
        toast.success('End call tool updated successfully',{
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
        const res = await createActionApiRequest(payload);
        toast.success('End call tool created successfully',{
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

      getAllActionList?.();
      handleClose();


    } catch (error) {
      console.error('Error saving end call tool:', error);
      toast.error('Failed to save end call tool',{
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
      setLoading(false);
    }
  };

  return (
    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg w-full">
          <div className="flex justify-between items-center mt-2 pb-4  border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">End Call Configuration</h2>
            </div>
            <div className="flex justify-end  gap-3 ">
              <button
                className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                type="button"

                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                disabled={loading}
              >
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
                {viewEditActionId ? "Update" : "Create"}
              </button>
            </div>
          </div>

          <div>

            {/* Basic Information */}
            <div className="space-y-4 mt-6 px-1">
              <FormField
                control={form.control}
                name="toolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter tool name" />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter description" />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />
            </div>

            {/* Messages Configuration */}
            <div className="space-y-2 mt-6 px-1">
              <h3 className="text-lg font-medium">Messages</h3>

              <FormField
                control={form.control}
                name="messages.requestStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Start Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter request start message" />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="messages.requestComplete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Complete Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter request complete message" />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />
            </div>


          </div>
        </div>
      </form>
    </Form>
  );
};

export default EndCallComponent;
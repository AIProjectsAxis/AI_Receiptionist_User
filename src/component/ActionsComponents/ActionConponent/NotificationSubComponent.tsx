import React, { useState, useEffect } from 'react';
import Card from '../../common/Card';
import { IoNotificationsOutline, IoMailOutline, IoPhonePortraitOutline } from 'react-icons/io5';
import { FiPlusCircle, FiMinusCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { HiOutlineSpeakerphone } from 'react-icons/hi';
import { MdOutlineGroupAdd, MdOutlineDescription } from 'react-icons/md';
import { BsEnvelopeAt, BsChatDots } from 'react-icons/bs';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/component/ui/form'
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import {createRoot} from 'react-dom/client'
import Markdown from 'react-markdown'

import { createActionApiRequest, getActionByIdApiRequest, getCalendarListApiRequest, updateActionApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';


type Props = {
  isEdit: boolean;
  setViewEditActionId: (value: string) => void;
  setShowNotificationForm: (value: boolean) => void;
  getAllActionList: () => void;
  viewEditActionId: string;
  folderList: any[];
};

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface Calendar {
  id: string;
  name: string;
  type: string;
  status: string;
  provider_id: string;
  email: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

interface CalendarResponse {
  calendars: Calendar[];
}

const FormSchema = z.object({
  actionTitle: z.string().min(1, { message: "Action title is required" }),
  actionDescription: z.string().min(1, { message: "Action description is required" }),
  silentNotification: z.boolean(),
  emailRecipients: z.array(z.string()),
  smsRecipients: z.array(z.string()),
  emailSubjects: z.array(z.string()),
  emailContents: z.array(z.string()),
  smsContents: z.array(z.string()),
  cc: z.array(z.array(z.string())), // Array of arrays for CC
  recipients_email: z.array(z.string()),
  recipients_phone: z.array(z.string())
  
});

interface NotificationFormData {
  emailRecipients: string[];
  smsRecipients: string[];
  emailSubjects: string[];
  emailContents: string[];
  smsContents: string[];
  cc: string[][]; // Array of arrays for CC
  recipients_email: string[];
  recipients_phone: string[];
}

const NotificationSubComponent = ({ isEdit, setViewEditActionId, setShowNotificationForm, getAllActionList, viewEditActionId, folderList }: Props) => {
  const [notificationData, setNotificationData] = useState<NotificationFormData>({
    emailRecipients: [''],
    smsRecipients: [''],
    emailSubjects: [''],
    emailContents: [''],
    smsContents: [''],
    cc: [['']], // Array of arrays for CC
    recipients_email: [''],
    recipients_phone: ['']
  });
  const [ccFields, setCcFields] = useState<{ [key: number]: string[] }>({ 0: [''] }); // Track CC fields for each group
  const router = useRouter()
  const [editActionData, setEditActionData] = useState<any>(null)
  const [btnLoader, setBtnLoader] = useState(false)
  const [activeContactMethods, setActiveContactMethods] = useState<{ [key: number]: 'ask' | 'custom' }>({});
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: number]: boolean }>({});
  const [notificationChannels, setNotificationChannels] = useState<{ [key: number]: { email: boolean, sms: boolean } }>({});
  const [calendarList, setCalendarList] = useState<Calendar[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [showVariableDropdown, setShowVariableDropdown] = useState<{ [key: string]: boolean }>({});
  const [activeTextarea, setActiveTextarea] = useState<{ field: string; index: number; cursorPosition: number } | null>(null);
  const [showCustomDropdown, setShowCustomDropdown] = useState<{ [key: string]: boolean }>({});
  const [emailDisplayMode, setEmailDisplayMode] = useState<{ [key: number]: 'edit' | 'preview' | 'split' }>({});

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      actionTitle: isEdit ? editActionData?.name : "",
      actionDescription: isEdit ? editActionData?.function?.description : "",
      silentNotification: false,
      emailRecipients: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.name) : [""],
      smsRecipients: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.name) : [""],
      emailSubjects: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.email_subject) : [""],
      emailContents: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.email_template) : [""],
      smsContents: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.sms_template) : [""],
              cc: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.email_cc ? group.email_cc : []) : [[]],
      recipients_email: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.email) : [""],
      recipients_phone: isEdit ? editActionData?.notification?.notification_groups?.map((group: any) => group.phone_number) : [""]
    }
  });

  useEffect(() => {
    if (isEdit && editActionData) {
      // Set basic form values
      form.setValue('actionTitle', editActionData.name || '');
      form.setValue('actionDescription', editActionData.function?.description || '');

      // Handle notification groups
      if (editActionData.notification?.notification_groups) {
        const groups = editActionData.notification.notification_groups;

        // Set notification data state
        setNotificationData({
          emailRecipients: groups.map((group: any) => group.name || ''),
          smsRecipients: groups.map((group: any) => group.name || ''),
          emailSubjects: groups.map((group: any) => group.email_subject || ''),
          emailContents: groups.map((group: any) => group.email_template || ''),
          smsContents: groups.map((group: any) => group.sms_template || ''),
          cc: groups.map((group: any) => group.email_cc ? group.email_cc : []),
          recipients_email: groups.map((group: any) => group.email || ''),
          recipients_phone: groups.map((group: any) => group.phone_number || '')
        });

        // Set form values for notification groups
        form.setValue('emailRecipients', groups.map((group: any) => group.name || ''));
        form.setValue('smsRecipients', groups.map((group: any) => group.name || ''));
        form.setValue('emailSubjects', groups.map((group: any) => group.email_subject || ''));
        form.setValue('emailContents', groups.map((group: any) => group.email_template || ''));
        form.setValue('smsContents', groups.map((group: any) => group.sms_template || ''));
        form.setValue('cc', groups.map((group: any) => group.email_cc ? group.email_cc : []));
        form.setValue('recipients_email', groups.map((group: any) => group.email || ''));
        form.setValue('recipients_phone', groups.map((group: any) => group.phone_number || ''));


        // Set contact methods and notification channels
        const methods: { [key: number]: 'ask' | 'custom' } = {};
        const channels: { [key: number]: { email: boolean, sms: boolean } } = {};

        groups.forEach((group: any, index: number) => {
          methods[index] = group.is_user_group ? 'ask' : 'custom';
          channels[index] = {
            email: group.email_notification || false,
            sms: group.sms_notification || false
          };
        });

        setActiveContactMethods(methods);
        setNotificationChannels(channels);
      }
    }
  }, [isEdit, editActionData, form]);

  useEffect(() => {
    if (!notificationData.emailRecipients?.length) {
      setNotificationData({
        ...notificationData,
        emailRecipients: [""],
        smsRecipients: [""],
        cc: [[]],
        recipients_email: [""],
        recipients_phone: [""]
      });
    }
  }, []);

  const listCalendar = async () => {
    try {
      const response = await getCalendarListApiRequest();
      if (response?.data?.calendars) {
        setCalendarList(response.data.calendars);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
      toast.error("Failed to load calendars",{
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
    listCalendar();
  }, []);

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      setBtnLoader(true)
      const notificationGroups = values.emailRecipients.map((_, index) => {
        const group = {
          id: `group_${Math.random().toString(36).substr(2, 9)}`,
          name: values.emailRecipients[index] || `Notification Group ${index + 1}`,
          is_user_group: activeContactMethods[index] === 'ask',
          email_notification: notificationChannels[index]?.email || false,
          email_subject: notificationChannels[index]?.email ? values.emailSubjects[index] || "" : null,
          email_cc: notificationChannels[index]?.email ? (ccFields[index] || []).filter(email => email && email.trim() !== '') : null,
          sms_notification: notificationChannels[index]?.sms || false,
          email_template: notificationChannels[index]?.email ? values.emailContents[index] || "" : null,
          sms_template: notificationChannels[index]?.sms ? values.smsContents[index] || "" : null,
          email: activeContactMethods[index] === 'custom' && notificationChannels[index]?.email ? values.recipients_email[index] : null,
          phone_number: activeContactMethods[index] === 'custom' && notificationChannels[index]?.sms ? values.recipients_phone[index] : null
        };
        return group;
      });

      const payload = {
        "type": "function",
        "function_type": "notification",
        "name": values.actionTitle,
        "async_": null,
        "messages": [
          {
            "contents": null,
            "content": "Alright, I'm sending you a quick message now with all the details. Just give me a moment.",
            "conditions": null,
            "type": "request-start",
            "blocking": true
          },
          {
            "contents": null,
            "content": "Got it! I've sent the message—please check your phone.",
            "conditions": null,
            "type": "request-complete",
            "role": null,
            "end_call_after_spoken_enabled": false
          },
          {
            "contents": null,
            "content": "One moment please, your message is being processed.",
            "conditions": null,
            "type": "request-failed",
            "end_call_after_spoken_enabled": true
          }
        ],
        "function": {
          "name": "notification_tool",
          "description": values.actionDescription,
          "parameters": buildParametersObject(),
          "strict": false
        },
        "server": {
          "url": "https://api.eccentricai.ca/api/v1/webhook/tool/notification/bde4c9bf-4cfb-4d09-815f-6d484c46983b",
          "timeout_seconds": null,
          "secret": null,
          "headers": null,
          "backoff_plan": null
        },
        "config": null,
        "notification": {
          "id": isEdit ? editActionData?.notification?.id : null,
          "notification_groups": notificationGroups
        },
        "folder_id": null
      };

      if (viewEditActionId) {
        await updateActionApiRequest(viewEditActionId as string, payload)
        toast.success("Notification updated successfully",{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowNotificationForm(false)
        setViewEditActionId("")
        form.reset()
        getAllActionList();
      } else {
        const response = await createActionApiRequest(payload);
        const res = response.data as ApiResponse;
        console.log("res---", res);


        if (res) {
          toast.success("Notification created successfully",{
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          setShowNotificationForm(false);
          getAllActionList();
          setViewEditActionId("")
          form.reset()
        } else {
          toast.error("Failed to create notification",{
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

      }
    } catch (error) {
      console.error("Error preparing notification data:", error);
      toast.error("Failed to create notification",{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } finally {
      setBtnLoader(false)
    }
  };

  const handleContactChange = (index: number, method: 'ask' | 'custom') => {
    setActiveContactMethods((prev) => ({ ...prev, [index]: method }));
  };

  const handleAddNotificationGroup = () => {
    const newIndex = notificationData.emailRecipients.length;
    setNotificationData({
      ...notificationData,
      emailRecipients: [...notificationData.emailRecipients, ""],
      smsRecipients: [...notificationData.smsRecipients, ""],
      cc: [...notificationData.cc, []],
      recipients_email: [...notificationData.recipients_email, ""],
      recipients_phone: [...notificationData.recipients_phone, ""]
    });

    setNotificationChannels(prev => ({
      ...prev,
      [newIndex]: { email: false, sms: false }
    }));
  };

  const toggleGroupCollapse = (index: number) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleChannel = (index: number, channel: 'email' | 'sms') => {
    setNotificationChannels(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [channel]: !prev[index]?.[channel]
      }
    }));
  };

  const getActionById = async () => {
    try {
      const response = await getActionByIdApiRequest(viewEditActionId as string)
      const actionData = response?.data?.action;
      setEditActionData(actionData);

      if (actionData) {
        // Set notification data state
        const groups = actionData.notification?.notification_groups || [];
        setNotificationData({
          emailRecipients: groups.map((group: any) => group.name || ''),
          smsRecipients: groups.map((group: any) => group.name || ''),
          emailSubjects: groups.map((group: any) => group.email_subject || ''),
          emailContents: groups.map((group: any) => group.email_template || ''),
          smsContents: groups.map((group: any) => group.sms_template || ''),
          cc: groups.map((group: any) => group.email_cc ? [group.email_cc] : []),
          recipients_email: groups.map((group: any) => group.email || ''),
          recipients_phone: groups.map((group: any) => group.phone_number || '')
        });

        // Set contact methods and notification channels
        const methods: { [key: number]: 'ask' | 'custom' } = {};
        const channels: { [key: number]: { email: boolean, sms: boolean } } = {};

        groups.forEach((group: any, index: number) => {
          methods[index] = group.is_user_group ? 'ask' : 'custom';
          channels[index] = {
            email: group.email_notification || false,
            sms: group.sms_notification || false
          };
        });

        setActiveContactMethods(methods);
        setNotificationChannels(channels);
      }
    } catch (error) {
      console.error('Error fetching action by id:', error);
    }
  }

  // Add new useEffect to handle form values when editActionData changes
  useEffect(() => {
    if (editActionData) {
      // Set basic form values
      form.reset({
        actionTitle: editActionData.name || '',
        actionDescription: editActionData.function?.description || '',
        silentNotification: false,
        emailRecipients: editActionData.notification?.notification_groups?.map((group: any) => group.name || '') || [''],
        smsRecipients: editActionData.notification?.notification_groups?.map((group: any) => group.name || '') || [''],
        emailSubjects: editActionData.notification?.notification_groups?.map((group: any) => group.email_subject || '') || [''],
        emailContents: editActionData.notification?.notification_groups?.map((group: any) => group.email_template || '') || [''],
        smsContents: editActionData.notification?.notification_groups?.map((group: any) => group.sms_template || '') || [''],
        cc: editActionData.notification?.notification_groups?.map((group: any) => group.email_cc ? [group.email_cc] : []) || [[]],
        recipients_email: editActionData.notification?.notification_groups?.map((group: any) => group.email || '') || [''],
        recipients_phone: editActionData.notification?.notification_groups?.map((group: any) => group.phone_number || '') || ['']
      });

      // Set notification channels based on email_notification and sms_notification
      const groups = editActionData.notification?.notification_groups || [];
      const channels: { [key: number]: { email: boolean, sms: boolean } } = {};
      const methods: { [key: number]: 'ask' | 'custom' } = {};

      groups.forEach((group: any, index: number) => {
        // Set channels based on email_notification and sms_notification
        channels[index] = {
          email: Boolean(group.email_notification),
          sms: Boolean(group.sms_notification)
        };

        // Set contact method based on is_user_group
        methods[index] = group.is_user_group ? 'ask' : 'custom';

        // If email is enabled but no subject/content, set empty strings
        if (channels[index].email) {
          form.setValue(`emailSubjects.${index}`, group.email_subject || '');
          form.setValue(`emailContents.${index}`, group.email_template || '');
                                                  form.setValue(`cc.${index}`, group.email_cc ? group.email_cc : []);
        // Initialize CC fields for this group
        setCcFields(prev => ({
          ...prev,
          [index]: group.email_cc ? group.email_cc : ['']
        }));
          if (methods[index] === 'custom') {
            form.setValue(`recipients_email.${index}`, group.email || '');
          }
        }

        // If SMS is enabled but no content, set empty string
        if (channels[index].sms) {
          form.setValue(`smsContents.${index}`, group.sms_template || '');
          if (methods[index] === 'custom') {
            form.setValue(`recipients_phone.${index}`, group.phone_number || '');
          }
        }
      });

      // Update the notification channels and contact methods state
      setNotificationChannels(channels);
      setActiveContactMethods(methods);
    }
  }, [editActionData, form]);

  useEffect(() => {
    if (viewEditActionId) {
      getActionById()
    }
  }, [viewEditActionId])

  const handleClose = () => {
    setShowNotificationForm(false);
    setViewEditActionId("");
    form.reset();
  };

  // Handle folder selection for variables
  const handleFolderSelect = (folder: any) => {
    setSelectedFolder(folder);
  };

  // Handle textarea focus to track cursor position
  const handleTextareaFocus = (field: string, index: number, event: React.FocusEvent<HTMLTextAreaElement>) => {
    const cursorPosition = event.target.selectionStart;
    setActiveTextarea({ field, index, cursorPosition });
  };

  // Handle textarea click to update cursor position
  const handleTextareaClick = (field: string, index: number, event: React.MouseEvent<HTMLTextAreaElement>) => {
    const cursorPosition = event.currentTarget.selectionStart;
    setActiveTextarea({ field, index, cursorPosition });
  };

  // Handle textarea input to track cursor position in real-time
  const handleTextareaInput = (field: string, index: number, event: React.FormEvent<HTMLTextAreaElement>) => {
    const cursorPosition = (event.target as HTMLTextAreaElement).selectionStart;
    setActiveTextarea({ field, index, cursorPosition });
  };

  // Handle textarea keyup to track cursor position after arrow keys, etc.
  const handleTextareaKeyUp = (field: string, index: number, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const cursorPosition = event.currentTarget.selectionStart;
    setActiveTextarea({ field, index, cursorPosition });
  };

  // Handle variable insertion
  const insertVariable = (variableName: string, field: 'emailContents' | 'smsContents', index: number) => {
    const currentValue = form.getValues(`${field}.${index}` as any) || '';
    const cursorPos = activeTextarea?.cursorPosition || 0;
    
    // Insert variable at cursor position with single curly braces
    const newValue = (currentValue as string).slice(0, cursorPos) + `{${variableName}}` + (currentValue as string).slice(cursorPos);
    form.setValue(`${field}.${index}` as any, newValue);
    
    // Update cursor position after insertion
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[name="${field}.${index}"]`) as HTMLTextAreaElement;
      if (textarea) {
        const newCursorPos = cursorPos + variableName.length + 2; // +2 for {}
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }
    }, 10);
    
    setShowVariableDropdown(prev => ({ ...prev, [`${field}-${index}`]: false }));
  };

  // Function to extract variables from content
  const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      variables.push(match[1]);
    }
    
    return variables;
  };

  // Function to get all variables from all content fields
  const getAllVariablesFromContent = (): string[] => {
    const allVariables: string[] = [];
    
    // Get variables from email contents
    const emailContents = form.getValues('emailContents') || [];
    emailContents.forEach((content: string) => {
      if (content) {
        allVariables.push(...extractVariablesFromContent(content));
      }
    });
    
    // Get variables from SMS contents
    const smsContents = form.getValues('smsContents') || [];
    smsContents.forEach((content: string) => {
      if (content) {
        allVariables.push(...extractVariablesFromContent(content));
      }
    });
    
    return allVariables;
  };

  // Function to build parameters object based on variables used in content
  const buildParametersObject = () => {
    const allVariables = getAllVariablesFromContent();
    const uniqueVariables = [...new Set(allVariables)];
    
    const parameters: any = {
      "type": "object",
      "properties": {
        // Always include phone_number and email
        "phone_number": {
          "type": "string",
          "description": "Ask phone number from user during the call for SMS",
          "enum": null
        },
        "email": {
          "type": "string",
          "description": "Ask email from the user during the call",
          "enum": null
        }
      },
      "required": ["phone_number", "email"] 
    };
    
    uniqueVariables.forEach(variableName => {
      // Skip if it's already phone_number or email (to avoid duplicates)
      if (variableName === 'phone_number' || variableName === 'email') {
        return;
      }
      
      // Find the variable definition from folderList
      let variableDefinition = null;
      
      for (const folder of folderList) {
        if (folder.properties && folder.properties[variableName]) {
          variableDefinition = folder.properties[variableName];
          break;
        }
      }
      
      if (variableDefinition) {
        parameters.properties[variableName] = variableDefinition;
        parameters.required.push(variableName);
      } else {
        // Fallback for variables not found in folders
        parameters.properties[variableName] = {
          "type": "string",
          "description": `Variable: ${variableName}`,
          "enum": null
        };
        parameters.required.push(variableName);
      }
    });
    
    return parameters;
  };

  // Get cursor position indicator text
  const getCursorPositionText = (field: 'emailContents' | 'smsContents', index: number) => {
    const currentValue = form.getValues(`${field}.${index}` as any) || '';
    const cursorPos = activeTextarea?.cursorPosition || 0;
    
    if (cursorPos === 0) return "at the beginning";
    if (cursorPos === (currentValue as string).length) return "at the end";
    
    const beforeCursor = (currentValue as string).slice(0, cursorPos);
    const afterCursor = (currentValue as string).slice(cursorPos);
    
    return `after "${beforeCursor.slice(-20)}"`;
  };

  // Toggle variable dropdown
  const toggleVariableDropdown = (field: 'emailContents' | 'smsContents', index: number) => {
    setShowVariableDropdown(prev => ({ 
      ...prev, 
      [`${field}-${index}`]: !prev[`${field}-${index}`] 
    }));
  };

  // Toggle custom dropdown
  const toggleCustomDropdown = (field: 'emailContents' | 'smsContents', index: number) => {
    setShowCustomDropdown(prev => ({ 
      ...prev, 
      [`${field}-${index}`]: !prev[`${field}-${index}`] 
    }));
  };

  // Handle custom variable selection
  const handleCustomVariableSelect = (variableName: string, field: 'emailContents' | 'smsContents', index: number) => {
    insertVariable(variableName, field, index);
    setShowCustomDropdown(prev => ({ ...prev, [`${field}-${index}`]: false }));
  };

  // Watch for content changes to update parameters dynamically
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Check if the change is in emailContents or smsContents
      if (name && (name.startsWith('emailContents') || name.startsWith('smsContents'))) {
        // Parameters will be built dynamically when form is submitted
        // This ensures parameters are always up-to-date with content
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Add new CC field
  const addCcField = (groupIndex: number) => {
    const newCcFields = {
      ...ccFields,
      [groupIndex]: [...(ccFields[groupIndex] || []), '']
    };
    setCcFields(newCcFields);
  };

  // Remove CC field
  const removeCcField = (groupIndex: number, ccIndex: number) => {
    const newCcFields = {
      ...ccFields,
      [groupIndex]: (ccFields[groupIndex] || []).filter((_, index) => index !== ccIndex)
    };
    setCcFields(newCcFields);
    
    // Update form value
    const filteredEmails = newCcFields[groupIndex]?.filter(email => email.trim() !== '') || [];
    form.setValue(`cc.${groupIndex}`, filteredEmails);
  };

  // Update CC field value
  const updateCcField = (groupIndex: number, ccIndex: number, value: string) => {
    const newCcFields = {
      ...ccFields,
      [groupIndex]: (ccFields[groupIndex] || []).map((email, index) => 
        index === ccIndex ? (value || '') : (email || '')
      )
    };
    setCcFields(newCcFields);
    
    // Update form value
    const filteredEmails = newCcFields[groupIndex]?.filter(email => email.trim() !== '') || [];
    form.setValue(`cc.${groupIndex}`, filteredEmails);
  };

  
  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between mt-2 pb-4  border-b border-gray-200">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Notification</h2>
            <p className="text-sm text-gray-500">Configure your notification settings</p>
          </div>
        </div>
          <div className="flex items-center justify-end gap-3 ">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              <div className="space-y-4 bg-white rounded-xl backdrop-blur-sm ">
                <div>
                  <label className=" text-sm font-medium mb-2 flex items-center gap-1">
                    Action Title<span className='text-red-500'>*</span>
                  </label>
                  <FormField
                    control={form.control}
                    name="actionTitle"
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            required
                            placeholder="Enter action title"
                            className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                          />
                        </FormControl>

                      </FormItem>
                    )}
                  />

                </div>

                <div>
                  <label className=" text-sm font-medium mb-2 flex items-center gap-1">
                    Action Description<span className='text-red-500'>*</span>
                  </label>
                  <FormField
                    control={form.control}
                    name="actionDescription"
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormControl>
                          <Textarea
                            {...field}
                            required
                            placeholder="Enter action description"
                            className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 h-24"
                          />
                        </FormControl>

                      </FormItem>
                    )}
                  />
                </div>

                <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="relative">
                    <input type="checkbox" id="silentNotification" className="peer sr-only" />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-sm font-medium">Send notifications silently</span>
                </label>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <IoMailOutline className="text-xl text-indigo-600" />
                <h3 className="text-lg font-semibold">Notification Channels</h3>
              </div>

              {notificationData.emailRecipients.map((_: any, index: number) => (
                <div key={index} className="bg-white/50 backdrop-blur-sm p-6 rounded-xl space-y-5 border-2 border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <FormField
                      control={form.control}
                      name={`emailRecipients.${index}`}
                      render={({ field }) => (
                        <FormItem className='w-full'>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                              placeholder={` Notification Group ${index + 1}`}
                              className="text-lg font-medium bg-transparent border-b-2 w-full border-gray-200 focus:border-indigo-600 focus:outline-none px-2 py-1"
                            />
                          </FormControl>

                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(index)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition-colors"
                      >
                        {collapsedGroups[index] ? <FiChevronDown className="text-xl" /> : <FiChevronUp className="text-xl" />}
                        {collapsedGroups[index] ? 'Expand' : 'Collapse'}
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRecipients = [...notificationData.emailRecipients];
                            newRecipients.splice(index, 1);
                            setNotificationData({ ...notificationData, emailRecipients: newRecipients });

                            const newChannels = { ...notificationChannels };
                            delete newChannels[index];
                            setNotificationChannels(newChannels);
                          }}
                          className="text-red-500 hover:text-red-700 flex items-center gap-2 transition-colors"
                        >
                          <FiMinusCircle />
                        </button>
                      )}
                    </div>
                  </div>

                  {!collapsedGroups[index] && (
                    <>
                      {/* Contact Method Selection */}
                      <div className="flex gap-6 bg-gray-50 p-4 rounded-xl">
                        <label className="flex items-center  gap-3 cursor-pointer">

                          <input
                            type="radio"
                            name={`contactMethod-${index}`}
                            checked={activeContactMethods[index] === 'ask'}
                            onChange={() => handleContactChange(index, 'ask')}
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="text-sm font-medium">Ask from User During Call</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`contactMethod-${index}`}
                            checked={activeContactMethods[index] === 'custom'}
                            onChange={() => handleContactChange(index, 'custom')}
                            className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="text-sm font-medium">Use Custom Contact Info</span>
                        </label>
                      </div>
                      <div className='flex gap-5'>
                        <button
                          onClick={() => toggleChannel(index, 'email')}
                          type='button'
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-md transition-all duration-200 ${notificationChannels[index]?.email
                            ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <BsEnvelopeAt className={`text-lg ${notificationChannels[index]?.email ? 'text-indigo-600' : 'text-gray-500'}`} />
                          <span className="text-sm font-medium">Send Email</span>
                        </button>

                        <button
                          onClick={() => toggleChannel(index, 'sms')}
                          type='button'
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-md transition-all duration-200 ${notificationChannels[index]?.sms
                            ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <IoPhonePortraitOutline className={`text-lg ${notificationChannels[index]?.sms ? 'text-indigo-600' : 'text-gray-500'}`} />
                          <span className="text-sm font-medium">Send SMS</span>
                        </button>
                      </div>

                      {/* Email + SMS Form */}
                      <div className="space-y-6">
                        {/* Email Notification */}
                        {notificationChannels[index]?.email &&
                          <Card className="bg-white/70 backdrop-blur-sm border-2 border-gray-100 p-6 rounded-xl transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center gap-2 mb-4">
                              <BsEnvelopeAt className="text-xl text-indigo-600" />
                              <h4 className="font-semibold">Email Notification</h4>
                            </div>
                            <FormField
                              control={form.control}
                              name={`emailSubjects.${index}`}
                              render={({ field }) => (
                                <FormItem className='w-full'>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || ''}
                                      placeholder="Email Subject *"
                                      className="w-full rounded-lg border-2 px-4 py-3 mt-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                                    />
                                  </FormControl>

                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`emailContents.${index}`}
                              render={({ field }) => (
                                <FormItem className='w-full mt-5'>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Email Content <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                      <button
                                        type="button"
                                        onClick={() => setEmailDisplayMode(prev => ({ ...prev, [index]: 'edit' }))}
                                        className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                                          emailDisplayMode[index] === 'edit'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="Edit Mode"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEmailDisplayMode(prev => ({ ...prev, [index]: 'preview' }))}
                                        className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                                          emailDisplayMode[index] === 'preview'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="Preview Mode"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEmailDisplayMode(prev => ({ ...prev, [index]: 'split' }))}
                                        className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                                          emailDisplayMode[index] === 'split'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                        title="Split View"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                        </svg>
                                        Split
                                      </button>
                                    </div>
                                  </div>
                                  <FormControl>
                                    {emailDisplayMode[index] === 'preview' ? (
                                      <div className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 bg-white min-h-[200px] max-h-[400px] overflow-y-auto">
                                        {field.value ? (
                                          <div className="markdown-preview">
                                            <Markdown
                                              components={{
                                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-2 mt-4" {...props} />,
                                                h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-3" {...props} />,
                                                h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                                p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                                em: ({node, ...props}) => <em className="italic" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-4" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-4" {...props} />,
                                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                                                a: ({node, ...props}) => <a className="text-indigo-600 hover:underline" {...props} />,
                                              }}
                                            >
                                              {field.value}
                                            </Markdown>
                                          </div>
                                        ) : (
                                          <p className="text-gray-400 italic">No content to preview. Start typing to see the markdown preview.</p>
                                        )}
                                      </div>
                                    ) : emailDisplayMode[index] === 'split' ? (
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="border-2 border-gray-200 rounded-lg">
                                          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span className="text-xs font-medium text-gray-600">Edit</span>
                                          </div>
                                          <Textarea
                                            {...field}
                                            value={field.value || ''}
                                            placeholder="Email Content *"
                                            className="w-full rounded-b-lg border-0 px-4 py-3 focus:ring-0 focus:outline-none min-h-[200px] max-h-[400px] font-mono text-sm resize-none"
                                            onFocus={(e) => handleTextareaFocus('emailContents', index, e)}
                                            onClick={(e) => handleTextareaClick('emailContents', index, e)}
                                            onInput={(e) => handleTextareaInput('emailContents', index, e)}
                                            onKeyUp={(e) => handleTextareaKeyUp('emailContents', index, e)}
                                          />
                                        </div>
                                        <div className="border-2 border-gray-200 rounded-lg">
                                          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="text-xs font-medium text-gray-600">Preview</span>
                                          </div>
                                          <div className="px-4 py-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                                            {field.value ? (
                                              <div className="markdown-preview">
                                                <Markdown
                                                  components={{
                                                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-2 mt-4" {...props} />,
                                                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-3" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                                    p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                                    em: ({node, ...props}) => <em className="italic" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 ml-4" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 ml-4" {...props} />,
                                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                    code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                                                    a: ({node, ...props}) => <a className="text-indigo-600 hover:underline" {...props} />,
                                                  }}
                                                >
                                                  {field.value}
                                                </Markdown>
                                              </div>
                                            ) : (
                                              <p className="text-gray-400 italic text-sm">Preview will appear here...</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Textarea
                                          {...field}
                                          value={field.value || ''}
                                          placeholder="Email Content&#10;Example:&#10;**Bold text**&#10;*Italic text*&#10;# Heading&#10;- List item"
                                          className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 min-h-[200px] font-mono text-sm"
                                          onFocus={(e) => handleTextareaFocus('emailContents', index, e)}
                                          onClick={(e) => handleTextareaClick('emailContents', index, e)}
                                          onInput={(e) => handleTextareaInput('emailContents', index, e)}
                                          onKeyUp={(e) => handleTextareaKeyUp('emailContents', index, e)}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          💡 Tip: Use Markdown syntax for formatting (**, *, #, -, etc.)
                                        </p>
                                      </>
                                    )}
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                                                        {/* Variable Selector for Email Content */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between">

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => toggleCustomDropdown('emailContents', index)}
                                    className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between min-w-[140px]"
                                  >
                                    <span className="text-gray-500">+ Add Variable</span>
                                    <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                                                      {showCustomDropdown[`emailContents-${index}`] && (
                                      <div className="absolute bottom-full -left-10 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                        <div className="p-2">
                                          {folderList.map((folder) => (
                                            <div key={folder.id} className="mb-2">
                                              <div className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-50 rounded">
                                                {folder.is_default ? '📁 Default Variables' : `📁 ${folder.name}`}
                                              </div>
                                              <div className="ml-2">
                                                {Object.keys(folder.properties || {}).map((variableName) => (
                                                  <button
                                                    key={`${folder.id}-${variableName}`}
                                                    type="button"
                                                    onClick={() => handleCustomVariableSelect(variableName, 'emailContents', index)}
                                                    className="w-full text-left text-xs px-2 py-1 hover:bg-indigo-50 rounded text-gray-900 cursor-pointer"
                                                  >
                                                    {variableName}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                                <label className="text-sm font-medium text-gray-700">
                                Use only dropdown variables for dynamic content.
                              </label>
                              </div>
                            </div>
                            {activeContactMethods[index] === 'custom' && (
                              <>
                                <FormField
                                  control={form.control}
                                  name={`recipients_email.${index}`}
                                  render={({ field }) => (
                                    <FormItem className='w-full'>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Recipient Email *"
                                          required
                                          className="w-full rounded-lg border-2 px-4 py-3 mt-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                                        />
                                      </FormControl>

                                    </FormItem>
                                  )}
                                />
                                <div className="w-full mt-3">
                                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    CC Recipients
                                  </label>
                                  <div className="space-y-2">
                                    {(ccFields[index] || ['']).map((ccEmail, ccIndex) => (
                                      <div key={ccIndex} className="flex items-center gap-2">
                                        <Input
                                          value={ccEmail || ''}
                                          onChange={(e) => updateCcField(index, ccIndex, e.target.value)}
                                          placeholder="CC email address"
                                          type="email"
                                          className="flex-1 rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                                        />
                                        {(ccFields[index] || []).length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeCcField(index, ccIndex)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove CC"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => addCcField(index)}
                                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                      Add CC
                                    </button>
                                  </div>

                                </div>
                              </>
                            )}
                          </Card>}

                        {/* SMS Notification */}
                        {notificationChannels[index]?.sms && <Card className="bg-white/70 backdrop-blur-sm border-2 border-gray-100 p-6 rounded-xl transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-2 mb-4">
                            <IoPhonePortraitOutline className="text-xl text-indigo-600" />
                            <h4 className="font-semibold">SMS Notification</h4>
                          </div>
                          <FormField
                            control={form.control}
                            name={`smsContents.${index}`}
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value || ''}
                                    placeholder="SMS Message *"
                                    className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 h-24"
                                    onFocus={(e) => handleTextareaFocus('smsContents', index, e)}
                                    onClick={(e) => handleTextareaClick('smsContents', index, e)}
                                    onInput={(e) => handleTextareaInput('smsContents', index, e)}
                                    onKeyUp={(e) => handleTextareaKeyUp('smsContents', index, e)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {/* Variable Selector for SMS Content */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between">
                             
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => toggleCustomDropdown('smsContents', index)}
                                  className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-between min-w-[140px]"
                                >
                                  <span className="text-gray-500">+ Add Variable</span>
                                  <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                
                                {showCustomDropdown[`smsContents-${index}`] && (
                                  <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    <div className="p-2">
                                      {folderList.map((folder) => (
                                        <div key={folder.id} className="mb-2">
                                          <div className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-50 rounded">
                                            {folder.is_default ? '📁 Default Variables' : `📁 ${folder.name}`}
                                          </div>
                                          <div className="ml-2">
                                            {Object.keys(folder.properties || {}).map((variableName) => (
                                              <button
                                                key={`${folder.id}-${variableName}`}
                                                type="button"
                                                onClick={() => handleCustomVariableSelect(variableName, 'smsContents', index)}
                                                className="w-full text-left text-xs px-2 py-1 hover:bg-indigo-50 rounded text-gray-900 cursor-pointer"
                                              >
                                                {variableName}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <label className="text-sm font-medium text-gray-700">
                                Use only dropdown variables for dynamic content.
                              </label>
                            </div>
                          </div>  
                          {activeContactMethods[index] === 'custom' && (
                            <FormField
                              control={form.control}
                              name={`recipients_phone.${index}`}
                              render={({ field }) => (
                                <FormItem className='w-full'>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Custom Phone Number *"
                                      required
                                      className="w-full rounded-lg border-2 px-4 py-3 mt-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                                    />
                                  </FormControl>

                                </FormItem>
                              )}
                            />
                          )}
                        </Card>}
                      </div>
                    </>
                  )}

                  {/* Add New Group Button */}
                  {index === notificationData.emailRecipients.length - 1 && (
                    <button
                      type="button"
                      onClick={handleAddNotificationGroup}
                      className="w-full py-3 border-2  border-dashed border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 transition-all duration-200 group"
                    >
                      <MdOutlineGroupAdd className="text-xl group-hover:scale-110 transition-transform" />
                      Add New Notification Group
                    </button>
                  )}
                </div>
              ))}
            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}

    </div>
  );
};

export default NotificationSubComponent;

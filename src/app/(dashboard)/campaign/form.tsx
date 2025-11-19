"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/component/ui/form'
import { Input } from '@/component/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/component/common/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/component/common/Dialog'
// import { toast } from '@/component/ui/use-Toast'

import Card from '@/component/common/Card'
import Button from '@/component/common/Button'
import { CardContent } from '@/component/ui/card'
import Table from '@/component/common/Table'

import {
  Upload,
  Calendar,
  Clock,
  Loader2,
  Users,
  X
} from 'lucide-react'
import { createCampaignApiRequest, getAlReadyHavePhoneNumberApiRequest, getAssistantListApiRequest, getCampaignByIdApiRequest, updateCampaignApiRequest } from '@/network/api'
import { Textarea } from '@/component/ui/textarea'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/Redux/store/store'
import { localToUTC, utcToLocal, getTimezoneAbbreviation } from '@/_utils/general'


const FormSchema = z.object({
  Name: z.string().min(1, { message: 'Campaign name is required' }),
  Assistant: z.string().min(1, { message: 'Assistant is required' }),
  StartedAt: z.string().optional(),
  FinishedAt: z.string().optional(),
  phone_number: z.string().min(1, { message: 'Phone number is required' }),
  description: z.string().optional(),
  contactsFile: z.any().optional(),
  File: z.any().optional(),
})

interface Contact {
  Id: string
  Firstname: string
  Lastname: string
  Phone: string
  Status: string
  Timestamp: string
  Duration: number
}

const CampaignForm = ({ isEdit }: { isEdit?: string }) => {
  const searchParams = useSearchParams()
  const campaignIdForEdit = searchParams.get('id')
  const router = useRouter()

  // Get timezone from Redux store
  const companyData = useSelector((state: RootState) => state.company.companyData) as any
  const timezone = companyData?.timezone || 'UTC'
  const timezoneAbbr = getTimezoneAbbreviation(timezone)

  const [formSubmitted, setFormSubmitted] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)

  const [assistantsList, setAssistantsList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [campaign, setCampaign] = useState<any>(null)
  const [campaignStatus, setCampaignStatus] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [isDeletingContact, setIsDeletingContact] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([])
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [minDateTime, setMinDateTime] = useState<string>("")

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      Name: "",
      Assistant: "",
      StartedAt: "",
      FinishedAt: "",
      description: "",
      File: null
    }
  })

  // Update minimum datetime based on user's timezone
  useEffect(() => {
    const updateMinDateTime = () => {
      const now = new Date()
      const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      const year = localDate.getFullYear()
      const month = String(localDate.getMonth() + 1).padStart(2, '0')
      const day = String(localDate.getDate()).padStart(2, '0')
      const hours = String(localDate.getHours()).padStart(2, '0')
      const minutes = String(localDate.getMinutes()).padStart(2, '0')
      setMinDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
    }

    // Update immediately
    updateMinDateTime()

    // Update every minute to keep min time current
    const interval = setInterval(updateMinDateTime, 60000)

    return () => clearInterval(interval)
  }, [timezone])

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setSubmitting(true)

    // Validate that start time is not in the past (with 1-minute buffer)
    if (data.StartedAt) {
      const startDate = new Date(data.StartedAt)
      const now = new Date()
      const bufferTime = 60 * 1000 // 1 minute buffer
      const nowWithBuffer = new Date(now.getTime() - bufferTime)

      if (startDate < nowWithBuffer) {
        const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
        const formattedTime = localNow.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
        
        toast.error(`Start date cannot be in the past. Current time is ${formattedTime} (${timezoneAbbr}). Please select a future time.`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
        setSubmitting(false)
        return
      }
    }

    // Create FormData to handle file upload
    if (!isEdit && !campaignIdForEdit) {

      const formData = new FormData()
      formData.append('name', data.Name)
      formData.append('assistant_id', data.Assistant)
      formData.append('phone_number_id', data.phone_number)

      if (data.description) {
        formData.append('description', data.description)
      }

      // Append file if selected
      if (data.contactsFile && data.contactsFile.length > 0) {
        formData.append('file', data.contactsFile[0])
      }

      // Append start date in UTC format (already converted in onChange handler)
      if (data.StartedAt) {
        formData.append('started_at', data.StartedAt)
      }
      createCampaignApiRequest(formData).then((res: any) => {
        if (res) {
          setSubmitting(false)
          setFormSubmitted("success")
          router.push("/campaign")
        }
      }).catch((err) => {
        console.log(err)
        setFormSubmitted("error")
        setSubmitting(false)
      })
    }

    if (isEdit) {
      const payload = {
        name: data.Name,
        assistant_id: data.Assistant,
        phone_number_id: data.phone_number,
        description: data.description,
        started_at: data.StartedAt,
      }
      updateCampaignApiRequest(campaignIdForEdit!, payload).then((res: any) => {
        if (res) {
          setSubmitting(false)
          setFormSubmitted("success")
          router.push("/campaign")
        }
      }).catch((err) => {
        console.log(err)
        setFormSubmitted("error")
        setSubmitting(false)
      })
    } else {
      // Create new campaign

    }
  }

  const fetchCampaignById = async (id: string) => {
    setEditLoading(true)
    getCampaignByIdApiRequest(id).then((res: any) => {
      if (res?.data) {
        setCampaign(res?.data)
        setEditLoading(false)

        if (res?.data?.Id) {
          setCampaignId(res.data.Id)

        }

        if (res?.data?.campaign?.status) {
          setCampaignStatus(res.data.campaign.status)
        }

        if (res?.data?.Interactions && Array.isArray(res.data.Interactions)) {
          setContacts(res.data.Interactions)
        }
        console.log("res?.data", res?.data?.campaign)

        form.setValue("Name", res?.data?.campaign?.name || "")
        form.setValue("Assistant", res?.data?.campaign?.assistant_id || "")
        form.setValue("StartedAt", res?.data?.campaign?.started_at || "")
        form.setValue("phone_number", res?.data?.campaign?.phone_number_id || "")
        // form.setValue("FinishedAt", res?.data?.FinishedAt || "")
        form.setValue("description", res?.data?.campaign?.description || "")
      }
    }).catch((err) => {
      console.log(err)
      setEditLoading(false)
    })
  }

  const fetchAssistantsList = async () => {
    setLoading(true)
    try {
      const res: any = await getAssistantListApiRequest()
      setAssistantsList(res?.data?.assistants)
    } catch (error) {
      console.error("Error fetching assistants:", error)
      toast.error("Error fetching assistants",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      } )
    } finally {
      setLoading(false)
    }
  }
  const fetchPhoneNumbers = async () => {
    const res: any = await getAlReadyHavePhoneNumberApiRequest()
    setPhoneNumbers(res?.data?.phone_numbers)
  }

  // Handle file upload and parse contacts
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error("Please upload a CSV file",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // Parse CSV and create contact objects
      const newContacts: Contact[] = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        return {
          Id: `temp-${Date.now()}-${index}`,
          Firstname: values[0] || '',
          Lastname: values[1] || '',
          Phone: values[2] || '',
          Status: 'pending',
          Timestamp: new Date().toISOString(),
          Duration: 0
        };
      });

      setContacts(newContacts);
      setIsProcessingFile(false);
      toast.success(`${newContacts.length} contacts have been loaded from the file`,{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      toast.error("Failed to read the CSV file. Please try again.",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    };
    reader.readAsText(file);
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return

    setIsDeletingContact(true)
    try {
      setContacts(prev => prev.filter(contact => contact.Id !== contactToDelete.Id))
      toast.success("Contact has been removed from the campaign",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
      setIsDeleteDialogOpen(false)
      setContactToDelete(null)
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast.error("Failed to delete contact. Please try again.",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    } finally {
      setIsDeletingContact(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const getBadgeStyle = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pending':
          return "bg-yellow-100 text-yellow-800"
        case 'completed':
          return "bg-green-100 text-green-800"
        case 'failed':
          return "bg-red-100 text-red-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyle(status)}`}>
        {status}
      </span>
    )
  }



  const ContactsManagementSection = () => {

    const contactsColumns = [
      {
        header: 'Name',
        accessor: 'name',
        render: (row: Contact) => (
          <div className="font-medium">
            {row.Firstname} {row.Lastname}
          </div>
        )
      },
      {
        header: 'Phone',
        accessor: 'phone',
        render: (row: Contact) => (
          <div className="font-mono text-sm">
            {row.Phone}
          </div>
        )
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (row: Contact) => getStatusBadge(row.Status)
      },
      {
        header: 'Added',
        accessor: 'timestamp',
        render: (row: Contact) => (
          <div className="text-sm text-gray-500">
            {new Date(row.Timestamp).toLocaleDateString()}
          </div>
        )
      },
      {
        header: 'Actions',
        accessor: 'actions',
        render: (row: Contact) => (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDeleteContact(row)}
            className="h-8 w-8 !p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        )
      }
    ]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Campaign Contacts</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {contacts.length} contacts
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                // Trigger file input click
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.click();
              }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Add More Contacts
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setContacts([]);
                toast.success("All contacts have been removed from the campaign",{
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "light",
                })
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table columns={contactsColumns} data={contacts} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    if (formSubmitted === "success" || formSubmitted === "error") {
      setTimeout(() => {
        setFormSubmitted(null)
      }, 3000)
    }
  }, [formSubmitted])

  useEffect(() => {
    fetchAssistantsList()
    fetchPhoneNumbers()
  }, [])

  useEffect(() => {
    if (campaignIdForEdit) {
      fetchCampaignById(campaignIdForEdit)
    }
  }, [campaignIdForEdit])

  return (
    <div className="mt-5 bg-white p-5 rounded-lg">
      {/* Loading State */}
      {editLoading && (
        <div className="h-full text-center w-full flex justify-center items-center content-center mt-10">
          <Loader2 className="mr-2 animate-spin" size={50} />
        </div>
      )}

      {/* Campaign Status Display for Edit Mode */}
      {isEdit && campaign && !editLoading && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${campaignStatus === 'Active' ? 'bg-green-100 text-green-800' :
                  campaignStatus === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                    campaignStatus === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {campaignStatus}
                </span>
              </div>
              {campaign.Interactions && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Contacts:</span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {campaign.Interactions.length}
                  </span>
                </div>
              )}
              {campaign.AmountTotalCalls && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Total Calls:</span>
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    {campaign.AmountTotalCalls}
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {campaign?.campaign?.created_at ? new Date(campaign?.campaign?.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Show form only when not loading */}
      {!editLoading && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center w-full gap-2">
              <FormField
                control={form.control}
                name="Name"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Assistant"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>Assistant</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assistant" />
                        </SelectTrigger>
                        <SelectContent className='bg-white p-0'>
                          {assistantsList.map((assistant) => (
                            <SelectItem className='bg-white cursor-pointer hover:bg-gray-100 mb-2' key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />
            </div>



            {/* Phone Number and Start Date fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Number</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        disabled={isEdit === "true"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Number" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {phoneNumbers.map((phoneNumber) => (
                            <SelectItem className='bg-white cursor-pointer' key={phoneNumber.id} value={phoneNumber.id}>{phoneNumber.phone_number}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className='text-red-500 text-sm' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="StartedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4" />
                      Start Date ({timezoneAbbr})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
                        disabled={isEdit === "true"}
                        min={minDateTime}
                        value={utcToLocal(field.value, timezone)}
                        onChange={(e) => {
                          const localDateTimeString = e.target.value
                          if (!localDateTimeString) {
                            field.onChange("")
                            return
                          }
                          
                          // Convert local time to UTC based on user's timezone
                          const utcString = localToUTC(localDateTimeString, timezone)
                          const utcDate = new Date(utcString)
                          const now = new Date()
                          
                          // Debug logging (uncomment to troubleshoot)
                          console.log('🕐 Timezone Conversion Debug:')
                          console.log('Selected local time:', localDateTimeString)
                          console.log('Timezone:', timezone)
                          console.log('Converted to UTC:', utcString)
                          console.log('UTC Date object:', utcDate.toISOString())
                          console.log('Current UTC time:', now.toISOString())
                          console.log('Difference (ms):', utcDate.getTime() - now.getTime())
                          
                          // Add a 1-minute buffer to account for processing time
                          const bufferTime = 60 * 1000 // 1 minute in milliseconds
                          const nowWithBuffer = new Date(now.getTime() - bufferTime)

                          // Validate that the selected time is not in the past (with buffer)
                          if (utcDate < nowWithBuffer) {
                            const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
                            const formattedTime = localNow.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })
                            
                            toast.error(`You can only add future time. Current time is ${formattedTime} (${timezoneAbbr}). Please select a time after the current time.`, {
                              position: "top-right",
                              autoClose: 4000,
                              hideProgressBar: false,
                              closeOnClick: true,
                              pauseOnHover: true,
                              draggable: true,
                              progress: undefined,
                              theme: "light",
                            })
                            // Clear the field
                            field.onChange("")
                            return
                          }

                          // Store UTC string in form
                          field.onChange(utcString)
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a future date and time for the campaign to start (in {timezone})
                    </p>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="FinishedAt"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      End Date (Max 1 hour after start)
                    </FormLabel>
                    <FormControl className="w-full">
                      <Input
                        type="datetime-local"
                        {...field}
                        className="justify-between w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
                        min={form.getValues("StartedAt") || new Date().toISOString().slice(0, 16)}
                        max={(() => {
                          const startDate = form.getValues("StartedAt") ? new Date(form.getValues("StartedAt") as string) : new Date()
                          const maxDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour later
                          return maxDate.toISOString().slice(0, 16)
                        })()}
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value)
                          const startDate = form.getValues("StartedAt") ? new Date(form.getValues("StartedAt") as string) : new Date()
                          const maxDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour later

                          if (selectedDate <= startDate) {
                            toast({
                              title: "Invalid Date",
                              description: "End date must be after start date",
                              variant: "destructive"
                            })
                            return
                          }

                          if (selectedDate > maxDate) {
                            toast({
                              title: "Invalid Date",
                              description: "End date cannot be more than 1 hour after start date",
                              variant: "destructive"
                            })
                            return
                          }

                          field.onChange(selectedDate.toISOString())
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Campaign duration is limited to 1 hour maximum
                    </p>
                       <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              /> */}
            </div>
            <div className='w-full'>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      Description
                    </FormLabel>
                    <FormControl className="w-full">
                      <Textarea
                        {...field}
                        className="justify-between w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
                        placeholder="Enter description"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value)
                        }}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage className='text-red-500 text-[12px]' />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Field */}
            {isEdit !== "true" && <FormField
              control={form.control}
              name="contactsFile"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Upload className="w-4 h-4" />
                    Upload Contacts File (CSV)
                  </FormLabel>
                  <FormControl className="w-full">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                          field.onChange(files)
                          handleFileUpload(files)
                        }
                      }}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm transition-colors"
                    />
                  </FormControl>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">
                      Upload a CSV file with contact information (Name, Phone, etc.)
                    </p>
                    {isProcessingFile && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-blue-600">Processing...</span>
                      </div>
                    )}
                  </div>
                  <FormMessage className='text-red-500 text-[12px]' />
                </FormItem>
              )}
            />}

            {/* Contacts Management Section - Only show when there are contacts */}
            {contacts && contacts.length > 0 && <ContactsManagementSection />}

            <div className="text-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEdit ? 'Update Campaign' : 'Create Campaign'
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {contactToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {contactToDelete.Firstname} {contactToDelete.Lastname}
              </div>
              <div className="text-sm text-gray-600 font-mono">
                {contactToDelete.Phone}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeletingContact}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteContact}
              disabled={isDeletingContact}
            >
              {isDeletingContact ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Contact'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CampaignForm
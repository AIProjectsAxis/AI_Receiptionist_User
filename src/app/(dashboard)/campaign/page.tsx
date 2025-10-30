
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl, FormLabel } from '@/component/ui/form'
import { Input } from '@/component/ui/input'
import { Textarea } from '@/component/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/component/common/Dialog'

import { formatDate, formatCampaignDate } from '@/_utils/general'


import Card from '@/component/common/Card'
import Button from '@/component/common/Button'
import Table from '@/component/common/Table'

import { Edit, Loader2, Pause, Plus, Trash2, Play, Eye, PlayCircle, PauseCircle, BarChart3, Phone, Users, Clock } from 'lucide-react'
import { deleteCampaignApiRequest, getCampaignListApiRequest } from '@/network/api'
import { toast } from 'react-toastify'


// Form schema
const FormSchema = z.object({
  Numbers: z.string().min(1, { message: 'Phone numbers are required' }),
  Playbook: z.string().min(10, { message: 'Playbook must be at least 10 characters' }),
})

// Types
type Campaign = {
  Id: string
  Name: string
  Status: string
  ParallelCalls: number
  CreatedAt: string
  StartedAt: string | null
  Description?: string
  TotalContacts?: number
  UploadedFileName?: string
}

// Mapping function for API data
const mapApiCampaignToCampaign = (apiCampaign: any): Campaign => {
  return {
    Id: apiCampaign.id,
    Name: apiCampaign.name,
    Status: apiCampaign.status,
    ParallelCalls: apiCampaign.calls_counter_in_progress ?? 0,
    CreatedAt: apiCampaign.created_at,
    StartedAt: apiCampaign.started_at || null,
    Description: apiCampaign.description,
    TotalContacts: apiCampaign.total_contacts,
    UploadedFileName: apiCampaign.uploaded_file_name,
  }
}

const CampaignPage = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [campaignList, setCampaignList] = useState<Campaign[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [isDeleteAlert, setDeleteAlert] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)
  const [campaignStatuses, setCampaignStatuses] = useState<{ [key: string]: string }>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteBtnLoading, setDeleteBtnLoading] = useState(false)

  const formatDateStartedAt = (date: string) => {
    if (!date) return "-"
    return formatCampaignDate(date)
  } 

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      Numbers: '',
      Playbook: ''
    }
  })


  // Get campaigns
  const getCampaigns = () => {
    setLoading(true)
    getCampaignListApiRequest().then((res: any) => {
      if (res?.data) {
        const apiCampaigns = Array.isArray(res.data) ? res.data : res.data.campaigns
        const mappedCampaigns = apiCampaigns.map(mapApiCampaignToCampaign)
        setCampaignList(mappedCampaigns)
        setLoading(false)
      }
    }).catch((err) => {
      console.log(err)
      setLoading(false)
    })
  }


  // Calculate campaign statistics
  const getCampaignStats = () => {
    if (!campaignList || campaignList.length === 0) {
      return { total: 0, started: 0, paused: 0 }
    }

    const stats = campaignList.reduce((acc: any, campaign: any) => {
      const status = (campaignStatuses[campaign?.Id] || campaign?.Status || "Paused").toLowerCase()
      
      if (status === 'start' || status === 'running' || status === 'active') {
        acc.started++
      } else if (status === 'paused') {
        acc.paused++
      }
      
      acc.total++
      return acc
    }, { total: 0, started: 0, paused: 0 })

    return stats
  }

  // Delete campaign
  const deleteCampaign = (id: string) => {
    setDeleteBtnLoading(true)
    deleteCampaignApiRequest(id).then((res: any) => {
      getCampaigns()
      setDeleteAlert(false)
      toast.success("Campaign deleted successfully", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    }).catch((err) => {
      console.log(err)
        toast.error("Error deleting campaign", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    }).finally(() => {
      setDeleteBtnLoading(false)
    })
  }

  // Table columns configuration
  const campaignColumns = [
    {
      header: '#',
      accessor: 'Id',
      render: (row: Campaign, index: number) => (
        <div className="font-medium text-gray-900">{index + 1}</div>
      )
    },
    {
      header: 'Campaign Name',
      accessor: 'Name',
      render: (row: Campaign) => (
        <div className="max-w-[200px]">
          <div className="font-medium text-gray-900 truncate">{row?.Name || "-"}</div>
        </div>
      )
    },
    // New Description column
    // New Total Contacts column
    {
      header: 'Total Contacts',
      accessor: 'TotalContacts',
      render: (row: Campaign) => (
        <span>{row?.TotalContacts ?? "-"}</span>
      )
    },
    // New File column
    {
      header: 'Status',
      accessor: 'Status',
      render: (row: Campaign) => {
        const status = campaignStatuses[row?.Id] || row?.Status || "Paused"
        const getStatusConfig = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'running':
              return { bg: "bg-green-100", text: "text-green-800", label: "Running" }
            case 'created':
              return { bg: "bg-blue-100", text: "text-blue-800", label: "Created" }
            case 'paused':
              return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Paused" }
            case 'completed':
              return { bg: "bg-green-100", text: "text-green-800", label: "Completed" }
            case 'failed':
              return { bg: "bg-red-100", text: "text-red-800", label: "Failed" }
            default:
              return { bg: "bg-gray-100", text: "text-gray-800", label: status || 'Unknown' }
          }
        }
        
        const config = getStatusConfig(status)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        )
      }
    },
    {
      header: 'Created At',
      accessor: 'CreatedAt',
      render: (row: Campaign) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{formatDate(row?.CreatedAt)}</span>
        </div>
      )
    },
    {
      header: 'Started At',
      accessor: 'StartedAt',
      render: (row: Campaign) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{formatDateStartedAt(row?.StartedAt || "")}</span>
        </div>
      ) 
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row: Campaign) => (
        <div className="flex items-center gap-2">
          {/* {(campaignStatuses[row?.Id] || row?.Status || "Paused") === "Start" ? (
            <Button 
              variant="secondary" 
              size="sm"
              className="!p-2 !min-w-0"
              onClick={() => handleCampaignStatus(row?.Id, campaignStatuses[row?.Id] || row?.Status || "Paused")}
            > 
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              size="sm"
              className="!p-2 !min-w-0"
              onClick={() => handleCampaignStatus(row?.Id, campaignStatuses[row?.Id] || row?.Status || "Paused")}
            > 
              <Play className="w-4 h-4" />
            </Button>
          )} */}
          <Button 
            variant="secondary" 
            size="sm"
            className="!p-2 !min-w-0"
            onClick={() => router.push(`/campaign/edit?id=${row?.Id}`)}
          > 
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            className="!p-2 !min-w-0"
            onClick={() => router.push(`/campaign/${row?.Id}`)}
          > 
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            className="!p-2 !min-w-0 text-red-500 hover:text-red-700"
            onClick={() => {
              setSelectedId(row?.Id)
              setDeleteAlert(true)
            }}
          > 
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  useEffect(() => {
    getCampaigns()
  }, [])

  const stats = getCampaignStats()

  return (
    <div className="py-[24px]">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Campaign Management</h1>
          <p className="page-subtitle">Create and manage your outbound calling campaigns</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => router.push("/campaign/new")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.started}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <PlayCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Paused Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.paused}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <PauseCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card
        title="Campaigns"
        subtitle="Manage your outbound calling campaigns"
        isLoading={loading}
      >
        {!loading && campaignList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">Create your first campaign to start making outbound calls</p>
            <Button 
              variant="primary"
              onClick={() => router.push("/campaign/new")}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <Table columns={campaignColumns} data={campaignList} />
        )}
      </Card>

      {/* Create Campaign Form Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up your outbound calling campaign with phone numbers and playbook
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="Numbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Numbers</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter phone numbers (one per line or comma-separated)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Playbook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Playbook</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your campaign script and instructions..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteAlert} onOpenChange={setDeleteAlert}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteAlert(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteCampaign(selectedId)}
              disabled={deleteBtnLoading}
            >
              {deleteBtnLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleteBtnLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CampaignPage
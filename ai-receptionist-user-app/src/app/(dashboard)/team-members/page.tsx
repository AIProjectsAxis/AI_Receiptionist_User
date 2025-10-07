'use client'
export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import Card from '@/component/common/Card';
import Button from '@/component/common/Button';
import { FormGroup, FormLabel, FormInput } from '@/component/common/FormElements';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/component/ui/form';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/component/common/select';
import { cancelTeamMemberInviteApiRequest, createTeamMemberInviteApiRequest, deleteTeamMemberApiRequest, getPendingInvitesApiRequest, getTeamMembersApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/component/ui/tabs';

const FormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.string().min(1, { message: 'Role is required' }),
  phone_number: z.string().min(1, { message: 'User phone is required' }),
})

interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  created_at: string;
  status: string;
}

const TeamMembers = () => {
  const router = useRouter();
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<TeamMember[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentIdToDelete, setAgentIdToDelete] = useState('');
  const [editId, setEditId] = useState('');
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [showCancelInviteConfirm, setShowCancelInviteConfirm] = useState(false);
  const [agentIdToCancelInvite, setAgentIdToCancelInvite] = useState('');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      role: "",
      first_name: "",
      last_name: "",
      phone_number: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const response: any = await createTeamMemberInviteApiRequest(data);
      if (response.success === true) {
        toast.success('Team member created successfully',{
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowAddMemberForm(false);
        form.reset();
        getTeamMembers();
        getPendingInvites()
      } else {
        toast.error('Failed to create team member',{
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
    } catch (error) {
      console.log(error);
    }
  }

  const handleRemoveMember = (id: string) => {
    setShowDeleteConfirm(true);
    setAgentIdToDelete(id);
  };

  // Filter members based on search query
  const filteredMembers = teamMembers.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Role display mapping
  const roleDisplay = {
    manager: 'Manager',
    user: 'User',
    owner: 'Owner',
    staff: 'Staff'
  };

  const getTeamMembers = async () => {
    const response = await getTeamMembersApiRequest();
    if (response?.data?.members) {
      setTeamMembers(response.data.members);
    }
  }
  const getPendingInvites = async () => {
    const response: any = await getPendingInvitesApiRequest();
    if (response?.data?.invitations) {
      setPendingInvites(response.data.invitations);
    }
  }

  // Delete Team Member
  const handleConfirmDelete = async () => {
    try {
      const response:any = await deleteTeamMemberApiRequest(agentIdToDelete);
      if (response.success === true) {
        toast.success('Team member removed successfully',{
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        getTeamMembers();
        setShowDeleteConfirm(false);
        setAgentIdToDelete('');
        
      } 
    } catch (error :any) {
      toast.error(error?.message,{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setShowDeleteConfirm(false);
      setAgentIdToDelete('');
    }
  }

  // Cancel Team Member Invite

  const handleCancelInvite = async () => {
    try {
      const response:any = await cancelTeamMemberInviteApiRequest(agentIdToCancelInvite);
      if (response.success === true) {
        toast.success('Team member invite cancelled successfully',{
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        getPendingInvites();
        setShowCancelInviteConfirm(false);
        setAgentIdToCancelInvite('');
      }
    } catch (error :any) {
      toast.error(error?.message,{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setShowCancelInviteConfirm(false);
      setAgentIdToCancelInvite('');
    }
  }

  useEffect(() => {
    getTeamMembers();
    getPendingInvites();
  }, []);

  return (
    <div className='pt-5'>
      <div className="page-header">
        <div>
          <div className="page-title">Team Members</div>
          <div className="page-subtitle">Manage user access and permissions</div>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Team Member
          </Button>
        </div>
      </div>

      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-900">Add New Team Member</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new user account</p>
            </div>

            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormGroup>
                            <FormLabel className={`${(form.formState.errors.first_name && form.formState.touchedFields.first_name) ? 'text-red-500' : ''}`} htmlFor="first_name">First Name</FormLabel>
                            <FormControl>
                              <FormInput
                                id="first_name"
                                {...field}
                                name="first_name"
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Enter first name"
                              />
                            </FormControl>
                          </FormGroup>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormGroup>
                            <FormLabel className={`${(form.formState.errors.last_name && form.formState.touchedFields.last_name) ? 'text-red-500' : ''}`} htmlFor="last_name">Last Name</FormLabel>
                            <FormControl>
                              <FormInput
                                id="last_name"
                                {...field}
                                name="last_name"
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Enter last name"
                              />
                            </FormControl>
                          </FormGroup>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormGroup>
                            <FormLabel className={`${(form.formState.errors.email && form.formState.touchedFields.email) ? 'text-red-500' : ''}`} htmlFor="email">Email Address</FormLabel>
                            <FormControl>
                              <FormInput
                                id="email"
                                {...field}
                                type="email"
                                placeholder="Enter email address"
                              />
                            </FormControl>
                          </FormGroup>
                        </FormItem>
                      )} />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormGroup>
                            <FormLabel className={`${(form.formState.errors.role && form.formState.touchedFields.role) ? 'text-red-500' : ''}`} htmlFor="role-select">Role </FormLabel>
                            <FormControl className='h-[45px]'>
                              <Select
                                {...field}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className='h-[45px] border-gray-200/50'>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent className='bg-white'>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormGroup>
                        </FormItem>
                      )} />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormGroup>
                            <FormLabel className={`${(form.formState.errors.phone_number && form.formState.touchedFields.phone_number) ? 'text-red-500' : ''}`} htmlFor="phone_number">Phone Number</FormLabel>
                            <FormControl>
                              <FormInput
                                id="user_phone"
                                {...field}
                                type="text"
                                placeholder="Enter phone number"
                              />
                            </FormControl>
                          </FormGroup>
                        </FormItem>
                      )} />
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddMemberForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                      Add Team Member
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="form-input" style={{ width: '300px', display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', color: 'var(--gray-500)' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search team members..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: 0,
                width: '100%'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card title="Team Members" subtitle={`${filteredMembers.length} team members found`}>

        {/* <TabsList className="flex gap-4 mb-6 border-b">
            <TabsTrigger
              value="active"
              className={`pb-4 px-2 font-medium !bg-none  transition-all duration-200 ${activeTab === "active" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Active Members
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className={`pb-4 px-2 font-medium transition-all duration-200 ${activeTab === "pending" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Pending Invites
            </TabsTrigger>
          </TabsList> */}


        <div>
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("active")}
              className={`pb-4 px-2 font-medium transition-all duration-200 ${activeTab === "active" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Active Members
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-4 px-2 font-medium transition-all duration-200 ${activeTab === "pending" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-800"}`}
            >
              Pending Invites
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "active" ? filteredMembers : pendingInvites).map((member) => (
                <tr key={member.id}>
                  <td style={{ fontWeight: '500' }}>{member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : '---'}</td>
                  <td>{member.email}</td>
                  <td>{roleDisplay[member.role as keyof typeof roleDisplay] || member.role}</td>
                  <td>{member.phone_number || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* <Button variant="secondary" size="sm" onClick={() => {
                        router.push(`/team-members?editId=${member.id}`);
                        setEditId(member.id);
                        setShowAddMemberForm(true);
                      }}>Edit</Button> */}
                      {activeTab === "active" &&
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>}
                      {activeTab === "pending" &&
                       <Button
                       variant="secondary"
                       size="sm"
                       style={{ color: 'var(--danger)' }}
                       onClick={() => {
                        setShowCancelInviteConfirm(true);
                        setAgentIdToCancelInvite(member.id);
                       }}
                     >
                      Cancel Invite
                     </Button>}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No team members found. <Button variant="text" onClick={() => setShowAddMemberForm(true)}>Add a team member</Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {filteredMembers.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            padding: '0 1rem'
          }}>
            <div style={{ fontSize: '0.9375rem', color: 'var(--gray-600)' }}>
              Showing {filteredMembers.length} of {teamMembers.length} team members
            </div>

            {teamMembers.length > 10 && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="button button-secondary button-sm" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button className="button button-primary button-sm">1</button>
                <button className="button button-secondary button-sm">2</button>
                <button className="button button-secondary button-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}


      </Card>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000]  bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this agent? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setAgentIdToDelete('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
       {showCancelInviteConfirm && (
        <div className="fixed inset-0 z-[2000]  bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Cancel Invite</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to cancel this invite? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelInviteConfirm(false);
                  setAgentIdToCancelInvite('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCancelInvite}
              >
                Cancel Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
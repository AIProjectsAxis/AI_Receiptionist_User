"use client"
import React, { useState, useEffect } from 'react'

import { FormGroup, FormInput } from '../common/FormElements'
import { FormLabel } from '../common/FormElements'
import Card from '../common/Card'
import Button from '../common/Button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl } from '../ui/form'
import { useSelector } from 'react-redux'
import { updateUserPasswordApiRequest, updateUserProfileApiRequest } from '@/network/api'
import { useDispatch } from 'react-redux'
import { getProfileDetailsThunkRequest } from '@/lib/Redux/SliceActions/CompanyActions'
import { toast } from 'react-toastify'
import GeneralSettingComponent from './GeneralSettingComponent'





const AccountsComponent = () => {
    const userProfile = useSelector((state: any) => state.company.profileDetails)
    const companyData = useSelector((state: any) => state.company.companyData)
    const dispatch = useDispatch()
    const [changePassword, setChangePassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)


    // Check if user is owner of the current company
    const isOwner = userProfile?.companies?.some((company: any) => 
        company.company_id === companyData?.id && company.role === "owner"
    )
    const PasswordSchema = z.object({
        oldPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
        newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
        confirmPassword: z.string().min(8, { message: 'Password must be at least 8 characters' })
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

    // Create a union type for the form data
    type FormData = {
        first_name: string;
        last_name: string;
        phone?: string;
        password?: {
            oldPassword: string;
            newPassword: string;
            confirmPassword: string;
        };
    }

    // Create dynamic schema based on changePassword state
    const getFormSchema = () => {
        const baseSchema = z.object({
            first_name: z.string().min(1, { message: 'First name is required' }),
            last_name: z.string().min(1, { message: 'Last name is required' }),
            phone: z.string().optional(),
        })

        if (changePassword) {
            return baseSchema.extend({
                password: PasswordSchema
            })
        } else {
            return baseSchema
        }
    }

    const form = useForm<FormData>({
        resolver: zodResolver(getFormSchema()),
        defaultValues: {
            first_name: '',
            last_name: '',
            phone: '',
            password: {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
        },

    })

    useEffect(() => {
        if (userProfile) {
            form.reset({
                first_name: userProfile?.first_name || '',
                last_name: userProfile?.last_name || '',
                phone: userProfile?.phone_number || '',
            })
        }
    }, [userProfile, form])

    useEffect(() => {
        if (!changePassword) {
            form.clearErrors(['password.oldPassword', 'password.newPassword', 'password.confirmPassword'])
            form.setValue('password', {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        }

        form.clearErrors()
        form.formState.isValid && form.trigger()
    }, [changePassword, form])

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true)


            if (changePassword) {
                if (!data.password?.oldPassword || !data.password?.newPassword || !data.password?.confirmPassword) {
                    toast.error("Please fill in all password fields", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    })
                    return
                }

                if (data.password.oldPassword === data.password.newPassword) {
                    toast.error("Old password and new password cannot be the same", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    })
                    return
                }


                const passwordPayload = {
                    old_password: data.password.oldPassword,
                    new_password: data.password.newPassword
                }

                const passwordResponse: any = await updateUserPasswordApiRequest(passwordPayload)
                console.log("passwordResponse", passwordResponse)
                if (passwordResponse?.success === true) {
                    toast.success('Password updated successfully', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                    setChangePassword(false)
                    form.setValue('password', {
                        oldPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    })
                } else {

                    return
                }
            }
            const profilePayload = {
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: data.phone,
            }
            console.log("profilePayload", profilePayload)
            const profileResponse: any = await updateUserProfileApiRequest(profilePayload)
            console.log("profileResponse", profileResponse?.success)
            if (profileResponse?.success === true) {
                dispatch(getProfileDetailsThunkRequest() as any)
                toast.success("Profile updated successfully", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                })
            }
        } catch (error: any) {
            console.log('error', error)
            toast.error(error?.message || "An error occurred", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>

            {isOwner && (<div className='mb-6 p-6 bg-white rounded-lg shadow-md '>
                <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold text-lg">General Settings</div>
                </div>
                <GeneralSettingComponent />
            </div>)}
            <Card
                title="Account Settings"
                subtitle="Manage your profile information"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="first_name">First Name</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                id="first_name"
                                                placeholder="Enter your first name"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="last_name">Last Name</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                id="last_name"
                                                placeholder="Enter your last name"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormGroup>
                                <FormLabel htmlFor="email">Email Address</FormLabel>
                                <FormInput
                                    id="email"
                                    name="email"
                                    readOnly
                                    disabled
                                    type="email"
                                    value={userProfile?.email || ''}
                                    onChange={() => { }}
                                    placeholder="Enter your email"
                                />
                            </FormGroup>

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="phone">Phone Number</FormLabel>
                                        <FormControl>
                                            <FormInput
                                                id="phone"
                                                type="tel"
                                                placeholder="Enter your phone number"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mt-6 mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-medium">Change Password</div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={changePassword}
                                        onChange={(e) => setChangePassword(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${changePassword ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${changePassword ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600">
                                        {changePassword ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            {changePassword && (
                                <div className="grid grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="password.oldPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="oldPassword">Old Password <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <FormInput
                                                        id="oldPassword"
                                                        type="password"
                                                        placeholder="Enter old password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password.newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="newPassword">New Password <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <FormInput
                                                        id="newPassword"
                                                        type="password"
                                                        placeholder="Enter new password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password.confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <FormInput
                                                        id="confirmPassword"
                                                        type="password"
                                                        placeholder="Confirm new password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    )
}

export default AccountsComponent
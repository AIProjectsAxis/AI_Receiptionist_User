'use client'

import React, { useState } from 'react'
import Card from '@/component/common/Card'
import Button from '@/component/common/Button'
import { useSearchParams } from 'next/navigation'
import { acceptTeamInvitationApiRequest, getUserProfileApiRequest } from '@/network/api'
import { toast } from 'react-toastify'
import { setToken } from '@/_utils/cookies'
import { useRouter } from 'next/navigation'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/component/ui/form"
import { Input } from "@/component/ui/input"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const AcceptInvitationPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [responseToken, setResponseToken] = useState('');


    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        password: "",
        confirmPassword: ""
      }
    })

    const handleAcceptInvitation = async () => {
        const payload = {
            token: token
        }
        try {
            const response:any = await acceptTeamInvitationApiRequest(payload);
            if (response.success) {
                toast.success("Invitation accepted successfully!",{
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "light",
                });
                const res = await getUserProfileApiRequest();
                if(res?.data?.is_temporary_password === false){
                  router.push('/dashboard');
                  return;
                }
                setStep(2);
                setResponseToken(response.data.token);
            } else {
                toast.error(response.message,{
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
        } catch (error :any) {
            toast.error("User Already Accepted the Invitation or Invitation is Expired",{
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
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      try {
        // Here you would make API call to set password
        setToken(responseToken as string);
        toast.success("Password set successfully!",{
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        router.push('/');
      } catch (error) {
        toast.error("Failed to set password",{
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
    }

    const renderPasswordToggle = (show: boolean, onClick: () => void) => (
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex items-center pr-3"
        onClick={onClick}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        )}
      </button>
    );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg mx-4">
        <div className="p-8 text-center">
          {step === 1 ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">You've Been Invited!</h1>
                <p className="text-gray-600">You've been invited to join a team. Would you like to accept this invitation?</p>
              </div>

              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <Button 
                  type="button"
                  variant="primary" 
                  onClick={handleAcceptInvitation}
                  className="w-full py-2.5"
                >
                  Accept & Continue
                </Button>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                By accepting this invitation, you agree to the team's terms and conditions
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Set Your Password</h1>
                <p className="text-gray-600">Please create a secure password for your account</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? 'text' : 'password'} {...field} />
                            {renderPasswordToggle(showPassword, () => setShowPassword(v => !v))}
                          </div>
                        </FormControl>
                           <FormMessage className='text-red-500 text-[12px]' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
                            {renderPasswordToggle(showConfirmPassword, () => setShowConfirmPassword(v => !v))}
                          </div>
                        </FormControl>
                           <FormMessage className='text-red-500 text-[12px]' />
                      </FormItem>
                    )}
                  />

                  <Button 
                    variant="primary" 
                    type="submit"
                    className="w-full py-2.5"
                  >
                    Set Password & Continue
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AcceptInvitationPage
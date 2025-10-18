// pages/login.tsx or app/login/page.tsx (for app router)

"use client"
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { LuEyeClosed } from 'react-icons/lu';
import { FiEye } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { loginApiRequest } from '@/network/api';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { getToken, setToken } from '@/_utils/cookies';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/component/ui/form';
import { useDispatch } from 'react-redux';
import { getCompanyDataThunkRequest, getProfileDetailsThunkRequest } from '@/lib/Redux/SliceActions/CompanyActions';
import Image from 'next/image';

const loginSchema = yup.object().shape({
    email: yup.string().email('Invalid email address').required('Email is required'),
    password: yup.string().required('Password is required'),
});

export default function LoginPage() {
    const dispatch = useDispatch();
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();

    const form = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const togglePasswordVisibility = () => {
        setShow(!show);
    };

    async function onSubmit(values: any) {
        const payload = {
            email: values.email,
            password: values.password,
        }
        try {
            setLoading(true);
            const response = await loginApiRequest(payload)
            if (response?.data?.token) {
                setToken(response.data.token)
                dispatch(getCompanyDataThunkRequest() as any);
                dispatch(getProfileDetailsThunkRequest() as any);
                toast.success(response.data.message || 'Login successful')
                if (response.data?.status_onboarding === "completed" && response.data?.status === "pending") {
                    router.push('/approval-pending')
                    return;
                } else

                if (response.data?.status_onboarding === "completed" && response.data?.status === "approved") {
                    router.push('/dashboard')
                    return;
                } else
                if ( response.data?.status === "approved" && (response.data?.status_onboarding === "pending_onboarding" || response.data?.status_onboarding !== "completed" || response.data?.status_onboarding === "step_1" || response.data?.status_onboarding === "step_2" || response.data?.status_onboarding === "step_3")) {
                    router.push('/onboarding')
                    return;
                }
                if ( response.data?.status === "pending" && (response.data?.status_onboarding === "pending_onboarding" || response.data?.status_onboarding !== "completed" || response.data?.status_onboarding === "step_1" || response.data?.status_onboarding === "step_2" || response.data?.status_onboarding === "step_3")) {
                    router.push('/onboarding')
                    return;
                }

                // else {
                //     router.push('/dashboard')
                // }
            } else {
                setError('Invalid email or password')
            }
        } catch (error: any) {
            setError(error?.message || 'An error occurred')
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const token = getToken();
        if (token) {
            dispatch(getProfileDetailsThunkRequest() as any);
            dispatch(getCompanyDataThunkRequest() as any);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 px-4">
            <div className="w-full max-w-[480px] bg-white p-8 rounded-xl shadow-xl border border-gray-100 border-t-4 border-t-blue-600 ">
                <div className="flex items-center gap-3 mb-6 text-center justify-center">
                    <div className="border border-gray-200 text-white rounded-md w-[48px] h-[48px] flex items-center justify-center shadow-sm font-bold text-[24px]">
                        <Image src="/eva_logo.png" alt="logo" width={30} height={30} />
                    </div>
                    <h1 className="text-xl font-bold logo-text text-[28px]">
                        <span className=" ">EvaSpeaks</span>
                    </h1>
                </div>

                <h2 className="text-2xl font-semibold text-gray-900 mb-1 text-center">Welcome back</h2>
                <p className="text-sm text-gray-500 mb-6 text-center">Sign in to your account</p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm text-gray-500'>Email Address</FormLabel>
                                    <FormControl>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-black"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center mb-1">
                                        <FormLabel>Password</FormLabel>
                                        {/* <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                            Forgot password?
                                        </Link> */}
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <input
                                                type={show ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-black"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                            >
                                                {show ? <LuEyeClosed /> : <FiEye />}
                                            </button>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 mt-4 cursor-pointer bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </Form>
                {form.formState.errors && <p className='text-sm text-red-500 text-center'>{form.formState.errors.email?.message}</p>}
                {error && <p className='text-sm text-red-500 mt-2 text-center'>{error}</p>}

                <p className="mt-6 text-sm text-center text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
                <p className='text-sm text-center text-gray-600'>
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                        Forgot password?
                    </Link>
                </p>
            </div>
        </div>
    );
}

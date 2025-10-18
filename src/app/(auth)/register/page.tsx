"use client"

import { useFormik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import { FiEye } from "react-icons/fi";
import { LuEyeClosed } from "react-icons/lu";
import * as Yup from 'yup';
import { registerMailApiRequest, sendOtpApiRequest, setPasswordApiRequest } from '@/network/api';
import { removeToken, setToken } from '@/_utils/cookies';
import { useRouter } from 'next/navigation';
import { Toast } from '@/component/ui/toast';
import { toast } from 'react-toastify';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import Image from 'next/image';

const RegisterPage = () => {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        hasLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSpecialChars: false
    });
    const [otpTimer, setOtpTimer] = useState(120); // 2 minutes in seconds
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);

    const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            email: '',
            password: '',
            confirmPassword: '',
            companyName: '',
            sentNotification: false,
            agreeToTerms: false,
            otp: ''
        },
        validationSchema: Yup.object({
            firstName: Yup.string()
                .required('First name is required')
                .matches(/^[A-Za-z\s]+$/, 'First name should only contain letters'),
            lastName: Yup.string()
                .required('Last name is required')
                .matches(/^[A-Za-z\s]+$/, 'Last name should only contain letters'),
            phoneNumber: Yup.string()
                .required('Phone number is required'),
            email: Yup.string().email('Invalid email address').required('Email is required'),
            companyName: Yup.string().required('Company name is required'),
            password: Yup.string()
                .required('Password is required')
                .min(8, 'Password must be at least 8 characters')
                .matches(/[A-Z]/, 'Password must contain uppercase letter')
                .matches(/[a-z]/, 'Password must contain lowercase letter')
                .matches(/[0-9]/, 'Password must contain a number')
                .matches(/[!@#$%^&*(),.?:{}<>]/, 'Password must contain a special character'),
            confirmPassword: Yup.string()
                .required('Please confirm your password')
                .oneOf([Yup.ref('password')], 'Passwords must match'),
            agreeToTerms: Yup.boolean()
                .oneOf([true], 'You must agree to the terms and conditions'),
            otp: Yup.string().when([], {
                is: () => step === 2,
                then: () => Yup.string().required('OTP is required').length(6, 'OTP must be 6 characters')
            })
        }),
        
        onSubmit: async (values) => {
            try {
                setIsLoading(true);
                if (step === 1) {
                    // Send registration data and request OTP
                    const response = await registerMailApiRequest({
                        email: values.email,
                        password: values.password,
                        first_name: values.firstName,
                        last_name: values.lastName,
                        company_name: values.companyName,
                        sent_notification: values.sentNotification,
                        phone_number: values.phoneNumber
                    });
                    if (response) {
                        setStep(2);
                    }
                } else if (step === 2) {
                    // Verify OTP
                    const payload = {
                        email: values.email,
                        otp: otpArray.join('')
                    }
                    const response: any = await sendOtpApiRequest(payload);
                    if (response) {
                        setToken(response.data?.token)
                        if (response?.data?.token) {
                            router.push('/onboarding');
                        }
                    }
                }
        } catch (error: any) {
                toast.error(error?.message || 'An error occurred',{
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
                setIsLoading(false);
            }
        }
    });

    // Timer effect for OTP resend
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        if (step === 2 && otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        setCanResendOtp(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [step, otpTimer]);

    // Reset timer when moving to step 2
    useEffect(() => {
        if (step === 2) {
            setOtpTimer(120);
            setCanResendOtp(false);
        }
    }, [step]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleResendOtp = async () => {
        try {
            setIsResendingOtp(true);
            const response = await registerMailApiRequest({
                email: formik.values.email,
                password: formik.values.password,
                first_name: formik.values.firstName,
                last_name: formik.values.lastName,
                company_name: formik.values.companyName,
                sent_notification: formik.values.sentNotification
            });
            
            if (response) {
                setOtpTimer(120);
                setCanResendOtp(false);
                setOtpArray(Array(6).fill(''));
                formik.setFieldValue('otp', '');
                toast.success('OTP resent successfully!', {
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
        } catch (error: any) {
            toast.error(error?.message || 'Failed to resend OTP', {
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
            setIsResendingOtp(false);
        }
    };

    useEffect(() => {
        const p = formik.values.password;
        setPasswordStrength({
            hasLength: p.length >= 8,
            hasUpperCase: /[A-Z]/.test(p),
            hasLowerCase: /[a-z]/.test(p),
            hasNumbers: /\d/.test(p),
            hasSpecialChars: /[!@#$%^&*(),.?:{}<>]/.test(p)
        });
    }, [formik.values.password]);


    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newOtp = Array(6).fill('');
        for (let i = 0; i < pastedData.length; i++) {
            if (/^[a-zA-Z0-9]$/.test(pastedData[i])) {
                newOtp[i] = pastedData[i];
            }
        }
        setOtpArray(newOtp);
        formik.setFieldValue('otp', newOtp.join(''));
    };


    return (
        <div className="flex justify-center pb-10 pt-5 items-center min-h-screen px-8 bg-gradient-to-br from-gray-50 to-blue-100">
            <div className={`absolute top-3 left-3 text-blue-600 hover:underline text-base ${step === 2 ? '' : 'hidden'}`} onClick={() => setStep(1)}>
                {`< Back to registration`}
            </div>
            <div className="w-full py-5 max-w-[680px] p-8 bg-white bg-opacity-70 backdrop-blur-md border border-gray-200 rounded-lg shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="text-center mb-6">
                <div className="flex items-center gap-3 mb-6 text-center justify-center">
                    <div className="border border-gray-200 text-white rounded-md w-[48px] h-[48px] flex items-center justify-center shadow-sm font-bold text-[24px]">
                        <Image src="/eva_logo.png" alt="logo" width={30} height={30} />
                    </div>
                    <h1 className="text-xl font-bold logo-text text-[28px]">
                        <span className=" ">EvaSpeaks</span>
                    </h1>
                </div>
                    <h1 className="text-[28px] font-bold text-gray-900 ">Create your account</h1>
                    <p className="text-gray-600 text-base">Get started with your AI-powered receptionist</p>
                </div>

                <form onSubmit={formik.handleSubmit} className="flex flex-col">
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* First Name */}
                            <div className='grid grid-cols-2  gap-2'>
                                <div>
                                    <label className="block font-medium mb-1 text-black text-base" htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formik.values.firstName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        placeholder="Enter your first name"
                                        className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${formik.touched.firstName && formik.errors.firstName ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                        required
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600">{formik.errors.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-medium mb-1 text-black text-base" htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formik.values.lastName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        placeholder="Enter your last name"
                                        className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${formik.touched.lastName && formik.errors.lastName ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                        required
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600">{formik.errors.lastName}</p>
                                    )}
                                </div>
                            </div>



                            <div className='grid grid-cols-2  gap-2'>
                                <div>
                                    <label className="block font-medium mb-1 text-black text-base" id="phoneNumber">Phone Number</label>
                                    <PhoneInput
                                        defaultCountry="us"
                                        value={formik.values.phoneNumber}
                                        onChange={(phone) => formik.setFieldValue('phoneNumber', phone)}
                                        onBlur={() => formik.setFieldTouched('phoneNumber', true)}
                                        inputClassName={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${formik.touched.phoneNumber && formik.errors.phoneNumber ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                        style={{
                                            '--react-international-phone-height': '48px',
                                            '--react-international-phone-background-color': 'white',
                                            '--react-international-phone-text-color': 'black',
                                            '--react-international-phone-border-color': formik.touched.phoneNumber && formik.errors.phoneNumber ? '#ef4444' : '#d1d5db',
                                            '--react-international-phone-border-radius': '0.375rem',
                                            '--react-international-phone-width': '51px',
                                        } as React.CSSProperties}
                                    />
                                    {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                                        <p className="mt-1 text-sm text-red-600">{formik.errors.phoneNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block font-medium mb-1 text-black text-base" htmlFor="email">Work Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        placeholder="you@company.com"
                                        className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${formik.touched.email && formik.errors.email ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                        required
                                    />
                                    {formik.touched.email && formik.errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block font-medium mb-1 text-black text-base" htmlFor="companyName">Company Name</label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={formik.values.companyName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder="Enter your company name"
                                    className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${formik.touched.companyName && formik.errors.companyName ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                    required
                                />
                                {formik.touched.companyName && formik.errors.companyName && (
                                    <p className="mt-1 text-sm text-red-600">{formik.errors.companyName}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className='grid grid-cols-2  gap-2'>
                                <div className=''>
                                    <label className="block font-medium mb-1 text-black text-base" htmlFor="password">Password</label>
                                    <div className="">
                                        <div className='relative'>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            placeholder="Create a secure password"
                                            className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black pr-10 ${formik.touched.password && formik.errors.password ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                                >
                                            {showPassword ? <LuEyeClosed /> : <FiEye />}
                                        </button>
                                        </div>
                                        {formik.touched.password && formik.errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                                        )}

                                        {/* Password Strength Meter */}
                                        <div className="mt-2 flex space-x-1">
                                            {Object.entries(passwordStrength).map(([key, met]) => (
                                                <div
                                                    key={key}
                                                    className={`h-2 flex-1 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Confirm Password */}
                                <div>
                                    <label className="block font-medium mb-1 text-black text-base" htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formik.values.confirmPassword}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            placeholder="Repeat your password"
                                            className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black pr-10 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                        >
                                            {showConfirmPassword ? <LuEyeClosed /> : <FiEye />}
                                        </button>
                                    </div>
                                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{formik.errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                            <p className="my-3  text-xs text-gray-500">
                                Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.
                            </p>

                            {/* Notification Checkbox */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="sentNotification"
                                    name="sentNotification"
                                    checked={formik.values.sentNotification}
                                    onChange={formik.handleChange}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor="sentNotification" className="text-sm text-gray-700">
                                        Receive Product updates & marketing
                                </label>
                            </div>

                            {/* Terms and Conditions Checkbox */}
                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    id="agreeToTerms"
                                    name="agreeToTerms"
                                    checked={formik.values.agreeToTerms}
                                    onChange={formik.handleChange}
                                    className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                                    I agree to the{' '}
                                      <a href="https://evaspeaks.ai/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                                        Terms and Conditions
                                    </a>
                                    {' '}and{' '}
                                    <a href="https://evaspeaks.ai/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                            {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.agreeToTerms}</p>
                            )}

                        </div>
                    )}

                    {step === 2 && (
                        <div className="mb-6 space-y-4">
                            <label className="block font-medium mb-1 text-black text-center text-base" htmlFor="otp">Enter OTP</label>
                            <div className="flex gap-[10px] justify-center">
                                {otpArray.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        inputMode="text"
                                        maxLength={1}
                                        value={digit}
                                        onPaste={handleOtpPaste}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const val = e.target.value;
                                            if (!/^[a-zA-Z0-9]$/.test(val) && val !== '') return;

                                            const newOtp = [...otpArray];
                                            newOtp[index] = val;
                                            setOtpArray(newOtp);
                                            formik.setFieldValue('otp', newOtp.join(''));

                                            if (val && index < 5) {
                                                otpRefs.current[index + 1]?.focus();
                                            }
                                        }}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Backspace') {
                                                const newOtp = [...otpArray];
                                                newOtp[index] = '';
                                                setOtpArray(newOtp);
                                                formik.setFieldValue('otp', newOtp.join(''));

                                                if (index > 0) {
                                                    otpRefs.current[index - 1]?.focus();
                                                }
                                            }
                                        }}
                                        ref={(el: HTMLInputElement | null) => {
                                            if (el) otpRefs.current[index] = el;
                                        }}
                                        className={`w-16 h-14 text-center text-xl border rounded-md focus:outline-none focus:ring-2 placeholder:text-gray-500 text-black
                                            ${formik.touched.otp && formik.errors.otp ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                        required
                                    />
                                ))}
                            </div>
                            {/* {formik.touched.otp && formik.errors.otp && (
                                <p className="mt-1 text-sm text-red-600 text-center">{formik.errors.otp}</p>
                            )} */}

                            {/* OTP Timer and Resend Button */}
                            <div className="flex justify-center mt-4">
                                {otpTimer > 0 ? (
                                    <div className="text-sm text-gray-600">
                                        Resend OTP in <span className="font-medium text-blue-600">{formatTime(otpTimer)}</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResendingOtp}
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isResendingOtp ? (
                                            <>
                                                <svg 
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600 inline" 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle 
                                                        className="opacity-25" 
                                                        cx="12" 
                                                        cy="12" 
                                                        r="10" 
                                                        stroke="currentColor" 
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path 
                                                        className="opacity-75" 
                                                        fill="currentColor" 
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Resending...
                                            </>
                                        ) : (
                                            'Resend OTP'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}



                    <div className="flex justify-center mt-5">
                        <button 
                            type="submit" 
                            disabled={
                                isLoading || 
                                (step === 1 && !formik.values.agreeToTerms) ||
                                (step === 2 && otpArray.join('').length !== 6)
                            }
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg 
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24"
                                    >
                                        <circle 
                                            className="opacity-25" 
                                            cx="12" 
                                            cy="12" 
                                            r="10" 
                                            stroke="currentColor" 
                                            strokeWidth="4"
                                        ></circle>
                                        <path 
                                            className="opacity-75" 
                                            fill="currentColor" 
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    {step === 2 ? 'Verifying...' : 'Processing...'}
                                </>
                            ) : (
                                step === 2 ? 'Verify OTP' : 'Continue'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-2     text-gray-600 text-sm">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-600 font-medium hover:underline">Sign In</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
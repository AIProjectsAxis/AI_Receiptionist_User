
"use client"

import { forgotPasswordApiRequest, sendOtpApiRequest, setPasswordApiRequest, verifyResetPasswordOtpApiRequest } from '@/network/api';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { removeToken, setToken } from '@/_utils/cookies';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Image from 'next/image';

type Props = {}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional()
}).superRefine((data, ctx) => {
  // Only validate OTP if we're on step 2
  if (data.otp !== undefined && data.otp !== '') {
    if (data.otp.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 6,
        type: "string",
        inclusive: true,
        message: "OTP must be 6 characters",
        path: ["otp"]
      });
    }
  }

  // Only validate password if we're on step 3
  if (data.password !== undefined && data.password !== '') {
    if (data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 8,
        type: "string",
        inclusive: true,
        message: "Password must be at least 8 characters",
        path: ["password"]
      });
    }

    // Validate password requirements
    if (!/[A-Z]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain uppercase letter",
        path: ["password"]
      });
    }
    if (!/[a-z]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain lowercase letter",
        path: ["password"]
      });
    }
    if (!/\d/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain a number",
        path: ["password"]
      });
    }
    if (!/[!@#$%^&*(),.?:{}<>]/.test(data.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must contain a special character",
        path: ["password"]
      });
    }

    // Validate confirm password
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
    }
  }
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes in seconds
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [status_onboarding, setStatus_onboarding] = useState("");
  const [isToken, setIsToken] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChars: false
  });

  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: ""
    },
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
      setOtpTimer(300);
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
      const response = await forgotPasswordApiRequest({
        email: form.getValues('email')
      });

      if (response) {
        setOtpTimer(300);
        setCanResendOtp(false);
        setOtpArray(Array(6).fill(''));
        form.setValue('otp', '');
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
    form.setValue('otp', newOtp.join(''));
  };

  // Password strength effect
  useEffect(() => {
    const p = form.watch('password');
    setPasswordStrength({
      hasLength: p.length >= 8,
      hasUpperCase: /[A-Z]/.test(p),
      hasLowerCase: /[a-z]/.test(p),
      hasNumbers: /\d/.test(p),
      hasSpecialChars: /[!@#$%^&*(),.?:{}<>]/.test(p)
    });
  }, [form.watch('password')]);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      if (step === 1) {
        // Validate only email for step 1
        if (!data.email || !data.email.includes('@')) {
          toast.error('Please enter a valid email address', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          return;
        }

        // Send OTP
        const response = await forgotPasswordApiRequest({
          email: data.email
        });
        console.log("response", response?.data?.message);

        if (response) {
          setStep(2);
          toast.success('OTP sent to your email!', {
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
      } else if (step === 2) {
        // Validate OTP for step 2
        const otpValue = otpArray.join('');
        if (otpValue.length !== 6) {
          toast.error('Please enter the complete 6-digit OTP', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          return;
        }

        // Verify OTP
        const response = await verifyResetPasswordOtpApiRequest({
          email: data.email,
          otp: otpValue
        });

        if (response) {
          setStep(3);
          console.log("response", response?.data);
          setIsToken(response?.data?.token);
          setStatus(response?.data?.status);
          setStatus_onboarding(response?.data?.status_onboarding);
          
          toast.success('OTP verified successfully!', {
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
      } else if (step === 3) {
        // Validate password for step 3
        if (!data.password || data.password.length < 8) {
          toast.error('Password must be at least 8 characters', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          return;
        }

        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          return;
        }

        // Reset password
        setToken(isToken);
        const response = await setPasswordApiRequest({
          email: data.email,
          password: data.password
        });
        if (response) {

          toast.success('Password reset successfully!', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          removeToken();
          router.push('/login');
          return;
   

          // if (status === "approved" && status_onboarding === "completed") {
          //   router.push('/dashboard');
          //   return;
          // } else
          //   if (status === "pending" && (status_onboarding === "pending_onboarding" || status_onboarding === "step_1" || status_onboarding === "step_2" || status_onboarding === "step_3")) {
          //     router.push('/onboarding');
          //     return;
          //   } else
          //     if (status === "pending" && status_onboarding === "completed") {
          //       router.push('/approval-pending');
          //       return;
          //     }

        }
      }
    } catch (error: any) {

      toast.error(error?.message || 'An error occurred', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      if (error?.message === "Already OTP requested") {
        setStep(2);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 px-4">
      <div className="w-full max-w-[480px] bg-white p-8 rounded-xl shadow-xl border border-gray-100 border-t-4 border-t-blue-600">
        <div className="flex items-center gap-3 mb-6 text-center justify-center">
          <div className="border border-gray-200 text-white rounded-md w-[48px] h-[48px] flex items-center justify-center shadow-sm font-bold text-[24px]">
            <Image src="/eva_logo.png" alt="logo" width={30} height={30} />
          </div>
          <h1 className="text-xl font-bold logo-text text-[28px]">
            <span className=" ">EvaSpeaks</span>
          </h1>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-1 text-center">Forgot Password</h2>
        <p className="text-[16px] text-gray-500 mb-6 text-center">
          {step === 1 && "Enter your email address and we'll send you instructions to reset your password."}
          {step === 2 && "Enter the OTP sent to your email address."}
          {step === 3 && "Create a new password for your account."}
        </p>

        {/* Back button for step 2 and 3 */}
        {(step === 2 || step === 3) && (
          <div className="text-center mb-4">
            <button
              style={{
                position: "absolute",
                top: "8px",
                left: "7px",
              }}
              onClick={() => setStep(step - 1)}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back
            </button>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 text-center">Enter OTP</label>
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
                      form.setValue('otp', newOtp.join(''));

                      if (val && index < 5) {
                        otpRefs.current[index + 1]?.focus();
                      }
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Backspace') {
                        const newOtp = [...otpArray];
                        newOtp[index] = '';
                        setOtpArray(newOtp);
                        form.setValue('otp', newOtp.join(''));

                        if (index > 0) {
                          otpRefs.current[index - 1]?.focus();
                        }
                      }
                    }}
                    ref={(el: HTMLInputElement | null) => {
                      if (el) otpRefs.current[index] = el;
                    }}
                    className="w-16 h-14 text-center text-xl border rounded-md focus:outline-none focus:ring-2 placeholder:text-gray-500"
                    required
                  />
                ))}
              </div>

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

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 pr-10"
                    {...form.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              (step === 2 && otpArray.join('').length !== 6)
            }
            className="w-full py-2 px-4 mt-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                {step === 1 ? 'Sending...' : step === 2 ? 'Verifying...' : 'Resetting...'}
              </>
            ) : (
              step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password'
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Remember your password?
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}



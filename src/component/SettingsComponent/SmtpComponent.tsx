import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { z } from 'zod';
import Card from '../common/Card';
import { FormGroup, FormLabel, FormInput, FormHelper, FormTextarea } from '../common/FormElements';
import { Switch } from '../common/Switch';
import { getSmtpConfigApiRequest, testSmtpConnectionApiRequest, updateSmtpConfigApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import Button from '../common/Button';
import { EyeIcon, EyeOffIcon, Loader2, X } from 'lucide-react';

interface SMTPConfig {
    enabled: boolean;
    host: string;
    port: string;
    username: string;
    password: string;
    confirmPassword: string;
    fromEmail: string;
    fromName: string;
}

interface TestEmail {
    to_email: string;
    subject: string;
    body: string;
}

const smtpConfigSchema = z.object({
    enabled: z.boolean(),
    host: z.string().optional(),
    port: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    fromEmail: z.string().optional(),
    fromName: z.string().optional()
}).refine((data) => {
    if (data.enabled) {
        return data.host && data.port && data.username && data.password && data.confirmPassword && data.fromEmail && data.fromName;
    }
    return true;
}, {
    message: "All fields are required when SMTP is enabled",
    path: ["enabled"]
}).refine((data) => {
    if (data.enabled && data.password && data.confirmPassword) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
}).refine((data) => {
    if (data.enabled && data.fromEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(data.fromEmail);
    }
    return true;
}, {
    message: "Please enter a valid email address",
    path: ["fromEmail"]
});

const validateForm = (values: SMTPConfig) => {
    try {
        smtpConfigSchema.parse(values);
        return {};
    } catch (error) {
        if (error instanceof z.ZodError) {
            const fieldErrors: { [key: string]: string } = {};
            error.errors.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            return fieldErrors;
        }
        return {};
    }
};

const SmtpComponent = ({ smtpConfig, setSmtpConfig }: { smtpConfig: any, setSmtpConfig: any }) => {
    
    const [ftpId, setFtpId] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [showTestPopup, setShowTestPopup] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testEmail, setTestEmail] = useState<TestEmail>({
        to_email: '',
        subject: '',
        body: ''
    });
    const [showTestForm, setShowTestForm] = useState(false);

    const {
        handleSubmit,
        values,
        errors,
        touched,
        setFieldValue,
        resetForm,
        isValid
    } = useFormik<SMTPConfig>({
        initialValues: {
            enabled: false,
            host: '',
            port: '',
            username: '',
            password: '',
            confirmPassword: '',
            fromEmail: '',
            fromName: ''
        },
        validate: validateForm,
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            const payload = {
                "smtp_host": values.host,
                "smtp_port": values.port,
                "smtp_user": values.username,
                "smtp_pass": values.password,
                "sender_name": values.fromName,
                "sender_email": values.fromEmail,
                "is_enabled": values.enabled
            }

            try {
                if (ftpId) {
                    const updatePayload = {
                        ...payload,
                        id: ftpId
                    }
                    const response: any = await updateSmtpConfigApiRequest(updatePayload);
                    console.log(response);
                    if (response) {
                        toast.success('SMTP Configuration updated successfully', {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        // getFTPConfig();
                        setSmtpConfig(response?.data);
                    }
                } else {
                    const response: any = await updateSmtpConfigApiRequest(payload);
                    console.log(response);
                    if (response) {
                        toast.success('SMTP Configuration created successfully', {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        // getFTPConfig();
                        setSmtpConfig(response?.data);
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                setIsSubmitting(false);
            }
        }
    });

   const testSmtpConnection = async () => {
    if (!testEmail) {
        toast.error('Please enter a test email address', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        return;
    }

    setIsTestingConnection(true);
    try {
        const payload = {
            to_email: testEmail.to_email,
            subject: testEmail.subject,
            body: testEmail.body
        };
        
        const response: any = await testSmtpConnectionApiRequest(payload);
        console.log(response);
        
        if (response?.data) {
            toast.success('Test email sent successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setShowTestPopup(false);
            setShowTestForm(false);
            setTestEmail({
                to_email: '',
                subject: '',
                body: ''
            });
        }
    } catch (error: any) {
        console.log(error);
        toast.error(error?.response?.data?.message || 'Failed to send test email', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    } finally {
        setIsTestingConnection(false);
    }
   }
    useEffect(() => {
        if (smtpConfig) {
            setIsEnabled(smtpConfig?.is_enabled || false);
            setFieldValue('enabled', smtpConfig?.is_enabled || false);
            setFieldValue('host', smtpConfig?.smtp_host || '');
            setFieldValue('port', smtpConfig?.smtp_port?.toString() || '');
            setFieldValue('username', smtpConfig?.smtp_user || '');
            setFieldValue('password', smtpConfig?.smtp_pass || '');
            setFieldValue('confirmPassword', smtpConfig?.smtp_pass || '');
            setFieldValue('fromEmail', smtpConfig?.sender_email || '');
            setFieldValue('fromName', smtpConfig?.sender_name || '');
            setFtpId(smtpConfig?.id || null);
        }
        // getFTPConfig();
    }, []);

    const onTestConnection = async () => {
        console.log('Testing SMTP connection with:', values);
        // Add your API call here to test the connection
    };

    return (
        <Card className='!p-0'>
            <div className='px-6 py-4'>
                <div className="flex items-center justify-between">
                    <div>
                        {!showTestForm ? (
                            <>
                                <h2 className='text-2xl font-bold'>SMTP Configuration</h2>
                                <p className='text-gray-600'>Configure custom SMTP server for outgoing emails</p>
                            </>
                        ) : (
                            <>
                                <h2 className='text-2xl font-bold'>Test SMTP Connection</h2>
                                <p className='text-gray-600'>Enter an email address to test your SMTP configuration. A test email will be sent to verify the connection.</p>
                            </>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {!showTestForm ? (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={!isValid || isSubmitting || !isEnabled}
                                    onClick={() => setShowTestForm(true)}
                                    className="px-4 py-2 !bg-green-600 !text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Test Connection
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!isValid || isSubmitting}
                                    onClick={() => handleSubmit()}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {
                                        isSubmitting ? <><Loader2 className='w-4 h-4 animate-spin' /> Saving...</> : 'Save Changes'
                                    }
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowTestForm(false);
                                        setTestEmail({
                                            to_email: '',
                                            subject: '',
                                            body: ''
                                        });
                                    }}
                                    disabled={isTestingConnection}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={testSmtpConnection}
                                    disabled={!testEmail || isTestingConnection}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isTestingConnection ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin mr-2' />
                                            Sending Test Email...
                                        </>
                                    ) : (
                                        'Send Test Email'
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {!showTestForm ? (
                <form onSubmit={handleSubmit} className="space-y-6 w-full">
                    {/* Enable SMTP Switch */}
                    <FormGroup className='w-full !mb-0 bg-gray-100 py-4 px-6 flex items-center justify-between w-full'>
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <FormLabel className="text-base font-semibold text-gray-900">
                                    Enable SMTP
                                </FormLabel>
                                <FormHelper className="text-gray-600">
                                    Enable custom SMTP server for outgoing emails
                                </FormHelper>
                            </div>
                            <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => {
                                    setFieldValue('enabled', checked);
                                    setIsEnabled(checked);
                                }}
                                className="ml-4"
                            />
                        </div>
                    </FormGroup>


                    <div className="space-y-6 border-t border-gray-200 pt-6 px-6">
                    {/* Username */}
                    <FormGroup>
                        <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                            Username <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                        </FormLabel>
                        <FormInput
                            disabled={!isEnabled}
                            type="text"
                            value={values.username || ''}
                            onChange={(e) => setFieldValue('username', e.target.value)}
                            placeholder="Your SMTP username"
                            error={errors.username}
                            className={`${errors.username ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}
                        />
                        {errors.username && (
                            <div className="text-red-500 text-sm mt-1">{errors.username}</div>
                        )}
                    </FormGroup>

                    <div className='flex gap-4 w-full'>
                        {/* SMTP Host */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                SMTP Host <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <FormInput
                                type="text"
                                disabled={!isEnabled}
                                value={values.host || ''}
                                onChange={(e) => setFieldValue('host', e.target.value)}
                                placeholder="e.g., smtp.gmail.com"
                                error={errors.host}
                                className={`${errors.host ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}
                            />
                            {errors.host && (
                                <div className="text-red-500 text-sm mt-1">{errors.host}</div>
                            )}
                        </FormGroup>

                        {/* SMTP Port */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                SMTP Port <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <FormInput
                                type="text"
                                disabled={!isEnabled}
                                value={values.port || ''}
                                onChange={(e) => setFieldValue('port', e.target.value)}
                                placeholder="e.g., 587 or 465"
                                error={errors.port}
                                className={`${errors.port ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}
                            />
                            {errors.port && (
                                <div className="text-red-500 text-sm mt-1">{errors.port}</div>
                            )}
                        </FormGroup>
                    </div>

                    <div className='flex gap-4 w-full'>
                        {/* Password */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                Password <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <div className={`flex w-full border border-gray-300 rounded-md pr-2 items-center gap-2 ${errors.password ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}>
                                <FormInput
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    disabled={!isEnabled}
                                    value={values.password || ''}
                                    onChange={(e) => setFieldValue('password', e.target.value)}
                                    placeholder="Your SMTP password"
                                    error={errors.password}
                                    className="!border-none !bg-transparent !ring-0 !outline-none"
                                />
                                <span onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {
                                        !isPasswordVisible ? <EyeIcon className='w-4 h-4 cursor-pointer' /> : <EyeOffIcon className='w-4 h-4 cursor-pointer' />
                                    }


                                </span>
                            </div>
                            {errors.password && (
                                <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                            )}
                        </FormGroup>

                        {/* Confirm Password */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                Confirm Password <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <div className={`flex w-full border border-gray-300 rounded-md pr-2 items-center gap-2 ${errors.password ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}>

                                <FormInput
                                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                                    disabled={!isEnabled}
                                    value={values.confirmPassword || ''}
                                    onChange={(e) => setFieldValue('confirmPassword', e.target.value)}
                                    placeholder="Confirm your SMTP password"
                                    error={errors.confirmPassword}
                                    className="!border-none !bg-transparent !ring-0 !outline-none"
                                />
                                <span onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                                    {
                                        !isConfirmPasswordVisible ? <EyeIcon className='w-4 h-4 cursor-pointer' /> : <EyeOffIcon className='w-4 h-4 cursor-pointer' />
                                    }


                                </span>
                            </div>
                            {errors.confirmPassword && (
                                <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                            )}
                        </FormGroup>
                    </div>

                    <div className='flex gap-4 w-full'>
                        {/* From Email */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                From Email <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <FormInput
                                type="email"
                                disabled={!isEnabled}
                                value={values.fromEmail || ''}
                                onChange={(e) => setFieldValue('fromEmail', e.target.value)}
                                placeholder="e.g., noreply@yourcompany.com"
                                error={errors.fromEmail}
                                className={`${errors.fromEmail ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}
                            />
                            {errors.fromEmail && (
                                <div className="text-red-500 text-sm mt-1">{errors.fromEmail}</div>
                            )}
                        </FormGroup>

                        {/* From Name */}
                        <FormGroup className='w-full'>
                            <FormLabel disabled={!isEnabled} required className={` ${!isEnabled ? '!text-gray-400' : '!text-gray-700'}`}>
                                From Name <span className={`${!isEnabled ? '!text-gray-400' : '!text-red-500'}`}>*</span>
                            </FormLabel>
                            <FormInput
                                type="text"
                                disabled={!isEnabled}
                                value={values.fromName || ''}
                                onChange={(e) => setFieldValue('fromName', e.target.value)}
                                placeholder="e.g., Your Company Name"
                                error={errors.fromName}
                                className={`${errors.fromName ? 'border-red-500' : ''} ${!isEnabled ? 'bg-gray-100 text-gray-300 pointer-events-none opacity-50' : ''}`}
                            />
                            {errors.fromName && (
                                <div className="text-red-500 text-sm mt-1">{errors.fromName}</div>
                            )}
                        </FormGroup>
                    </div>


                </div>

            </form>
            ) : (
                <div className="space-y-6 w-full">


                    <div className="space-y-6 border-t border-gray-200 py-6 px-6">
                        <FormGroup>
                            <FormLabel required className="text-gray-700">
                                Test Email Address <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormInput
                                type="email"
                                value={testEmail.to_email}
                                onChange={(e) => setTestEmail({...testEmail, to_email: e.target.value})}
                                placeholder="Enter email address to test"
                                className="w-full"
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel required className="text-gray-700">
                                Subject <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormInput
                                type="text"
                                value={testEmail.subject || ''}
                                onChange={(e) => setTestEmail({...testEmail, subject: e.target.value})}
                                placeholder="Enter subject"
                                className="w-full"
                            />
                        </FormGroup>

                        <FormGroup>
                            <FormLabel required className="text-gray-700">
                                Description <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormTextarea
                                value={testEmail.body || ''}
                                onChange={(e) => setTestEmail({...testEmail, body: e.target.value})}
                                placeholder="Enter description"
                                className="w-full"
                            />
                        </FormGroup>


                    </div>
                </div>
            )}


        </Card>
    );
};

export default SmtpComponent; 
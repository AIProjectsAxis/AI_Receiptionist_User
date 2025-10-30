import React, { useState, useEffect } from 'react'
import TimezoneSelect from 'react-timezone-select'
import dynamic from 'next/dynamic'
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";
import { FormGroup, FormLabel, FormInput } from '../common/FormElements'
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import { z } from 'zod';
import { Form } from '../ui/form'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { updateCompanyApiRequest } from '@/network/api';
import { Loader2 } from 'lucide-react';
import { getCompanyDataThunkRequest } from '@/lib/Redux/SliceActions/CompanyActions';
import { toast } from 'react-toastify';

const industryOptions = [
    { value: '', label: 'Select your industry', disabled: true },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Legal Services', label: 'Legal Services' },
    { value: 'Property Management', label: 'Property Management' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Hospitality', label: 'Hospitality' },
    { value: 'Financial Services', label: 'Financial Services' },
    { value: 'Education', label: 'Education' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Professional Services', label: 'Professional Services' },
    { value: 'Other', label: 'Other' }
];
const CompanySchema = z.object({
    name: z.string().min(1, { message: 'Company name is required' }),
    industry: z.string().min(1, { message: 'Industry is required' }),
    description: z.string().min(1, { message: 'Description is required' }),
    timezone: z.string().min(1, { message: 'Timezone is required' }),
    web_url: z.string().optional(),
})
const GeneralSettingComponent = () => {
    const companyData = useSelector((state: any) => state.company.companyData)
    const dispatch = useDispatch()
    const [showCustomIndustry, setShowCustomIndustry] = useState(false)
    const [customIndustryValue, setCustomIndustryValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const from = useForm<z.infer<typeof CompanySchema>>({
        resolver: zodResolver(CompanySchema),
        defaultValues: {
            name: '',
            industry: '',
            description: '',
            timezone: '',
            web_url: '',
        }
    })

    // Initialize custom industry state based on company data
    useEffect(() => {
        if (companyData?.industry) {
            const industryOptionValues = industryOptions.map(opt => opt.value).filter(v => v && v !== 'Other');
            if (industryOptionValues.includes(companyData.industry)) {
                setShowCustomIndustry(false);
                setCustomIndustryValue('');
            } else {
                setShowCustomIndustry(true);
                setCustomIndustryValue(companyData.industry);
            }
        }
    }, [companyData?.industry])

    const onSubmit = async (data: z.infer<typeof CompanySchema>) => {
        try {
            setIsSubmitting(true)
            // If "Other" is selected, use the custom industry value
            const finalData = {
                ...data,
                industry: showCustomIndustry ? customIndustryValue : data.industry
            };
            console.log('Form data with custom industry:', finalData);

            const payload = {
                name: data.name,
                industry: finalData.industry,
                description: data.description,
                timezone: data.timezone,
                website_url: data.web_url,
            }
            
            const response = await updateCompanyApiRequest(payload)
            console.log('response', response)
            if (response) {
                dispatch(getCompanyDataThunkRequest() as any)
                toast.success('Company updated successfully')
            }
        } catch (error) {
            console.log('error', error)
        } finally {
            setIsSubmitting(false)

        }   
    }

    // Check if form is valid
    const isFormValid = () => {
        const values = from.getValues();
        const hasName = values.name && values.name.trim() !== '';
        const hasIndustry = values.industry && values.industry.trim() !== '';
        const hasDescription = values.description && values.description.trim() !== '';
        const hasTimezone = values.timezone && values.timezone.trim() !== '';
        
        // If "Other" is selected, check custom industry value
        const hasValidIndustry = showCustomIndustry ? 
            (customIndustryValue && customIndustryValue.trim() !== '') : 
            hasIndustry;
        
        return hasName && hasValidIndustry && hasDescription && hasTimezone;
    }

    useEffect(() => {
        if (companyData) {
            from.reset({
                name: companyData.name || '',
                industry: companyData.industry || '',
                description: companyData.description || '',
                timezone: companyData.timezone || '',
                web_url: companyData.website_url || '',
            })
        }
    }, [companyData, from])


    return (
        <Form {...from}>
            <form onSubmit={from.handleSubmit(onSubmit)}>
                <FormGroup>
                    <FormLabel required htmlFor="name" className={`${from.formState.errors.name ? 'text-red-500' : ''}`}>
                        Company Name <span className={`${from.formState.errors.name ? 'text-red-500' : ''}`}>*</span>
                    </FormLabel>
                    <FormInput
                        id="name"
                        name="name"
                        value={from.watch('name') || ''}
                        onChange={(e) => {
                            from.setValue('name', e.target.value);
                            from.trigger('name');
                        }}
                        onBlur={() => from.trigger('name')}
                        placeholder="Enter company name"
                        className={`${from.formState.errors.name ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                    />
                    {from.formState.errors.name && (
                        <div className="text-red-500 text-sm mt-1">{from.formState.errors.name.message}</div>
                    )}
                </FormGroup>
                <FormGroup>
                    <FormLabel required htmlFor="industryType" className={`${from.formState.errors.industry ? 'text-red-500' : ''}`}>
                        Industry <span className={`${from.formState.errors.industry ? 'text-red-500' : ''}`}>*</span>
                    </FormLabel>
                    <select
                        id="industryType"
                        name="industry"
                        value={showCustomIndustry ? 'Other' : (from.watch('industry') || '')}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'Other') {
                                setShowCustomIndustry(true);
                                from.setValue('industry', 'Other');
                            } else {
                                setShowCustomIndustry(false);
                                setCustomIndustryValue('');
                                from.setValue('industry', value);
                            }
                            from.trigger('industry');
                        }}
                        onBlur={() => from.trigger('industry')}
                        // onBlur={handleBlur}
                        className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${from.formState.errors.industry ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                        required
                    >
                        {/* <option value="" disabled>Select your industry</option> */}
                        {industryOptions.map(opt => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                        ))}
                    </select>
                    {!showCustomIndustry && from.formState.errors.industry && (
                        <div className="text-red-500 text-sm mt-1">{from.formState.errors.industry.message}</div>
                        )}
                    {/* Show custom industry input if 'Other' is selected */}
                    {showCustomIndustry && (
                        <div className="mt-2">
                            <FormLabel required htmlFor="otherIndustry">Please specify your industry</FormLabel>
                            <input
                                id="otherIndustry"
                                name="otherIndustry"
                                type="text"
                                value={customIndustryValue || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCustomIndustryValue(value);
                                    // Update the form value with the custom industry
                                    from.setValue('industry', value);
                                    from.trigger('industry');
                                }}
                                onBlur={() => from.trigger('industry')}
                                // onBlur={handleBlur}
                                className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${from.formState.errors.industry ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                                placeholder="Enter your industry"
                                required
                            />
                            {from.formState.errors.industry && (
                                <div className="text-red-500 text-sm mt-1">{from.formState.errors.industry.message}</div>
                            )}
                        </div>
                    )}
                </FormGroup>
                <FormGroup>
                    <FormLabel required htmlFor="businessDescription" className={`${from.formState.errors.description ? 'text-red-500' : ''}`}>
                        Description <span className="text-red-500">*</span>
                    </FormLabel>
                    <MDEditor
                        className={`w-full ${from.formState.errors.description ? 'border-red-500 ring-red-200' : ''}`}
                        data-color-mode="light"
                        value={from.watch('description') || ''}
                        onChange={(value) => {
                            if (value && value.length > 5000) {
                                return; // Don't update if over limit
                            }
                            from.setValue('description', value || '');
                            from.trigger('description');
                        }}
                        onBlur={() => from.trigger('description')}
                        // onBlur={() => {
                        //     setTouched(prev => ({ ...prev, businessDescription: true }));
                        //     const error = validateField('businessDescription', stepFirstData.description);
                        //     setErrors(prev => ({ ...prev, businessDescription: error }));
                        // }}
                        preview="edit"
                    />
                    {from.formState.errors.description && (
                        <div className="text-red-500 text-sm mt-1">{from.formState.errors.description.message}</div>
                    )}
                    {/* {errors.businessDescription && touched.businessDescription && (
                        <div className="text-red-500 text-sm mt-1">{errors.businessDescription}</div>
                    )} */}
                    {/* <FormHelper className="text-gray-500 text-sm mt-1">This helps your AI receptionist explain your business to customers</FormHelper> */}
                </FormGroup>
                <FormGroup>
                    <FormLabel required htmlFor="timezone" className={`${from.formState.errors.timezone ? 'text-red-500' : ''}`}>
                        Timezone <span className={`${from.formState.errors.timezone ? 'text-red-500' : ''}`}>*</span>
                    </FormLabel>
                    <TimezoneSelect
                        value={from.watch('timezone') || ''}
                        onChange={(value) => {
                            from.setValue('timezone', value?.value || '');
                            from.trigger('timezone');
                        }}
                        onBlur={() => from.trigger('timezone')}
                        className={`react-select ${from.formState.errors.timezone ? 'border-red-500 ring-red-200' : ''}`}
                        placeholder="Select timezone..."
                        menuPosition="fixed"
                        menuPlacement="top"
                    />
                    {from.formState.errors.timezone && (
                        <div className="text-red-500 text-sm mt-1">{from.formState.errors.timezone.message}</div>
                    )}
                    {/* {errors.timezone && touched.timezone && (
                        <div className="text-red-500 text-sm mt-1">{errors.timezone}</div>
                    )} */}
                    {/* <FormHelper className="text-gray-500 text-sm mt-1">Select the timezone for your assistant</FormHelper> */}
                </FormGroup>
                <FormGroup>
                    <FormLabel required htmlFor="web_url" className={`${from.formState.errors.web_url ? 'text-red-500' : ''}`}>
                        Website URL <span className={`${from.formState.errors.web_url ? 'text-red-500' : ''}`}>*</span>
                    </FormLabel>
                    <FormInput
                        id="web_url"
                        name="web_url"
                        value={from.watch('web_url') || ''}
                        onChange={(e) => {
                            from.setValue('web_url', e.target.value);
                            from.trigger('web_url');
                        }}
                        onBlur={() => from.trigger('web_url')}
                        // onChange={from.register('name')}
                        placeholder="Enter company website url"
                        className={`${from.formState.errors.web_url ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                    />
                    {from.formState.errors.web_url && (
                        <div className="text-red-500 text-sm mt-1">{from.formState.errors.web_url.message}</div>
                    )}
                </FormGroup>
                <div className="flex justify-end mt-4">
                    <Button type="submit" variant="primary" disabled={!isFormValid() || isSubmitting}>
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default GeneralSettingComponent
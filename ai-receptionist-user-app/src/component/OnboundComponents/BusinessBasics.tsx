"use client"
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';


const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import {
  FormGroup,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  FormHelper
} from '../common/FormElements';
import Card from '../common/Card';
import { StepFirstData, StepSecondData, StepThirdData } from '@/lib/validations/onboarding';
import TimezoneSelect from 'react-timezone-select';

interface BusinessHours {
  start: string;
  end: string;
}

interface BusinessHoursState {
  monday: Array<{ start_time: string; end_time: string; }>;
  tuesday: Array<{ start_time: string; end_time: string; }>;
  wednesday: Array<{ start_time: string; end_time: string; }>;
  thursday: Array<{ start_time: string; end_time: string; }>;
  friday: Array<{ start_time: string; end_time: string; }>;
  saturday: Array<{ start_time: string; end_time: string; }>;
  sunday: Array<{ start_time: string; end_time: string; }>;
}

// API Business Hours interface (for API submission)
interface APIBusinessHours {
  monday: Array<{ start_time: string; end_time: string; }> | null;
  tuesday: Array<{ start_time: string; end_time: string; }> | null;
  wednesday: Array<{ start_time: string; end_time: string; }> | null;
  thursday: Array<{ start_time: string; end_time: string; }> | null;
  friday: Array<{ start_time: string; end_time: string; }> | null;
  saturday: Array<{ start_time: string; end_time: string; }> | null;
  sunday: Array<{ start_time: string; end_time: string; }> | null;
}

interface stepFirstDataState {
  businessName: string;
  businessWebsite: string;
  industryType: string;
  businessDescription: string;
  businessHours: BusinessHoursState;
}

interface TimeOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface OnboardingData {
  businessName?: string;
  industryType?: string;
  businessWebsite?: string;
  businessHours?: {
    weekdays: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
}

interface BusinessBasicsProps {
  onboardingData: {
    business_information?: StepFirstData;
    assistant_goals?: StepSecondData;
    assistant_information?: StepThirdData;
    complete_onboarding?: boolean;
  };
  onStepChange: (step: number) => void;
  stepFirstData: StepFirstData;
  setStepFirstData: React.Dispatch<React.SetStateAction<StepFirstData>>;
  onValidate: (validateFn: () => boolean) => void;
  isSubmitted: boolean;
}

const BusinessBasics: React.FC<BusinessBasicsProps> = ({
  onboardingData,
  onStepChange,
  stepFirstData,
  setStepFirstData,
  onValidate,
  isSubmitted
}) => {


  // Initialize form data

  // Initialize business hours with simpler structure
  const [businessHours, setBusinessHours] = useState<BusinessHoursState>({
    monday: stepFirstData.business_hours?.monday || [{ start_time: '09:00', end_time: '17:00' }],
    tuesday: stepFirstData.business_hours?.tuesday || [{ start_time: '09:00', end_time: '17:00' }],
    wednesday: stepFirstData.business_hours?.wednesday || [{ start_time: '09:00', end_time: '17:00' }],
    thursday: stepFirstData.business_hours?.thursday || [{ start_time: '09:00', end_time: '17:00' }],
    friday: stepFirstData.business_hours?.friday || [{ start_time: '09:00', end_time: '17:00' }],
    saturday: stepFirstData.business_hours?.saturday || [],
    sunday: stepFirstData.business_hours?.sunday || []
  });

  // Update business hours when stepFirstData changes
  useEffect(() => {
    if (stepFirstData.business_hours) {
      // Handle null values and empty arrays from API
      // Convert null to empty arrays for UI, but keep null for API submission
      const processedHours: BusinessHoursState = {
        monday: stepFirstData.business_hours.monday || [],
        tuesday: stepFirstData.business_hours.tuesday || [],
        wednesday: stepFirstData.business_hours.wednesday || [],
        thursday: stepFirstData.business_hours.thursday || [],
        friday: stepFirstData.business_hours.friday || [],
        saturday: stepFirstData.business_hours.saturday || [],
        sunday: stepFirstData.business_hours.sunday || []
      };

      // Check if all weekdays are empty/null (meaning no business hours set yet)
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (keyof BusinessHoursState)[];
      const allWeekdaysEmpty = weekdays.every(day => 
        !processedHours[day] || 
        processedHours[day].length === 0 || 
        (processedHours[day][0]?.start_time === '' && processedHours[day][0]?.end_time === '') ||
        (processedHours[day][0]?.start_time === null && processedHours[day][0]?.end_time === null)
      );

      // If all weekdays are empty, set default hours
      if (allWeekdaysEmpty) {
        const defaultHours = {
          monday: [{ start_time: '09:00', end_time: '17:00' }],
          tuesday: [{ start_time: '09:00', end_time: '17:00' }],
          wednesday: [{ start_time: '09:00', end_time: '17:00' }],
          thursday: [{ start_time: '09:00', end_time: '17:00' }],
          friday: [{ start_time: '09:00', end_time: '17:00' }],
          saturday: [],
          sunday: []
        };
        setBusinessHours(defaultHours);
        setStepFirstData(prev => ({
          ...prev,
          business_hours: convertBusinessHoursForAPI(defaultHours)
        }));
        return;
      }

      // Convert empty arrays with empty strings to closed state
      Object.keys(processedHours).forEach(day => {
        const dayKey = day as keyof BusinessHoursState;
        const dayHours = processedHours[dayKey];
        
        // If array is empty or has empty start/end times, treat as closed
        if (dayHours.length === 0 || 
            (dayHours[0]?.start_time === '' && dayHours[0]?.end_time === '') ||
            (dayHours[0]?.start_time === null && dayHours[0]?.end_time === null)) {
          processedHours[dayKey] = [];
        }
      });

      setBusinessHours(processedHours);
      
      // Update weekend toggle states based on actual business hours
      setSaturdayOpen(processedHours.saturday.length > 0);
      setSundayOpen(processedHours.sunday.length > 0);
      setOpenOnWeekends(processedHours.saturday.length > 0 || processedHours.sunday.length > 0);
      
      // Check if weekdays have different hours and switch to individual mode if needed
      const openDays = weekdays.filter(day => processedHours[day].length > 0);
      
      if (openDays.length > 0) {
        const firstOpenDay = openDays[0];
        const firstHours = processedHours[firstOpenDay][0];
        
        const hasDifferentHours = openDays.some(day => {
          const dayHours = processedHours[day][0];
          return dayHours.start_time !== firstHours.start_time || dayHours.end_time !== firstHours.end_time;
        });
        
        if (hasDifferentHours) {
          setUseCustomWeekdayHours(true);
        }
      }
    } else {
      // Initialize with default hours if no business_hours exist
      const defaultHours = {
        monday: [{ start_time: '09:00', end_time: '17:00' }],
        tuesday: [{ start_time: '09:00', end_time: '17:00' }],
        wednesday: [{ start_time: '09:00', end_time: '17:00' }],
        thursday: [{ start_time: '09:00', end_time: '17:00' }],
        friday: [{ start_time: '09:00', end_time: '17:00' }],
        saturday: [],
        sunday: []
      };
      setBusinessHours(defaultHours);
      setStepFirstData(prev => ({
        ...prev,
        business_hours: convertBusinessHoursForAPI(defaultHours)
      }));
    }
  }, [stepFirstData.business_hours, setStepFirstData]);

  // UI state
  const [useCustomWeekdayHours, setUseCustomWeekdayHours] = useState(false);
  const [openOnWeekends, setOpenOnWeekends] = useState(
    Boolean(stepFirstData.business_hours?.saturday?.length || stepFirstData.business_hours?.sunday?.length)
  );
  const [saturdayOpen, setSaturdayOpen] = useState(
    Boolean(stepFirstData.business_hours?.saturday?.length && 
            stepFirstData.business_hours?.saturday[0]?.start_time && 
            stepFirstData.business_hours?.saturday[0]?.start_time !== 'closed')
  );
  const [sundayOpen, setSundayOpen] = useState(
    Boolean(stepFirstData.business_hours?.sunday?.length && 
            stepFirstData.business_hours?.sunday[0]?.start_time && 
            stepFirstData.business_hours?.sunday[0]?.start_time !== 'closed')
  );
  const [showCustomIndustry, setShowCustomIndustry] = useState(stepFirstData.industry === 'Other');
  const [customIndustry, setCustomIndustry] = useState(showCustomIndustry ? '' : stepFirstData.industry);
  const [otherIndustry, setOtherIndustry] = useState('');
  const [showOtherIndustry, setShowOtherIndustry] = useState(stepFirstData.industry === 'Other');

  // Common weekday time state - default to 9 AM to 5 PM
  const [commonWeekdayTime, setCommonWeekdayTime] = useState<{ start_time: string; end_time: string }>({
    start_time: '09:00',
    end_time: '17:00',
  });

  // Add touched state to track which fields have been interacted with
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate a single field
  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'businessName':
        return !value?.trim() ? 'Business name is required' : '';
      case 'industryType':
        return !value ? 'Industry type is required' : '';
      case 'otherIndustry':
        if (showCustomIndustry && !value?.trim()) return 'Please specify your industry';
        return '';
      case 'businessDescription':
        if (!value?.trim()) return 'Business description is required';
        if (value.trim().length <= 10) return 'Business description must be more than 10 characters';
        return '';
      case 'businessWebsite':
        if (!value) return ''; // Website is optional
        return ''; // Accept any string
      case 'timezone':
        return !value ? 'Timezone is required' : '';
      case 'businessHours':
        // Validate business hours
        const hours = value as BusinessHoursState;
        if (!useCustomWeekdayHours) {
          // Validate common weekday hours
          if (!commonWeekdayTime.start_time) {
            return 'Weekday hours are required';
          }
          if (commonWeekdayTime.start_time !== 'closed' && !commonWeekdayTime.end_time) {
            return 'Weekday end time is required';
          }
        } else {
          // Validate individual weekday hours
          const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          for (const day of weekdays) {
            const dayHours = hours[day as keyof BusinessHoursState];
            // If day is closed (null or empty array), skip validation
            if (!dayHours || dayHours.length === 0) {
              continue;
            }
            if (!dayHours[0]?.start_time) {
              return `${day.charAt(0).toUpperCase() + day.slice(1)} hours are required`;
            }
            if (dayHours[0]?.start_time !== 'closed' && !dayHours[0]?.end_time) {
              return `${day.charAt(0).toUpperCase() + day.slice(1)} end time is required`;
            }
          }
        }
        // Validate weekend hours only if the day is marked as open
        if (saturdayOpen && (!hours.saturday || hours.saturday.length === 0)) {
          return 'Saturday hours are required';
        }
        if (sundayOpen && (!hours.sunday || hours.sunday.length === 0)) {
          return 'Sunday hours are required';
        }
        // Additional validation for weekend days that are open but have empty start/end times
        if (saturdayOpen && hours.saturday && hours.saturday.length > 0) {
          const saturdayHours = hours.saturday[0];
          if (!saturdayHours?.start_time) {
            return 'Saturday start time is required';
          }
                      if (saturdayHours.start_time !== 'closed' && !saturdayHours?.end_time) {
              return 'Saturday end time is required';
            }
        }
        if (sundayOpen && hours.sunday && hours.sunday.length > 0) {
          const sundayHours = hours.sunday[0];
          if (!sundayHours?.start_time) {
            return 'Sunday start time is required';
          }
          if (sundayHours.start_time !== 'closed' && !sundayHours?.end_time) {
            return 'Sunday end time is required';
          }
        }
        return '';
      default:
        return '';
    }
  };

  // Validate form and return result
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    const businessNameError = validateField('businessName', stepFirstData.name);
    if (businessNameError) {
      newErrors.businessName = businessNameError;
    }

    const industryError = validateField('industryType', showCustomIndustry ? 'Other' : stepFirstData.industry);
    if (industryError) {
      newErrors.industryType = industryError;
    }

    // Validate custom industry if needed
    if (showCustomIndustry) {
      const otherIndustryError = validateField('otherIndustry', customIndustry);
      if (otherIndustryError) {
        newErrors.otherIndustry = otherIndustryError;
      }
    }

    const descriptionError = validateField('businessDescription', stepFirstData.description);
    if (descriptionError) {
      newErrors.businessDescription = descriptionError;
    }

    const timezoneError = validateField('timezone', stepFirstData.timezone);
    if (timezoneError) {
      newErrors.timezone = timezoneError;
    }

    // Special validation for business hours - use converted format for API
    const convertedBusinessHours = convertBusinessHoursForAPI(businessHours);
    const hoursError = validateField('businessHours', convertedBusinessHours);
    if (hoursError) {
      newErrors.businessHours = hoursError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Always validate on blur, regardless of touched state or submission
    let value;
    const fieldMap: Record<string, keyof StepFirstData> = {
      businessName: 'name',
      businessWebsite: 'website_url',
      industryType: 'industry',
      businessDescription: 'description'
    };
    if (name === 'otherIndustry') {
      value = customIndustry;
    } else {
      const newName = fieldMap[name] || name;
      value = stepFirstData[newName];
    }

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle field change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {

    const { name, value } = e.target;

    const fieldMap: Record<string, keyof StepFirstData> = {
      businessName: 'name',
      businessWebsite: 'website_url',
      industryType: 'industry',
      businessDescription: 'description'
    };
    if (name === 'otherIndustry') {
      setOtherIndustry(value);
      setTouched(prev => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
      return;
    }
    const newName = fieldMap[name] || name;
    setStepFirstData({ ...stepFirstData, [newName]: value });

    // Mark field as touched and validate immediately
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle industry dropdown change
  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'Other') {
      setShowCustomIndustry(true);
      setCustomIndustry('');
      setStepFirstData(prev => ({ ...prev, industry: '' }));
    } else {
      setShowCustomIndustry(false);
      setCustomIndustry('');
      setStepFirstData(prev => ({ ...prev, industry: value }));
    }
    setTouched(prev => ({ ...prev, industryType: true }));
    setErrors(prev => ({ ...prev, industryType: validateField('industryType', value) }));
  };

  // Handle custom industry input change
  const handleCustomIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomIndustry(value);
    setStepFirstData(prev => ({ ...prev, industry: value }));
    setTouched(prev => ({ ...prev, otherIndustry: true }));
    setErrors(prev => ({ ...prev, otherIndustry: validateField('otherIndustry', value) }));
  };

  // Handle timezone change
  const handleTimezoneChange = (value: any) => {
    setStepFirstData({ ...stepFirstData, timezone: value.value });
    
    // Mark field as touched and validate immediately
    setTouched(prev => ({ ...prev, timezone: true }));
    const error = validateField('timezone', value.value);
    setErrors(prev => ({ ...prev, timezone: error }));
  };

  // Handle business hours changes
  const handleHoursChange = (day: keyof BusinessHoursState, field: 'start_time' | 'end_time', value: string) => {
    if (value === 'closed') {
      // Set hours for this day to empty array (closed state)
      const newHours = {
        ...businessHours,
        [day]: []
      };
      setBusinessHours(newHours);
      setStepFirstData(prevData => ({
        ...prevData,
        business_hours: convertBusinessHoursForAPI(newHours)
      }));
      
      // Update weekend toggle states if closing weekend days
      if (day === 'saturday') {
        setSaturdayOpen(false);
        setOpenOnWeekends(sundayOpen);
      } else if (day === 'sunday') {
        setSundayOpen(false);
        setOpenOnWeekends(saturdayOpen);
      }
      
      return;
    }
    
    // If start time is being set to closed, clear end time
    if (field === 'start_time' && value === 'closed') {
      const newHours = {
        ...businessHours,
        [day]: []
      };
      setBusinessHours(newHours);
      setStepFirstData(prevData => ({
        ...prevData,
        business_hours: convertBusinessHoursForAPI(newHours)
      }));
      return;
    }
    
    const currentDayHours = businessHours[day][0] || { start_time: '', end_time: '' };
    const newHours = {
      ...businessHours,
      [day]: [{ ...currentDayHours, [field]: value }]
    };
    setBusinessHours(newHours);
    setStepFirstData(prevData => ({
      ...prevData,
      business_hours: convertBusinessHoursForAPI(newHours)
    }));
  };

  // Toggle individual weekend days
  const handleWeekendDayToggle = (day: 'saturday' | 'sunday', isOpen: boolean) => {
    if (day === 'saturday') {
      setSaturdayOpen(isOpen);
    } else {
      setSundayOpen(isOpen);
    }
    
    setBusinessHours(prev => {
      const newHours = {
        ...prev,
        [day]: isOpen ? [{ start_time: '09:00', end_time: '17:00' }] : []
      };

      setStepFirstData(prev => ({
        ...prev,
        business_hours: convertBusinessHoursForAPI(newHours)
      }));

      return newHours;
    });
    
    // Update overall weekend state
    if (day === 'saturday') {
      setOpenOnWeekends(isOpen || sundayOpen);
    } else {
      setOpenOnWeekends(isOpen || saturdayOpen);
    }
  };

  // Toggle between standard and custom weekday hours
  const handleCustomHoursToggle = (useCustom: boolean) => {
    setUseCustomWeekdayHours(useCustom);
    setBusinessHours(prev => {
      const newHours = {
        ...prev,
        monday: useCustom ? [{ start_time: '09:00', end_time: '17:00' }] : [{ start_time: '09:00', end_time: '17:00' }],
        tuesday: useCustom ? [{ start_time: '09:00', end_time: '17:00' }] : [{ start_time: '09:00', end_time: '17:00' }],
        wednesday: useCustom ? [{ start_time: '09:00', end_time: '17:00' }] : [{ start_time: '09:00', end_time: '17:00' }],
        thursday: useCustom ? [{ start_time: '09:00', end_time: '17:00' }] : [{ start_time: '09:00', end_time: '17:00' }],
        friday: useCustom ? [{ start_time: '09:00', end_time: '17:00' }] : [{ start_time: '09:00', end_time: '17:00' }]
      };

      setStepFirstData(prev => ({
        ...prev,
        business_hours: convertBusinessHoursForAPI(newHours)
      }));

      return newHours;
    });
  };

  // Industry options
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

  // Helper: get all option values
  const industryOptionValues = industryOptions.map(opt => opt.value).filter(v => v && v !== 'Other');

  // Sync showCustomIndustry and customIndustry with stepFirstData.industry (for API values)
  useEffect(() => {
    if (!stepFirstData.industry) {
      setShowCustomIndustry(false);
      setCustomIndustry('');
      return;
    }
    if (industryOptionValues.includes(stepFirstData.industry)) {
      setShowCustomIndustry(false);
      setCustomIndustry('');
    } else {
      setShowCustomIndustry(true);
      setCustomIndustry(stepFirstData.industry);
    }
  }, [stepFirstData.industry]);

  // Time options
  const timeOptions = [
    { value: '', label: 'Select time', disabled: true },
    { value: 'closed', label: 'Closed' },
    { value: '07:00', label: '7:00 AM' },
    { value: '07:30', label: '7:30 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '08:30', label: '8:30 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '09:30', label: '9:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '13:30', label: '1:30 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '14:30', label: '2:30 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '15:30', label: '3:30 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '16:30', label: '4:30 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '17:30', label: '5:30 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '20:30', label: '8:30 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '21:30', label: '9:30 PM' },
    { value: '22:00', label: '10:00 PM' }
  ];



  // Filter end time options to only show times after start time
  const getEndTimeOptions = (startTime: string) => {
    if (!startTime || startTime === 'closed') return timeOptions;

    const startIndex = timeOptions.findIndex(option => option.value === startTime);
    if (startIndex === -1) return timeOptions;

    return [
      { value: '', label: 'Select time', disabled: true },
      ...timeOptions.slice(startIndex + 1)
    ];
  };

  // Sync commonWeekdayTime with businessHours if all weekdays match
  useEffect(() => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (keyof BusinessHoursState)[];
    
    // Check if all weekdays are closed
    const allClosed = days.every(day => businessHours[day].length === 0);
    if (allClosed) {
      setCommonWeekdayTime({ start_time: 'closed', end_time: '' });
      return;
    }
    
    const first = businessHours.monday[0] || { start_time: '09:00', end_time: '17:00' };
    const allSame = days.every(day =>
      businessHours[day][0]?.start_time === first.start_time &&
      businessHours[day][0]?.end_time === first.end_time
    );
    
    // If hours are different, automatically switch to individual mode
    if (!allSame && !useCustomWeekdayHours) {
      setUseCustomWeekdayHours(true);
    }
    
    if (allSame && first.start_time && first.end_time) {
      setCommonWeekdayTime({ start_time: first.start_time, end_time: first.end_time });
    } else if (!useCustomWeekdayHours) {
      // If not using custom hours, set default values to 9 AM to 5 PM
      setCommonWeekdayTime({ start_time: '09:00', end_time: '17:00' });
    }
  }, [businessHours, useCustomWeekdayHours]);

  // Handle common weekday time change
  const handleCommonWeekdayTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    if (value === 'closed') {
      // Set all weekdays to closed
      const updated = { ...businessHours };
      (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (keyof BusinessHoursState)[]).forEach(day => {
        updated[day] = [];
      });
      setBusinessHours(updated);
      setStepFirstData(prev => ({
        ...prev,
        business_hours: convertBusinessHoursForAPI(updated)
      }));
      setCommonWeekdayTime({ start_time: 'closed', end_time: '' });
      return;
    }
    
    const newTime = { ...commonWeekdayTime, [field]: value };
    setCommonWeekdayTime(newTime);
    
    // Update all weekdays
    const updated = { ...businessHours };
    (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (keyof BusinessHoursState)[]).forEach(day => {
      updated[day] = [{
        start_time: field === 'start_time' ? value : newTime.start_time,
        end_time: field === 'end_time' ? value : newTime.end_time,
      }];
    });
    setBusinessHours(updated);
    setStepFirstData(prev => ({
      ...prev,
      business_hours: convertBusinessHoursForAPI(updated)
    }));
    
    // Clear business hours error if both start and end times are set
    if (newTime.start_time && newTime.end_time && newTime.start_time !== 'closed') {
      setErrors(prev => ({ ...prev, businessHours: '' }));
    }
  };

  // Update showOtherIndustry and clear otherIndustry if needed
  useEffect(() => {
    setShowOtherIndustry(stepFirstData.industry === 'Other');
    if (stepFirstData.industry !== 'Other') {
      setOtherIndustry('');
    }
  }, [stepFirstData.industry]);

  // Convert empty arrays to null for API
  const convertBusinessHoursForAPI = (hours: BusinessHoursState): APIBusinessHours => {
    const converted: APIBusinessHours = {
      monday: hours.monday.length === 0 ? null : hours.monday,
      tuesday: hours.tuesday.length === 0 ? null : hours.tuesday,
      wednesday: hours.wednesday.length === 0 ? null : hours.wednesday,
      thursday: hours.thursday.length === 0 ? null : hours.thursday,
      friday: hours.friday.length === 0 ? null : hours.friday,
      saturday: hours.saturday.length === 0 ? null : hours.saturday,
      sunday: hours.sunday.length === 0 ? null : hours.sunday
    };
    return converted;
  };



  // Set default business hours if none exist
  useEffect(() => {
    if (!stepFirstData.business_hours) {
      const defaultHours = {
        monday: [{ start_time: '09:00', end_time: '17:00' }],
        tuesday: [{ start_time: '09:00', end_time: '17:00' }],
        wednesday: [{ start_time: '09:00', end_time: '17:00' }],
        thursday: [{ start_time: '09:00', end_time: '17:00' }],
        friday: [{ start_time: '09:00', end_time: '17:00' }],
        saturday: [],
        sunday: []
      };
      setStepFirstData(prev => ({
        ...prev,
        business_hours: convertBusinessHoursForAPI(defaultHours)
      }));
    }
  }, [stepFirstData.business_hours, setStepFirstData]);

  // Expose validation function to parent
  useEffect(() => {
    onValidate(validateForm);
  }, [onValidate, stepFirstData, isSubmitted, businessHours, useCustomWeekdayHours, openOnWeekends, showCustomIndustry, customIndustry, otherIndustry]);



  // Trigger validation check whenever form data changes
  useEffect(() => {
    validateForm();
  }, [stepFirstData, businessHours, useCustomWeekdayHours, openOnWeekends, showCustomIndustry, customIndustry, otherIndustry]);

  
// Log the converted business hours for API (empty arrays become null)
const convertedHours = convertBusinessHoursForAPI(businessHours);
console.log('Business Hours for API:', convertedHours);
console.log('Step First Data:', stepFirstData);
  return (
    <Card
      title="Tell us about your business"
      subtitle="This information helps us set up your AI receptionist"
    >
      <div className="">
        <FormGroup>
          <FormLabel required className={`${errors.businessName && touched.businessName ? 'text-red-500' : ''}`} htmlFor="business-name">
            Business Name <span className="text-red-500">*</span>
          </FormLabel>
          <FormInput
            id="businessName"
            name="businessName"
            value={stepFirstData.name || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.businessName}
            required
            label="Business Name"
            placeholder="Enter your business name"
          />
          {errors.businessName && touched.businessName && (
            <div className="text-red-500 text-sm mt-1">{errors.businessName}</div>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel required className={`${errors.industryType && touched.industryType ? 'text-red-500' : ''}`} htmlFor="industryType">
            Industry <span className="text-red-500">*</span>
          </FormLabel>
          <select
            id="industryType"
            name="industryType"
            value={showCustomIndustry ? 'Other' : (stepFirstData.industry || '')}
            onChange={handleIndustryChange}
            onBlur={handleBlur}
            className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${errors.industryType && touched.industryType ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
            required
          >
            {/* <option value="" disabled>Select your industry</option> */}
            {industryOptions.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
            ))}
          </select>
          {errors.industryType && touched.industryType && (
            <div className="text-red-500 text-sm mt-1">{errors.industryType}</div>
          )}
          {/* Show custom industry input if 'Other' is selected */}
          {showCustomIndustry && (
            <div className="mt-2">
              <FormLabel required htmlFor="otherIndustry" className={`${errors.otherIndustry && touched.otherIndustry ? 'text-red-500' : ''}`}>Please specify your industry</FormLabel>
              <input
                id="otherIndustry"
                name="otherIndustry"
                type="text"
                value={customIndustry}
                onChange={handleCustomIndustryChange}
                onBlur={handleBlur}
                className={`w-full p-2 border h-12 border-gray-300 rounded placeholder:text-gray-400 text-black ${errors.otherIndustry && touched.otherIndustry ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
                placeholder="Enter your industry"
                required
              />
              {errors.otherIndustry && touched.otherIndustry && (
                <div className="text-red-500 text-sm mt-1">{errors.otherIndustry}</div>
              )}
            </div>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel className={`${errors.businessWebsite && touched.businessWebsite ? 'text-red-500' : ''}`} htmlFor="businessWebsite">
            Website URL (Optional)
          </FormLabel>
          <input
            id="businessWebsite"
            name="businessWebsite"
            type="text"
            value={stepFirstData.website_url || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.businessWebsite && touched.businessWebsite ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://www.example.com"
          />
          {errors.businessWebsite && touched.businessWebsite && (
            <div className="text-red-500 text-sm mt-1">{errors.businessWebsite}</div>
          )}
          <FormHelper className="text-gray-500 text-sm mt-1">We'll use this to gather information about your business</FormHelper>
        </FormGroup>

        <FormGroup>
          <FormLabel required className={`${errors.businessDescription && touched.businessDescription ? 'text-red-500' : ''}`} htmlFor="businessDescription">
            Brief Description <span className="text-red-500">*</span>
          </FormLabel>
          <MDEditor
            className="w-full"
            data-color-mode="light"
            value={stepFirstData.description || ''}
            onChange={(value) => {
              if (value && value.length > 5000) {
                return; // Don't update if over limit
              }
              setStepFirstData(prev => ({ ...prev, description: value || '' }));
            }}
            onBlur={() => {
              setTouched(prev => ({ ...prev, businessDescription: true }));
              const error = validateField('businessDescription', stepFirstData.description);
              setErrors(prev => ({ ...prev, businessDescription: error }));
            }}
            preview="edit"
          />
          {errors.businessDescription && touched.businessDescription && (
            <div className="text-red-500 text-sm mt-1">{errors.businessDescription}</div>
          )}
          <FormHelper className="text-gray-500 text-sm mt-1">This helps your AI receptionist explain your business to customers</FormHelper>
        </FormGroup>
        <FormGroup>
          <FormLabel required className={`${errors.timezone && touched.timezone ? 'text-red-500' : ''}`} htmlFor="timezone">
            Timezone <span className="text-red-500">*</span>
          </FormLabel>
          <TimezoneSelect
            value={stepFirstData.timezone || ''}
            onChange={handleTimezoneChange}
            onBlur={() => {
              setTouched(prev => ({ ...prev, timezone: true }));
              const error = validateField('timezone', stepFirstData.timezone);
              setErrors(prev => ({ ...prev, timezone: error }));
            }}
            className={`react-select ${errors.timezone && touched.timezone ? 'border-red-500' : ''}`}
            placeholder="Select timezone..."
          />
          {errors.timezone && touched.timezone && (
            <div className="text-red-500 text-sm mt-1">{errors.timezone}</div>
          )}
          <FormHelper className="text-gray-500 text-sm mt-1">Select the timezone for your assistant</FormHelper>
        </FormGroup>

        <div className="mt-8">
          <FormLabel className={`text-lg font-semibold ${errors.businessHours ? 'text-red-500' : 'text-gray-800'}`}>
            Business Hours <span className="text-red-500">*</span>
          </FormLabel>
          <FormHelper className="text-gray-600 text-sm mt-1 mb-4">
            Set your business hours to help the AI receptionist know when to schedule appointments and take messages
          </FormHelper>

          <div className={`bg-white rounded-xl border-2 ${errors.businessHours ? 'border-red-300' : 'border-gray-200'} shadow-sm`}>
            {/* Header with mode toggle */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Weekday Hours</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Same hours</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!useCustomWeekdayHours}
                      onChange={() => {
                        handleCustomHoursToggle(!useCustomWeekdayHours);
                        if (useCustomWeekdayHours) {
                          const updated = { ...businessHours };
                          (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (keyof BusinessHoursState)[]).forEach(day => {
                            updated[day] = [{
                              start_time: commonWeekdayTime.start_time,
                              end_time: commonWeekdayTime.end_time,
                            }];
                          });
                          setBusinessHours(updated);
                          setStepFirstData(prev => ({
                            ...prev,
                            business_hours: updated
                          }));
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${!useCustomWeekdayHours ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 transition-transform duration-200 ease-in-out ${!useCustomWeekdayHours ? 'translate-x-5' : ''}`} />
                    </div>
                  </label>
                  <span className="text-sm text-gray-600">Individual hours</span>
                </div>
              </div>

              {/* Standard weekday hours */}
              {!useCustomWeekdayHours && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Monday - Friday</span>
                    <div className="flex items-center gap-2">
                      <FormSelect
                        value={commonWeekdayTime.start_time}
                        onChange={e => handleCommonWeekdayTimeChange('start_time', e.target.value)}
                        options={timeOptions}
                        className={`w-32 ${errors.businessHours ? 'border-red-500' : ''}`}
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <FormSelect
                        value={commonWeekdayTime.end_time}
                        onChange={e => handleCommonWeekdayTimeChange('end_time', e.target.value)}
                        options={getEndTimeOptions(commonWeekdayTime.start_time)}
                        disabled={!commonWeekdayTime.start_time || commonWeekdayTime.start_time === 'closed'}
                        className={`w-32 ${errors.businessHours ? 'border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom weekday hours */}
              {useCustomWeekdayHours && (
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                    const isDayClosed = businessHours[day as keyof BusinessHoursState].length === 0;
                    return (
                      <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 capitalize w-20">{day}</span>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isDayClosed}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleHoursChange(day as keyof BusinessHoursState, 'start_time', 'closed');
                                } else {
                                  handleHoursChange(day as keyof BusinessHoursState, 'start_time', '09:00');
                                  handleHoursChange(day as keyof BusinessHoursState, 'end_time', '17:00');
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`w-6 h-3 rounded-full transition-colors duration-200 ease-in-out ${isDayClosed ? 'bg-red-500' : 'bg-gray-300'} relative`}>
                              <div className={`absolute w-2 h-2 bg-white rounded-full top-0.5 transition-transform duration-200 ease-in-out ${isDayClosed ? 'translate-x-3' : 'translate-x-0.5'}`} />
                            </div>
                          </label>
                          <span className={`text-xs ${isDayClosed ? 'text-red-600' : 'text-gray-500'}`}>
                            {isDayClosed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FormSelect
                            value={businessHours[day as keyof BusinessHoursState][0]?.start_time || ''}
                            onChange={(e) => handleHoursChange(day as keyof BusinessHoursState, 'start_time', e.target.value)}
                            options={timeOptions.filter(option => option.value !== 'closed')}
                            disabled={isDayClosed}
                            className="w-28"
                          />
                          <span className="text-gray-500 text-sm">to</span>
                          <FormSelect
                            value={businessHours[day as keyof BusinessHoursState][0]?.end_time || ''}
                            onChange={(e) => handleHoursChange(day as keyof BusinessHoursState, 'end_time', e.target.value)}
                            options={getEndTimeOptions(businessHours[day as keyof BusinessHoursState][0]?.start_time || '')}
                            disabled={isDayClosed || !businessHours[day as keyof BusinessHoursState][0]?.start_time}
                            className="w-28"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekend section */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Weekend Hours</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openOnWeekends}
                      onChange={() => {
                        const newWeekendState = !openOnWeekends;
                        setOpenOnWeekends(newWeekendState);
                        
                        if (newWeekendState) {
                          // Opening weekends - set default hours for both days
                          setSaturdayOpen(true);
                          setSundayOpen(true);
                          setBusinessHours(prev => {
                            const newHours = {
                              ...prev,
                              saturday: [{ start_time: '09:00', end_time: '17:00' }],
                              sunday: [{ start_time: '09:00', end_time: '17:00' }]
                            };
                            setStepFirstData(prevData => ({
                              ...prevData,
                              business_hours: convertBusinessHoursForAPI(newHours)
                            }));
                            return newHours;
                          });
                        } else {
                          // Closing weekends - clear both days
                          setSaturdayOpen(false);
                          setSundayOpen(false);
                          setBusinessHours(prev => {
                            const newHours = {
                              ...prev,
                              saturday: [],
                              sunday: []
                            };
                            setStepFirstData(prevData => ({
                              ...prevData,
                              business_hours: convertBusinessHoursForAPI(newHours)
                            }));
                            return newHours;
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${openOnWeekends ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 transition-transform duration-200 ease-in-out ${openOnWeekends ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">Open on weekends</span>
                  </label>
                </div>
              </div>

              {/* Weekend hours */}
              {openOnWeekends && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-20">Saturday</span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={businessHours.saturday.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleHoursChange('saturday', 'start_time', 'closed');
                            } else {
                              handleHoursChange('saturday', 'start_time', '09:00');
                              handleHoursChange('saturday', 'end_time', '17:00');
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-6 h-3 rounded-full transition-colors duration-200 ease-in-out ${businessHours.saturday.length === 0 ? 'bg-red-500' : 'bg-gray-300'} relative`}>
                          <div className={`absolute w-2 h-2 bg-white rounded-full top-0.5 transition-transform duration-200 ease-in-out ${businessHours.saturday.length === 0 ? 'translate-x-3' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                      <span className={`text-xs ${businessHours.saturday.length === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {businessHours.saturday.length === 0 ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormSelect
                        value={businessHours.saturday[0]?.start_time || ''}
                        onChange={(e) => handleHoursChange('saturday', 'start_time', e.target.value)}
                        options={timeOptions.filter(option => option.value !== 'closed')}
                        disabled={businessHours.saturday.length === 0}
                        className="w-28"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <FormSelect
                        value={businessHours.saturday[0]?.end_time || ''}
                        onChange={(e) => handleHoursChange('saturday', 'end_time', e.target.value)}
                        options={getEndTimeOptions(businessHours.saturday[0]?.start_time || '')}
                        disabled={businessHours.saturday.length === 0 || !businessHours.saturday[0]?.start_time}
                        className="w-28"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-20">Sunday</span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={businessHours.sunday.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleHoursChange('sunday', 'start_time', 'closed');
                            } else {
                              handleHoursChange('sunday', 'start_time', '09:00');
                              handleHoursChange('sunday', 'end_time', '17:00');
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-6 h-3 rounded-full transition-colors duration-200 ease-in-out ${businessHours.sunday.length === 0 ? 'bg-red-500' : 'bg-gray-300'} relative`}>
                          <div className={`absolute w-2 h-2 bg-white rounded-full top-0.5 transition-transform duration-200 ease-in-out ${businessHours.sunday.length === 0 ? 'translate-x-3' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                      <span className={`text-xs ${businessHours.sunday.length === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {businessHours.sunday.length === 0 ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormSelect
                        value={businessHours.sunday[0]?.start_time || ''}
                        onChange={(e) => handleHoursChange('sunday', 'start_time', e.target.value)}
                        options={timeOptions.filter(option => option.value !== 'closed')}
                        disabled={businessHours.sunday.length === 0}
                        className="w-28"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <FormSelect
                        value={businessHours.sunday[0]?.end_time || ''}
                        onChange={(e) => handleHoursChange('sunday', 'end_time', e.target.value)}
                        options={getEndTimeOptions(businessHours.sunday[0]?.start_time || '')}
                        disabled={businessHours.sunday.length === 0 || !businessHours.sunday[0]?.start_time}
                        className="w-28"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {errors.businessHours && (
            <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.businessHours}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BusinessBasics;
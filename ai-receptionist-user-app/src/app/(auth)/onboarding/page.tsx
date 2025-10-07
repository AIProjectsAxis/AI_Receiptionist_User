"use client"
export const runtime = 'edge';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stepFirstSchema, stepSecondSchema, stepThirdSchema, onboardingSchema } from '@/lib/validations/onboarding';
import type { StepFirstData, StepSecondData, StepThirdData } from '@/lib/validations/onboarding';
import * as z from 'zod';

// Import updated onboarding step components
import BusinessBasics from '@/component/OnboundComponents/BusinessBasics';
import UseCaseGoals from '@/component/OnboundComponents/UseCaseGoals';
import CustomerInteraction from '@/component/OnboundComponents/CustomerInteractions';
import ReviewLaunch from '@/component/OnboundComponents/ReviewLaunch';
import Button from '@/component/common/Button';
import { getCompanyOnBoardingApiRequest, OnBoardingApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import Image from 'next/image';


const OnboardingPage = (): JSX.Element => {
  const router = useRouter();
  const singleLoad = useRef(false);
  const [verifyOnboarding, setVerifyOnboarding] = useState(true);
  const [checkApproved, setCheckApproved] = useState("");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isStepSubmitted, setIsStepSubmitted] = useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetSection, setTargetSection] = useState<string | undefined>(undefined);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Add refs for step validation
  const step1ValidateRef = useRef<(() => boolean) | null>(null);
  const step2ValidateRef = useRef<(() => boolean) | null>(null);
  const step3ValidateRef = useRef<(() => boolean) | null>(null);

  // Add state to track if current step is valid
  const [isCurrentStepValid, setIsCurrentStepValid] = useState<boolean>(false);

  // State for form data using the schema types
  const [stepFirstData, setStepFirstData] = useState<StepFirstData>({
    name: '',
    industry: ``,
    description: '',
    website_url: '',
    business_hours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
    timezone: "",

  });

  const [secondStepData, setSecondStepData] = useState<StepSecondData>({
    // communication_medium: undefined,
    tasks: [],
    goals: [],
    status_onboarding: "step_2"
  });

  const [thirdStepData, setThirdStepData] = useState<StepThirdData>({
    first_message: '',
    communication_style: undefined,
    support_languages: ['English'],
    information_to_collect: [],
    key_questions: [],
    knowledge_base: '',
    faqs: [],
    keywords: [],
    customer_questions: [],
    status_onboarding: "step_3"
  });

  const totalSteps = 4;
  const stepLabels = [
    'Business Basics',
    'Use Case Goals',
    'Customer Interactions',
    'Review & Launch'
  ];

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const nextStep = async () => {
    setIsStepSubmitted(prev => ({ ...prev, [currentStep]: true }));
    let isValid = true;

    switch (currentStep) {
      case 1:
        isValid = step1ValidateRef.current?.() ?? false;
        if (isValid) {
          await onSubmit();
        }
        break;
      case 2:
        isValid = step2ValidateRef.current?.() ?? false;
        if (isValid) {
          await onSubmit();
        }
        break;
      case 3:
        isValid = step3ValidateRef.current?.() ?? false;
        if (isValid) {
          await onSubmit();
        }
        break;
      case 4:
        await onSubmit();
        break;
    }

    if (!isValid) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => [...prev, currentStep]);
    }
  };

  // Function to check if current step is valid
  const checkCurrentStepValidity = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = step1ValidateRef.current?.() ?? false;
        break;
      case 2:
        isValid = step2ValidateRef.current?.() ?? false;
        break;
      case 3:
        isValid = step3ValidateRef.current?.() ?? false;
        break;
      case 4:
        isValid = true; // Step 4 doesn't have validation
        break;
      default:
        isValid = false;
    }

    setIsCurrentStepValid(isValid);
  };

  // Function to get specific error message for current step
  const getCurrentStepErrorMessage = () => {
    switch (currentStep) {
      case 1:
        if (!stepFirstData.name?.trim()) return "Business name is required";
        if (!stepFirstData.industry) return "Industry is required";
        if (!stepFirstData.description?.trim()) return "Business description is required";
        if (!stepFirstData.timezone) return "Timezone is required";

        // Check if at least one weekday has hours (not all days can be closed)
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const hasOpenWeekdays = weekdays.some(day => {
          const dayHours = stepFirstData.business_hours?.[day as keyof typeof stepFirstData.business_hours];
          return dayHours && dayHours.length > 0;
        });
        if (!hasOpenWeekdays) return "At least one weekday must be open";

        return "Please complete all required fields";
      case 2:
        if (!secondStepData.goals?.length) return "Please select at least one goal";
        return "Please complete all required fields";
      case 3:
        if (!thirdStepData.first_message?.trim()) return "First message is required";
        if (!thirdStepData.communication_style) return "Communication style is required";
        if (!thirdStepData.support_languages?.length) return "Please select at least one language";
        if (!thirdStepData.information_to_collect?.length) return "Please select information fields to collect";
        return "Please complete all required fields";
      default:
        return "Please complete all required fields";
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      // Save current step data before going back
      try {
        await saveCurrentStepData();
      } catch (error) {
        console.error('Error saving step data:', error);
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = async (step: number) => {
    // Save current step data before switching
    if (step !== currentStep) {
      try {
        await saveCurrentStepData();
      } catch (error) {
        console.error('Error saving step data:', error);
      }
    }

    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const handleStepChange = async (step: number, section?: string) => {
    console.log('OnboardingPage: handleStepChange called with step:', step, 'section:', section);
    // Save current step data before switching (only if not navigating to a section)
    if (!section && step !== currentStep) {
      try {
        await saveCurrentStepData();
      } catch (error) {
        console.error('Error saving step data:', error);
      }
    }

    if (section) {
      // When navigating to a specific section, set the step and target section
      // Let the target component handle the scrolling
      console.log('OnboardingPage: Setting target section to:', section);
      setCurrentStep(step);
      setTargetSection(section);

      // Clear target section after a delay to allow CustomerInteraction to handle scrolling
      setTimeout(() => {
        console.log('OnboardingPage: Clearing target section');
        setTargetSection(undefined);
      }, 5000);
    } else {
      // Regular step navigation
      setCurrentStep(step);
      setTargetSection(section);
    }
  };

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const onSubmit = async () => {
    try {
      let payload;
      if (currentStep === 4) {
        payload = {
          business_information: stepFirstData,
          assistant_goals: secondStepData,
          assistant_information: thirdStepData,
          complete_onboarding: true
        };
        await onboardingSchema.parseAsync(payload);
        const res = await OnBoardingApiRequest(payload);
        toast.success('Onboarding completed successfully', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        router.push('/approval-pending');
      } else {
        payload = {
          business_information: currentStep === 1 ? stepFirstData : undefined,
          assistant_goals: currentStep === 2 ? secondStepData : undefined,
          assistant_information: currentStep === 3 ? thirdStepData : undefined,
          complete_onboarding: false
        };

        if (currentStep === 1) {
          await stepFirstSchema.parseAsync(stepFirstData);
        } else if (currentStep === 2) {
          await stepSecondSchema.parseAsync(secondStepData);
        } else if (currentStep === 3) {
          await stepThirdSchema.parseAsync(thirdStepData);
        }

        const res = await OnBoardingApiRequest(payload);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        console.error('Validation Error:', firstError.message);
      } else {
        console.error('An error occurred while submitting the form.');
      }
    }
  };

  const saveCurrentStepData = async () => {
    try {
      let payload;

      switch (currentStep) {
        case 1:
          payload = {
            business_information: stepFirstData,
            complete_onboarding: false
          };
          await stepFirstSchema.parseAsync(stepFirstData);
          break;
        case 2:
          payload = {
            assistant_goals: secondStepData,
            complete_onboarding: false
          };
          await stepSecondSchema.parseAsync(secondStepData);
          break;
        case 3:
          payload = {
            assistant_information: thirdStepData,
            complete_onboarding: false
          };
          await stepThirdSchema.parseAsync(thirdStepData);
          break;
        default:
          return;
      }

      console.log('Auto-saving step', currentStep, 'data:', payload);
      await OnBoardingApiRequest(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation Error during auto-save:', error.errors[0].message);
      } else {
        console.error('Error auto-saving step data:', error);
      }
    }
  };

  const completeOnboarding = async () => {
    setIsGenerating(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getOnBoarding = async () => {
    setVerifyOnboarding(true);
    try {
      const res: any = await getCompanyOnBoardingApiRequest();
      setCheckApproved(res?.data?.status);
      if (res?.data?.status_onboarding === "completed" && verifyOnboarding && checkApproved === "approved") {
        router.push('/dashboard');
        setVerifyOnboarding(false);
        return;
      }
      else if (res?.data?.status_onboarding === "completed" && verifyOnboarding && checkApproved !== "approved") {
        router.push('/approval-pending');
        setVerifyOnboarding(false);
        return;
      }
      setVerifyOnboarding(false);
      if (res?.data) {
        // Process business hours to ensure proper format
        const processBusinessHours = (hours: any) => {
          if (!hours) return {
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null,
            saturday: null,
            sunday: null
          };

          // Ensure we maintain the exact format from the API
          // Convert null values to empty arrays for UI, but keep null for API
          const processedHours = {
            monday: hours.monday || null,
            tuesday: hours.tuesday || null,
            wednesday: hours.wednesday || null,
            thursday: hours.thursday || null,
            friday: hours.friday || null,
            saturday: hours.saturday || null,
            sunday: hours.sunday || null
          };
          return processedHours;
        };

        // Set business information (Step 1) - data is at root level
        const newStepFirstData = {
          name: res.data.name || '',
          industry: res.data.industry || '',
          description: res.data.description || '',
          website_url: res.data.website_url || '',
          timezone: res?.data?.status_onboarding !== "pending_onboarding" ? res.data.timezone : '',
          business_hours: processBusinessHours(res.data.business_hours)
        };

        setStepFirstData(newStepFirstData);

        // Set assistant goals (Step 2) - if available
        if (res.data.assistant_goals) {
          const newSecondStepData = {
            // communication_medium: res.data.assistant_goals.communication_medium || undefined,
            tasks: res.data.assistant_goals.tasks || [],
            goals: res.data.assistant_goals.goals || [],
            status_onboarding: res.data.assistant_goals.status_onboarding || "step_2"
          };
          setSecondStepData(newSecondStepData);
        }

        // Set assistant information (Step 3) - if available
        if (res.data.assistant_information) {
          const newThirdStepData = {
            first_message: res.data.assistant_information.first_message || '',
            communication_style: res.data.assistant_information.communication_style || undefined,
            support_languages: res?.data?.assistant_information?.support_languages || ['English'],
            information_to_collect: res.data.assistant_information.information_to_collect || [],
            key_questions: res.data.assistant_information?.key_questions || [],
            knowledge_base: res.data.assistant_information.knowledge_base || '',
            faqs: res.data.assistant_information?.faqs || [],
            keywords: res.data.assistant_information?.keywords || [],
            customer_questions: res.data.assistant_information?.customer_questions || [],

            status_onboarding: res.data.assistant_information.status_onboarding || "step_3"
          };
          setThirdStepData(newThirdStepData);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    }
  };


  useEffect(() => {
    if (!singleLoad.current) {
      getOnBoarding();
      singleLoad.current = true;
    }
  }, []);

  // Check validity whenever form data changes
  useEffect(() => {
    checkCurrentStepValidity();
  }, [stepFirstData, secondStepData, thirdStepData, currentStep]);

  // Handle section scrolling when targetSection is set
  useEffect(() => {
    if (targetSection && currentStep === 3) {
      // Wait for the component to render, then scroll to the section
      setTimeout(() => {
        const sectionId = `${targetSection}-section`;
        const element = document.getElementById(sectionId);

        if (element && mainRef.current) {
          // Calculate the position relative to the main container
          const containerRect = mainRef.current.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;
          const targetScrollTop = mainRef.current.scrollTop + relativeTop - 100; // 100px offset

          // Smooth scroll to the section
          mainRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [targetSection, currentStep]);

  // Robust scroll to top on step change (but not when navigating to specific sections)
  useLayoutEffect(() => {
    // Only scroll to top if we're not navigating to a specific section
    if (!targetSection) {
      window.history.scrollRestoration = 'manual';
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      }
    }
  }, [currentStep, targetSection]);

  const renderStep = () => {
    const commonOnboardingData = {
      business_information: stepFirstData,
      assistant_goals: secondStepData,
      assistant_information: thirdStepData,
      complete_onboarding: currentStep === 4
    };

    const commonProps = {
      onboardingData: commonOnboardingData,
      onStepChange: handleStepChange,
      isSubmitted: isStepSubmitted[currentStep] || false
    };

    switch (currentStep) {
      case 1:
        return (
          <BusinessBasics
            {...commonProps}
            stepFirstData={stepFirstData}
            setStepFirstData={setStepFirstData}
            onValidate={(validateFn) => {
              step1ValidateRef.current = validateFn;
              // Check validity after setting the validation function
              setTimeout(() => checkCurrentStepValidity(), 0);
            }}
          />
        );
      case 2:
        return (
          <UseCaseGoals
            {...commonProps}
            secondStepData={secondStepData}
            setSecondStepData={setSecondStepData}
            onValidate={(validateFn) => {
              step2ValidateRef.current = validateFn;
              // Check validity after setting the validation function
              setTimeout(() => checkCurrentStepValidity(), 0);
            }}
          />
        );
      case 3:
        return (
          <CustomerInteraction
            {...commonProps}
            thirdStepData={thirdStepData}
            setThirdStepData={setThirdStepData}
            targetSection={targetSection}
            onValidate={(validateFn) => {
              step3ValidateRef.current = validateFn;
              // Check validity after setting the validation function
              setTimeout(() => checkCurrentStepValidity(), 0);
            }}
          />
        );
      case 4:
        return <ReviewLaunch {...commonProps} onComplete={completeOnboarding} />;
      default:
        return null;
    }
  };

  return (
    <>
      {
        verifyOnboarding && (
          <div className="h-screen w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )
      }
      {
        !verifyOnboarding && (

          <div ref={mainContainerRef} className="onboarding-container flex min-h-screen flex-col">
            {/* Background decorative elements */}
            <div className="glass-decoration glass-circle-1"></div>
            <div className="glass-decoration glass-circle-2"></div>
            <div className="glass-decoration glass-circle-3"></div>

            <header className="absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 shadow-sm backdrop-blur-md lg:px-6">
              <div className="flex items-center gap-3  text-center justify-center">
                <div className="border border-gray-200 text-white rounded-md w-[48px] h-[48px] flex items-center justify-center shadow-sm font-bold text-[24px]">
                  <Image src="/eva_logo.png" alt="logo" width={30} height={30} />
                </div>
                <h1 className="text-xl font-bold logo-text text-[28px]">
                  <span className=" ">EvaSpeaks</span>
                </h1>

              </div>

              {/* <button
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600"
          onClick={() => router.push('/dashboard')}
        >
          Skip Setup
          <svg
            className="skip-icon opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button> */}
            </header>

            <div className="relative overflow-hidden flex flex-1 mt-16">
              <aside
                className={` bottom-0  z-30 flex w-80 flex-col overflow-y-scroll  border-r border-gray-200 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 `}
              >
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Current Step
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                        {currentStep}
                      </div>
                      <div className="text-sm font-semibold text-indigo-800">
                        {stepLabels[currentStep - 1]}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-gray-200 bg-white/50 p-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="text-xs font-semibold text-indigo-600">
                        {progressPercentage}% Complete
                      </div>
                      <div className="rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-500">
                        {currentStep}/{totalSteps}
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-800 transition-all duration-500 ease-in-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      STEPS
                    </div>
                    <nav>
                      {stepLabels.map((label, index) => {
                        const isActive = index + 1 === currentStep;
                        const isCompleted = completedSteps.includes(index + 1);

                        return (
                          <div
                            key={index}
                            className={`relative mb-1 flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200 ${isActive
                              ? 'bg-indigo-100 font-semibold text-indigo-700 before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:rounded-r-md before:bg-indigo-600'
                              : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                              } ${isCompleted ? 'text-gray-600' : ''}`}
                            onClick={() => goToStep(index + 1)}
                          >
                            <div
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isCompleted ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                                } ${isActive && !isCompleted ? 'bg-indigo-200 text-indigo-600' : ''}`}
                            >
                              {isCompleted ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="block">{label}</span>
                              <div className="text-xs font-normal text-gray-500">
                                {index === 0 && 'Basic company information'}
                                {index === 1 && 'Define your AI agent\'s purpose'}
                                {index === 2 && 'Configure customer interactions'}
                                {index === 3 && 'Add FAQs and knowledge sources'}
                                {index === 4 && 'Review and launch your AI agent'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="mt-8 px-3 py-4">
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-0.5 text-sm font-semibold text-gray-800">Need help?</h4>
                        <p className="mb-3 text-xs text-gray-600">Check our documentation</p>
                        <button className="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors duration-200 hover:border-indigo-600 hover:bg-indigo-50">
                          View Docs
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <main
                ref={mainRef as any}
                className={`flex-1 overflow-y-scroll overflow-x-hidden p-6 transition-all duration-300 `}
              >
                <div className="mx-auto w-full max-w-4xl">
                  {renderStep()}

                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    {!isFirstStep && (
                      <Button variant="secondary" disabled={isGenerating} onClick={prevStep}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="19" y1="12" x2="5" y2="12"></line>
                          <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back
                      </Button>
                    )}

                    {isLastStep ? (
                      // <Button 
                      //   variant="primary" 
                      //   onClick={completeOnboarding} 
                      //   className="ml-auto hidden"
                      //   disabled={isGenerating}
                      // >
                      //   {isGenerating ? (
                      //     <>
                      //       <svg
                      //         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      //         xmlns="http://www.w3.org/2000/svg"
                      //         fill="none"
                      //         viewBox="0 0 24 24"
                      //       >
                      //         <circle
                      //           className="opacity-25"
                      //           cx="12"
                      //           cy="12"
                      //           r="10"
                      //           stroke="currentColor"
                      //           strokeWidth="4"
                      //         ></circle>
                      //         <path
                      //           className="opacity-75"
                      //           fill="currentColor"
                      //           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      //         ></path>
                      //       </svg>
                      //       Generating...
                      //     </>
                      //   ) : (
                      //     <>
                      //       Generate AI Agent
                      //       <svg
                      //         xmlns="http://www.w3.org/2000/svg"
                      //         width="18"
                      //         height="18"
                      //         viewBox="0 0 24 24"
                      //         fill="none"
                      //         stroke="currentColor"
                      //         strokeWidth="2"
                      //         strokeLinecap="round"
                      //         strokeLinejoin="round"
                      //       >
                      //         <polyline points="20 6 9 17 4 12"></polyline>
                      //       </svg>
                      //     </>
                      //   )}
                      // </Button>
                      <></>
                    ) : (
                      <div className="ml-auto">
                        <Button
                          variant="primary"
                          type="submit"
                          onClick={nextStep}
                          disabled={!isCurrentStepValid}
                        >
                          Continue
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </Button>
                        {!isCurrentStepValid && (
                          <div className="text-red-500 text-xs mt-1 text-center">
                            {getCurrentStepErrorMessage()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </main>
            </div>

            {/* Mobile menu toggle and indicator (moved to be always visible but conditionally styled) */}
            {isMobile && (
              <>
                <button
                  className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-indigo-700"
                  onClick={toggleSidebar}
                  aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {sidebarOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </>
                    ) : (
                      <>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </>
                    )}
                  </svg>
                </button>

                <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-gray-200 bg-white/80 p-4 shadow-lg backdrop-blur-md lg:hidden">
                  <div className="mb-2 text-center text-sm font-medium text-gray-700">
                    Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-800 transition-all duration-500 ease-in-out"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}

            {/* Global styles for decorative elements */}
            <style jsx global>{`
        .glass-decoration {
          position: fixed;
          z-index: -1;
          border-radius: 50%;
          opacity: 0.5;
          filter: blur(80px);
        }

        .glass-circle-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, rgba(67, 97, 238, 0.15), rgba(114, 9, 183, 0.08));
          top: -100px;
          right: -50px;
          animation: float 25s ease-in-out infinite alternate;
        }

        .glass-circle-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, rgba(6, 214, 160, 0.1), rgba(76, 201, 240, 0.08));
          bottom: -150px;
          left: -100px;
          animation: float 30s ease-in-out infinite alternate-reverse;
        }

        .glass-circle-3 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, rgba(247, 37, 133, 0.08), rgba(251, 133, 0, 0.05));
          top: 30%;
          right: 10%;
          animation: float 20s ease-in-out infinite alternate;
        }

        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(8px, 8px) rotate(3deg);
          }
        }

        /* Specific classes for hover effects that Tailwind doesn't directly support this way */
        .skip-button:hover .skip-icon {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
          </div>
        )
      }
    </>
  );
};
export default OnboardingPage;

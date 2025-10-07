"use client"
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Card from '../common/Card';
import { StepFirstData, StepSecondData, StepThirdData } from '@/lib/validations/onboarding';
import { fetchVoices } from '@/network/elevenlabs';

// const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import MDEditor from '@uiw/react-md-editor';
// import "@uiw/react-md-editor/markdown-editor.css";
// import "@uiw/react-markdown-preview/markdown.css";


interface ReviewLaunchProps {
  onboardingData: {
    business_information?: StepFirstData;
    assistant_goals?: StepSecondData;
    assistant_information?: StepThirdData;
    complete_onboarding?: boolean;
  };
  onStepChange: (step: number, section?: string) => void;
  onComplete: () => void;
}
  
const ReviewLaunch: React.FC<ReviewLaunchProps> = ({ onboardingData, onStepChange, onComplete }) => {
  const { business_information, assistant_goals, assistant_information } = onboardingData;
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleEditStep = (step: number, section?: string) => {
    console.log('ReviewLaunch: handleEditStep called with step:', step, 'section:', section);
    // For section navigation, let the target component handle scrolling
    onStepChange(step, section);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await onComplete();
    } catch (error) {
      console.error('Error launching AI receptionist:', error);
      setIsLaunching(false);
    }
  };

  // Fetch voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voicesData = await fetchVoices();
        setVoices(voicesData);
        
        // Find the selected voice based on communication_style
        if (assistant_information?.communication_style && voicesData.length > 0) {
          const voice = voicesData.find((v: any) => v.voice_id === assistant_information.communication_style);
          setSelectedVoice(voice);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    loadVoices();
  }, [assistant_information?.communication_style]);

  return (
    <>
      <Card
        title="Review and Launch"
        subtitle="Review your AI receptionist's configuration before launching"
      >
      <div className="max-w-6xl mx-auto">
        <div className="space-y-10">
          {/* Business Information Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Business Information</h3>
                  <p className="text-sm text-gray-500">Your company details and operating hours</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Business Name</div>
                  <div className="text-lg font-semibold text-gray-900 bg-white/60 px-4 py-3 rounded-xl border border-gray-100">
                    {business_information?.name || 'Not set'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Industry</div>
                  <div className="text-lg font-semibold text-gray-900 bg-white/60 px-4 py-3 rounded-xl border border-gray-100">
                    {business_information?.industry || 'Not set'}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</div>
                  {business_information?.description ? (
                    <div className="bg-white/60 ">
                      <div className="md-editor-preview-only">
                        <MDEditor
                          value={business_information.description}
                          preview="preview"
                          data-color-mode="light"
                          style={{ border: 'none', backgroundColor: 'transparent' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400 bg-white/60 px-4 py-3 rounded-xl border border-gray-100">Not set</div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Website URL</div>
                  <div className="text-lg font-semibold text-gray-900 bg-white/60 px-4 py-3 rounded-xl border border-gray-100">
                    {business_information?.website_url || 'Not set'}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Business Hours</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    {business_information?.business_hours ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { day: 'Monday', data: business_information.business_hours.monday },
                          { day: 'Tuesday', data: business_information.business_hours.tuesday },
                          { day: 'Wednesday', data: business_information.business_hours.wednesday },
                          { day: 'Thursday', data: business_information.business_hours.thursday },
                          { day: 'Friday', data: business_information.business_hours.friday },
                          { day: 'Saturday', data: business_information.business_hours.saturday },
                          { day: 'Sunday', data: business_information.business_hours.sunday }
                        ].map(({ day, data }) => (
                          <div key={day} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                            <span className="font-medium text-gray-700">{day}</span>
                            <span className={`font-semibold ${data && data[0]?.start_time && data[0]?.end_time ? 'text-green-600' : 'text-red-500'}`}>
                              {data && data[0]?.start_time && data[0]?.end_time 
                                ? `${data[0].start_time} - ${data[0].end_time}`
                                : 'Closed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-400">Not set</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Assistant Goals Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Assistant Goals</h3>
                  <p className="text-sm text-gray-500">What your AI receptionist should accomplish</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-6">
                  {/* <div>
                    <div className="text-sm text-gray-600 mb-1">Communication Medium</div>
                    <div className="font-medium">{assistant_goals?.communication_medium || 'Not set'}</div>
                  </div> */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Goals</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    {assistant_goals?.goals && assistant_goals.goals.length > 0 ? (
                      <div className="space-y-3">
                        {assistant_goals.goals.map((goal, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{goal}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-400">Not set</div>
                    )}
                  </div>
                </div>
                {/* <div>
                  <div className="text-sm text-gray-600 mb-1">Tasks</div>
                  <div className="font-medium">
                    {assistant_goals?.tasks && assistant_goals.tasks.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {assistant_goals.tasks.map((task, index) => (
                          <li key={index}>{task.title}</li>
                        ))}
                      </ul>
                    ) : 'Not set'}
                  </div> */}
                {/* </div> */}
              </div>
            </div>
          </section>

          {/* Communication Style Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Communication Style</h3>
                  <p className="text-sm text-gray-500">How your AI receptionist interacts with customers</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'communication-style')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-green-600 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Greeting Message</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{assistant_information?.first_message || 'Not set'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Voice</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    {selectedVoice ? (
                      <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{selectedVoice.name}</div>
                            {selectedVoice.description && (
                              <div className="text-sm text-gray-600 mt-1">{selectedVoice.description}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedVoice.labels?.gender && (
                                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                                  {selectedVoice.labels.gender.charAt(0).toUpperCase() + selectedVoice.labels.gender.slice(1)}
                                </span>
                              )}
                              {selectedVoice.labels?.accent && (
                                <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
                                  {selectedVoice.labels.accent.charAt(0).toUpperCase() + selectedVoice.labels.accent.slice(1)}
                                </span>
                              )}
                              {selectedVoice.labels?.descriptive && (
                                <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-full font-medium">
                                  {selectedVoice.labels.descriptive.charAt(0).toUpperCase() + selectedVoice.labels.descriptive.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : assistant_information?.communication_style ? (
                      <div className="text-gray-500 bg-gray-50/50 p-4 rounded-lg">Loading voice details...</div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-400">Not set</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Supported Languages</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    {assistant_information?.support_languages && assistant_information.support_languages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assistant_information.support_languages.map((lang, index) => (
                          <span key={index} className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                            {lang}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-400">Not set</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Information Collection Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Information Collection</h3>
                  <p className="text-sm text-gray-500">Data your AI will gather from customers</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'information-collection')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-orange-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Information to Collect</div>
                  <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                    {assistant_information?.information_to_collect && assistant_information.information_to_collect.length > 0 ? (
                      <div className="space-y-4">
                        {/* Standard Fields */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Standard Fields
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {assistant_information.information_to_collect
                              .filter(field => ['Full Name', 'Email', 'Phone Number', 'Address', 'Company Name', 'Position'].includes(field))
                              .map((field, index) => (
                                <span key={index} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                                  {field}
                                </span>
                              ))}
                          </div>
                        </div>
                        
                        {/* Custom Fields */}
                        {assistant_information.information_to_collect
                          .filter(field => !['Full Name', 'Email', 'Phone Number', 'Address', 'Company Name', 'Position'].includes(field))
                          .length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              Custom Fields
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {assistant_information.information_to_collect
                                .filter(field => !['Full Name', 'Email', 'Phone Number', 'Address', 'Company Name', 'Position'].includes(field))
                                .map((field, index) => (
                                  <span key={index} className="px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                                    {field}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-gray-400">Not set</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Questions Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Key Questions to Ask Customers</h3>
                  <p className="text-sm text-gray-500">Important questions your AI will ask</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'key-questions')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-indigo-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Questions</div>
                <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                  {assistant_information?.key_questions && assistant_information.key_questions.length > 0 ? (
                    <div className="space-y-3">
                      {assistant_information.key_questions.map((question, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{question}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400">No questions added</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Important Keywords Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Important Keywords</h3>
                  <p className="text-sm text-gray-500">Key terms your AI should recognize</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'important-keywords')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-yellow-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Keywords</div>
                <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                  {assistant_information?.keywords && assistant_information.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {assistant_information.keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400">No keywords added</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">FAQ Knowledge Base</h3>
                  <p className="text-sm text-gray-500">Frequently asked questions and answers</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'faq-knowledge-base')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 hover:border-teal-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-teal-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">FAQs</div>
                <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                  {assistant_information?.faqs && assistant_information.faqs.length > 0 ? (
                    <div className="space-y-3">
                      {assistant_information.faqs.map((faq, index) => (
                        <div key={index} className="p-4 bg-teal-50/50 rounded-lg border border-teal-100">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 mb-2">Q: {faq.question}</div>
                              <div className="text-sm text-gray-600 bg-white/60 p-3 rounded-lg border border-gray-100">A: {faq.answer}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400">No FAQs added</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Knowledge Base Section */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Knowledge Base</h3>
                  <p className="text-sm text-gray-500">Document your AI will reference</p>
                </div>
              </div>
              <button
                onClick={() => handleEditStep(3, 'knowledge-base')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 hover:shadow-md transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
            </div>
            <div className="bg-gradient-to-br from-white to-red-50/30 border border-gray-200/60 rounded-2xl p-8 shadow-sm backdrop-blur-sm">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Document</div>
                <div className="bg-white/60 rounded-xl border border-gray-100 p-4">
                  {assistant_information?.knowledge_base ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50/50 rounded-lg border border-red-100">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Knowledge Base Document</div>
                        <div className="text-sm text-gray-600">Document ID: {assistant_information.knowledge_base}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-gray-400">No document uploaded</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Launch Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className={`inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg transition-all duration-300 transform ${
                isLaunching 
                  ? 'opacity-75 cursor-not-allowed scale-95' 
                  : 'hover:shadow-xl hover:scale-105'
              }`}
            >
              {isLaunching ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Complete onboarding and move to approval page</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </Card>
      <style jsx global>{`
        .md-editor-preview-only .w-md-editor-toolbar {
          display: none !important;
        }
        .md-editor-preview-only .w-md-editor-header {
          display: none !important;
        }
        .md-editor-preview-only .w-md-editor-toolbar-divider {
          display: none !important;
        }
        
        /* Enhanced animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        section {
          animation: fadeInUp 0.6s ease-out;
        }
        
        section:nth-child(2) { animation-delay: 0.1s; }
        section:nth-child(3) { animation-delay: 0.2s; }
        section:nth-child(4) { animation-delay: 0.3s; }
        section:nth-child(5) { animation-delay: 0.4s; }
        section:nth-child(6) { animation-delay: 0.5s; }
        section:nth-child(7) { animation-delay: 0.6s; }
      `}</style>
    </>
  );
};
  
  export default ReviewLaunch;
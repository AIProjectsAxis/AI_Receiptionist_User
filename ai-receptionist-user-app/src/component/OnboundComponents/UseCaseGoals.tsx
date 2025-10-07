"use client"
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { 
  FormGroup, 
  FormLabel, 
  FormSelect, 
  FormHelper
} from '../common/FormElements';
import { StepFirstData, StepSecondData, StepThirdData } from '@/lib/validations/onboarding';

type CommunicationMedium = 'Voice' | 'Chat' | 'Both';

interface UseCase {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface UseCaseGoalsProps {
  onboardingData: {
    business_information?: StepFirstData;
    assistant_goals?: StepSecondData;
    assistant_information?: StepThirdData;
    complete_onboarding?: boolean;
  };
  onStepChange: (step: number) => void;
  secondStepData: StepSecondData;
  setSecondStepData: React.Dispatch<React.SetStateAction<StepSecondData>>;
  onValidate: (validateFn: () => boolean) => void;
  isSubmitted: boolean;
}

const UseCaseGoals: React.FC<UseCaseGoalsProps> = ({ secondStepData, setSecondStepData, onValidate, isSubmitted }) => {
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customGoals, setCustomGoals] = useState<string[]>([]);
  const [newCustomGoal, setNewCustomGoal] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [editingGoalText, setEditingGoalText] = useState<string>('');

  // Main goal options
  const mainGoalOptions = [
    { value: 'Save time on routine tasks', label: 'Save time on routine tasks' },
    { value: 'Automate routine questions', label: 'Automate routine questions' },
    { value: 'Increase lead capture & conversion', label: 'Increase lead capture & conversion' },
    { value: 'Offer 24/7 customer support', label: 'Offer 24/7 customer support' },
    { value: 'Reduce operational costs', label: 'Reduce operational costs' },
    { value: 'Improve customer experience', label: 'Improve customer experience' },
    { value: 'Other goal', label: 'Other goal' }
  ];

  // Extract predefined and custom goals from secondStepData
  useEffect(() => {
    if (secondStepData.goals && secondStepData.goals.length > 0) {
      const predefinedGoalValues = mainGoalOptions.map(option => option.value);
      const customGoalsFromData = secondStepData.goals.filter(goal => 
        goal && !predefinedGoalValues.includes(goal)
      ) as string[];
      
      if (customGoalsFromData.length > 0) {
        setCustomGoals(customGoalsFromData);
        setShowCustomInput(true);
      }
    }
  }, [secondStepData.goals]);
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const field = e.target.getAttribute('data-field') as keyof StepSecondData;
    
    if (field === 'goals') {
      let updatedGoals;
      
      if (name === 'Other goal') {
        if (checked) {
          setShowCustomInput(true);
          updatedGoals = [...secondStepData.goals, name as any];
        } else {
          setShowCustomInput(false);
          setCustomGoals([]);
          setNewCustomGoal('');
          updatedGoals = secondStepData.goals.filter(goal => goal !== name);
        }
      } else {
        updatedGoals = checked 
          ? [...secondStepData.goals, name as any]
          : secondStepData.goals.filter(goal => goal !== name);
      }
      
      setSecondStepData({
        ...secondStepData,
        goals: updatedGoals
      });
      
      if (updatedGoals.length > 0 && errors.goals) {
        setErrors({
          ...errors,
          goals: ''
        });
      }
    }
  };

  const handleCustomGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCustomGoal(value);
  };

  const addCustomGoal = () => {
    if (newCustomGoal.trim()) {
      const customGoalText = newCustomGoal.trim();
      setCustomGoals([...customGoals, customGoalText]);
      setNewCustomGoal('');
      
      // Add the custom goal to the main goals array
      setSecondStepData({
        ...secondStepData,
        goals: [...secondStepData.goals, customGoalText as any]
      });
      
      // Clear the custom goal error when a goal is added
      if (errors.customGoal) {
        setErrors({
          ...errors,
          customGoal: ''
        });
      }
    }
  };

  const removeCustomGoal = (index: number) => {
    const goalToRemove = customGoals[index];
    const updatedCustomGoals = customGoals.filter((_, i) => i !== index);
    setCustomGoals(updatedCustomGoals);
    
    // Remove the custom goal from the main goals array
    setSecondStepData({
      ...secondStepData,
      goals: secondStepData.goals.filter(goal => goal !== goalToRemove)
    });
    
    // If no custom goals left, remove "Other goal" from selected goals
    if (updatedCustomGoals.length === 0 && secondStepData.goals.includes('Other goal')) {
      setSecondStepData({
        ...secondStepData,
        goals: secondStepData.goals.filter(goal => goal !== 'Other goal')
      });
      setShowCustomInput(false);
    }
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'communication_medium') {
      const medium = value as CommunicationMedium;
      setSecondStepData({
        ...secondStepData,
        // communication_medium: medium || 'Voice'
      });
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate goals
    if (secondStepData.goals.length === 0) {
      newErrors.goals = 'Please select at least one goal';
    }

    // Validate custom goals if "Other goal" is selected
    if (secondStepData.goals.includes('Other goal') && customGoals.length === 0) {
      newErrors.customGoal = 'Please add at least one custom goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose validateForm to parent component
  useEffect(() => {
    onValidate(validateForm);
  }, [secondStepData, onValidate, isSubmitted, customGoals]);

  // Trigger validation check whenever form data changes
  useEffect(() => {
    validateForm();
  }, [secondStepData, customGoals]);

  return (
    <Card
      title="Define what your AI assistant will do"
      subtitle="Customize your AI receptionist's capabilities and goals"
    >
      <div className="">
        <FormGroup>
          <FormLabel htmlFor="goals" className={errors.goals && isSubmitted ? 'text-red-500' : ''}>
            What are your main goals? <span className="text-red-500">*</span>
          </FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {mainGoalOptions.map(goal => (
              <div 
                key={goal.value}
                className={`flex items-start gap-4 p-5 bg-white/90 border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${
                  secondStepData.goals.includes(goal.value as any) 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`font-semibold text-sm transition-colors duration-300 ${
                      secondStepData.goals.includes(goal.value as any) ? 'text-primary' : 'text-gray-800'
                    }`}>
                      {goal.label}
                    </div>
                    <div
                      onClick={() => {
                        const isCurrentlySelected = secondStepData.goals.includes(goal.value as any);
                        const newCheckedState = !isCurrentlySelected;
                        
                        if (goal.value === 'Other goal') {
                          if (newCheckedState) {
                            setShowCustomInput(true);
                            setSecondStepData({
                              ...secondStepData,
                              goals: [...secondStepData.goals, 'Other goal' as any]
                            });
                          } else {
                            setShowCustomInput(false);
                            setCustomGoals([]);
                            setNewCustomGoal('');
                            // Remove "Other goal" and all custom goals from the main goals array
                            const predefinedGoalValues = mainGoalOptions.map(option => option.value);
                            setSecondStepData({
                              ...secondStepData,
                              goals: secondStepData.goals.filter(g => 
                                g && g !== 'Other goal' && predefinedGoalValues.includes(g)
                              )
                            });
                          }
                        } else {
                          setSecondStepData({
                            ...secondStepData,
                            goals: newCheckedState 
                              ? [...secondStepData.goals, goal.value as any]
                              : secondStepData.goals.filter(g => g !== goal.value)
                          });
                        }
                        
                        // Clear errors if goals are selected
                        if (newCheckedState && errors.goals) {
                          setErrors({
                            ...errors,
                            goals: ''
                          });
                        }
                      }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        secondStepData.goals.includes(goal.value as any)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {secondStepData.goals.includes(goal.value as any) && (
                        <svg 
                          className='text-white'
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom goals input */}
          {showCustomInput && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Add Custom Goals</h4>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCustomGoal}
                  onChange={handleCustomGoalChange}
                  placeholder="Enter your custom goal..."
                  className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 ${
                    errors.customGoal && isSubmitted ? 'border-red-500' : 'border-gray-300'
                  }`}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                />
                <button
                  type="button"
                  onClick={addCustomGoal}
                  disabled={!newCustomGoal.trim()}
                  className="px-6 bg-[#4F46E5] py-3 text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  title="Add custom goal"
                >
                  Add
                </button>
              </div>
              
              {/* Custom goals list */}
              {customGoals.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Your Custom Goals:</h5>
                  {customGoals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-sm text-gray-700">{goal}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomGoal(index)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-300 p-1"
                        title="Remove custom goal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.customGoal && isSubmitted && (
                <div className="text-red-500 text-sm mt-2">{errors.customGoal}</div>
              )}
            </div>
          )}
          
          {errors.goals && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.goals}</div>
          )}
          <FormHelper>
            Select all that apply. You can refine these goals later.
          </FormHelper>
        </FormGroup>
        
        {/* <FormGroup>
          <FormLabel htmlFor="communication_medium" className={errors.communication_medium && isSubmitted ? 'text-red-500' : ''}>
            How should your AI communicate with customers?
          </FormLabel>
          <FormSelect
            id="communication_medium"
            name="communication_medium"
            value={secondStepData.communication_medium || ''}
            onChange={handleSelectChange}
            options={[
              { value: '', label: 'Select communication medium', disabled: true },
              { value: 'Voice' as CommunicationMedium, label: 'Voice Only' },
              { value: 'Chat' as CommunicationMedium, label: 'Chat Only' },
              { value: 'Both' as CommunicationMedium, label: 'Both Voice and Chat' }
            ]}
            className={errors.communication_medium && isSubmitted ? 'border-red-500' : ''}
          />
          {errors.communication_medium && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.communication_medium}</div>
          )}
          <FormHelper>
            Choose how your AI receptionist will interact with customers.
          </FormHelper>
        </FormGroup> */}
      </div>
    </Card>
  );
};

export default UseCaseGoals;
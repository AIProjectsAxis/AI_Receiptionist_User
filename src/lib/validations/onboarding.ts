import { z } from 'zod';

// Business Hours Schema
const businessHoursSchema = z.object({
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
});

// Optional Business Hours Schema (for weekends)
const optionalBusinessHoursSchema = z.array(z.object({
  start: z.string(),
  end: z.string(),
}).refine(
  (data) => {
    if (!data.start && !data.end) return true;
    return data.start && data.end;
  },
  {
    message: 'Both start and end times must be set together',
  }
));

// Business Hours State Schema
const businessHoursStateSchema = z.object({
  monday: z.array(businessHoursSchema).nullable(),
  tuesday: z.array(businessHoursSchema).nullable(),
  wednesday: z.array(businessHoursSchema).nullable(),
  thursday: z.array(businessHoursSchema).nullable(),
  friday: z.array(businessHoursSchema).nullable(),
  saturday: z.array(businessHoursSchema).nullable(),
  sunday: z.array(businessHoursSchema).nullable(),
});

const allowedIndustries = [
  "Healthcare",
  "Legal Services", 
  "Property Management",
  "Retail",
  "Hospitality",
  "Financial Services",
  "Education", 
  "Technology",
  "Construction",
  "Professional Services",
  "Other"
];

const industryTypeSchema = z.string().refine(
  val => !!val && (allowedIndustries.includes(val) || val.trim().length > 0),
  { message: "Industry is required" }
);

// Step 1 Schema (Business Information)
export const stepFirstSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  industry: industryTypeSchema,
  description: z.string().min(10, 'Business description must be at least 10 characters').optional(),
  website_url: z.string().optional(),
  business_hours: businessHoursStateSchema.optional(),
  timezone: z.string(),
});

// Task Schema
const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional(),
});

// Goal Schema
const goalSchema = z.union([
  z.enum([
    'Save time on routine tasks',
    'Automate routine questions',
    'Increase lead capture & conversion',
    'Offer 24/7 customer support',
    'Reduce operational costs',
    'Improve customer experience',
  ]),
  z.string().optional()
]);

// Step 2 Schema (Assistant Goals)
export const stepSecondSchema = z.object({
      // communication_medium: z.enum(['Voice', 'Chat', 'Both']).optional(),
  tasks: z.array(taskSchema).optional(),
  goals: z.array(goalSchema).min(1, 'Select at least one goal'),
  status_onboarding: z.enum(['step_2']).optional(),
 
});

// Language Schema
const languageSchema = z.enum([
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese'
]);

// Information Field Schema
const informationFieldSchema = z.union([
  z.enum([
    'Full Name',
    'Email',
    'Phone Number',
    'Address',
    'Company Name',
    'Position'
  ]),
  z.string().min(1, 'Custom field name is required')
]);

// Communication Style Schema
const communicationStyleSchema = z.enum([
  'Friendly',
  'Professional',
  'Casual',
  'Formal'
]);

// Step 3 Schema (Assistant Information)
export const stepThirdSchema = z.object({
  first_message: z.string().min(1, 'First message is required').optional(),
  // communication_style: communicationStyleSchema.optional(),
  support_languages: z.array(languageSchema).min(1, 'Select at least one supported language').optional(),
  information_to_collect: z.array(informationFieldSchema).min(1, 'Select at least one information field to collect').optional(),
  customer_questions: z.array(z.string()).optional(),
  key_questions: z.array(z.string()).optional(),
  knowledge_base: z.string().optional(),
  status_onboarding: z.enum(['step_3']).optional(),
  faqs: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required')
  })).optional(),
  keywords: z.array(z.string()).optional(),
  communication_style: z.string().optional(),
});

// Step 4 Schema (Assistant Information)
export const stepFourthSchema = z.object({
  faqs: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required')
  })).min(1, 'Add at least one FAQ'),
  knowledge_base: z.string().optional(),
  status_onboarding: z.enum(['step_4']).optional(),
});

// Combined Onboarding Schema
export const onboardingSchema = z.object({
  business_information: stepFirstSchema,
  assistant_goals: stepSecondSchema,
  assistant_information: stepThirdSchema,
  complete_onboarding: z.boolean(),
});

// Type inference
export type StepFirstData = z.infer<typeof stepFirstSchema>;
export type StepSecondData = z.infer<typeof stepSecondSchema>;
export type StepThirdData = z.infer<typeof stepThirdSchema>;
// export type StepFourthData = z.infer<typeof stepFourthSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>; 
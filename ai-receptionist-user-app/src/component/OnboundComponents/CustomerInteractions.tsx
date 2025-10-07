"use client"

import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import {
  FormGroup,
  FormLabel,
  FormSelect,
  FormTextarea,
  FormHelper,
  FormInput,
} from '../common/FormElements';
import Button from '../common/Button';
import { EditIcon, PlusIcon, TrashIcon, X, Eye, EyeOff, Play, Pause, Search } from 'lucide-react';
import { useFormik } from 'formik';
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import * as Yup from 'yup';
import { uploadKnowledgeBaseDocumentsApiRequest, deleteKnowledgeBaseDocumentsApiRequest, updateKnowledgeBaseDocumentsApiRequest, getKnowledgeBaseDocumentsByIdApiRequest, getActionListApiRequest, getKnowledgeBaseDocumentsListApiRequest } from '@/network/api';
import { fetchVoices } from '@/network/elevenlabs';

import { StepFirstData, StepSecondData, StepThirdData } from '@/lib/validations/onboarding';

type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Chinese' | 'Japanese';
type PredefinedInfoField = 'Full Name' | 'Email' | 'Phone Number' | 'Address' | 'Company Name' | 'Position';
type InfoField = PredefinedInfoField | string;
type CommunicationStyle = 'Friendly' | 'Professional' | 'Casual' | 'Formal';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface CustomField {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  bytes: number;
  url: string;
  status: string;
  created_at: string;
  mimetype?: string;
  object?: string;
}

interface CustomerInteractionProps {
  onboardingData: {
    business_information?: StepFirstData;
    assistant_goals?: StepSecondData;
    assistant_information?: StepThirdData;
    complete_onboarding?: boolean;
  };
  onStepChange: (step: number, section?: string) => void;
  thirdStepData: StepThirdData;
  setThirdStepData: React.Dispatch<React.SetStateAction<StepThirdData>>;
  targetSection?: string;
  onValidate: (validateFn: () => boolean) => void;
  isSubmitted: boolean;
}

interface StatusClasses {
  text: string;
  icon: React.ReactNode;
}

const CustomerInteraction: React.FC<CustomerInteractionProps> = ({
  thirdStepData,
  setThirdStepData,
  targetSection,
  onStepChange,
  onValidate,
  isSubmitted
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [customerQuestions, setCustomerQuestions] = useState<FAQ[]>([]);
  const [newCustomerQuestion, setNewCustomerQuestion] = useState('');
  const [newCustomerAnswer, setNewCustomerAnswer] = useState('');
  const [keywords, setKeywords] = useState<string[]>(thirdStepData.keywords || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedInfoFields, setSelectedInfoFields] = useState<InfoField[]>(
    (thirdStepData.information_to_collect || []) as InfoField[]
  );
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newCustomField, setNewCustomField] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(thirdStepData.support_languages || []);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [openPdfViewer, setOpenPdfViewer] = useState<string | null>(null);
  const [pdfViewMode, setPdfViewMode] = useState<'iframe' | 'object' | 'google'>('iframe');

  const [document, setDocument] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openUploadDocuments, setOpenUploadDocuments] = useState(true);
  const [voices, setVoices] = useState<any[]>([]);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const [isSelectingVoice, setIsSelectingVoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showFirstMessageExamples, setShowFirstMessageExamples] = useState(false);
  const firstMessageExamples = [
    "Hello! Welcome to [Your Company]. How can I assist you today?",
    "Hi there! Thank you for contacting us. How may I help you?",
    "Good day! I'm your AI assistant. What can I do for you?"
  ];

  const filteredVoices = voices && Array.isArray(voices)
    ? voices.filter((voice: any) =>
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voice.labels?.descriptive && voice.labels.descriptive.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voice.labels?.gender && voice.labels.gender.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (voice.labels?.accent && voice.labels.accent.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : [];

  const selectedVoice = voices.find((v: any) => v.voice_id === thirdStepData?.communication_style);

  const handleVoiceSelect = async (voiceId: string) => {
    setIsSelectingVoice(true);
    try {
      setThirdStepData(prev => ({ ...prev, communication_style: voiceId }));
      setShowVoiceDropdown(false);
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Error selecting voice:", error);
    } finally {
      setIsSelectingVoice(false);
    }
  };

  const playVoiceSample = (voiceId: string, previewUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }
    audioRef.current = new Audio(previewUrl);
    audioRef.current.play();
    audioRef.current.onended = () => {
      setPlayingVoice(null);
    };
    setPlayingVoice(voiceId);
  };

  // Dropdown direction logic
  const checkDropdownDirection = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownHeight = 500;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setDropdownDirection('up');
    } else {
      setDropdownDirection('down');
    }
  };

  useEffect(() => {
    if (showVoiceDropdown) {
      checkDropdownDirection();
      window.addEventListener('resize', checkDropdownDirection);
    }
    return () => {
      window.removeEventListener('resize', checkDropdownDirection);
    };
  }, [showVoiceDropdown]);

  const communicationStyleOptions: { value: string; label: string }[] = [
    { value: '', label: 'Select a tone' },
    { value: 'Professional', label: 'Professional' },
    { value: 'Friendly', label: 'Friendly' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Formal', label: 'Formal' }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    setThirdStepData({
      ...thirdStepData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };



  const handleInfoFieldToggle = (field: InfoField) => {
    const updatedFields = selectedInfoFields.includes(field)
      ? selectedInfoFields.filter(f => f !== field)
      : [...selectedInfoFields, field];

    setSelectedInfoFields(updatedFields);
    setThirdStepData({
      ...thirdStepData,
      information_to_collect: updatedFields
    });

    // Clear the error if fields are selected
    if (updatedFields.length > 0 && errors.information_to_collect) {
      setErrors(prev => ({
        ...prev,
        information_to_collect: ''
      }));
    }
  };

  const handleAddCustomField = () => {
    if (newCustomField.trim()) {
      // Split by tab and filter out empty strings
      const fields = newCustomField.split('\t').filter(field => field.trim());
      
      fields.forEach(field => {
        const trimmedField = field.trim();
        if (trimmedField && !customFields.some(cf => cf.name === trimmedField)) {
          const customField: CustomField = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: trimmedField
          };

          setCustomFields(prev => [...prev, customField]);
          setSelectedInfoFields(prev => [...prev, customField.name]);
          setThirdStepData(prev => ({
            ...prev,
            information_to_collect: [...prev.information_to_collect || [], customField.name]
          }));
        }
      });
      
      setNewCustomField('');

      // Clear the error if fields are selected
      if (errors.information_to_collect) {
        setErrors(prev => ({
          ...prev,
          information_to_collect: ''
        }));
      }
    }
  };

  const handleDeleteCustomField = (id: string) => {
    const fieldToDelete = customFields.find(f => f.id === id);
    if (fieldToDelete) {
      const updatedCustomFields = customFields.filter(f => f.id !== id);
      const updatedInfoFields = selectedInfoFields.filter(f => f !== fieldToDelete.name);

      setCustomFields(updatedCustomFields);
      setSelectedInfoFields(updatedInfoFields);
      setThirdStepData({
        ...thirdStepData,
        information_to_collect: updatedInfoFields
      });
    }
  };

  const handleLanguageToggle = (language: Language) => {
    let updatedLanguages;
    if (selectedLanguages.includes(language)) {
      updatedLanguages = selectedLanguages.filter(l => l !== language);
    } else {
      updatedLanguages = [...selectedLanguages, language];
    }

    setSelectedLanguages(updatedLanguages);
    setThirdStepData(prev => ({
      ...prev,
      support_languages: updatedLanguages
    }));
  };

  const handleAddFaq = () => {
    if (newFaqQuestion.trim() && newFaqAnswer.trim()) {
      const newFaq = {
        id: Date.now().toString(),
        question: newFaqQuestion.trim(),
        answer: newFaqAnswer.trim()
      };
      const updatedFaqs = [...faqs, newFaq];
      setFaqs(updatedFaqs);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      const updatedThirdStepData = {
        ...thirdStepData,
        faqs: updatedFaqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }))
      };
      console.log('Adding FAQ:', newFaq);
      console.log('Updated thirdStepData:', updatedThirdStepData);
      setThirdStepData(updatedThirdStepData);
    }
  };

  const handleDeleteFaq = (id: string) => {
    const updatedFaqs = faqs.filter(q => q.id !== id);
    setFaqs(updatedFaqs);
    setThirdStepData({
      ...thirdStepData,
      faqs: updatedFaqs.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    });
  };

  const handleAddCustomerQuestion = () => {
    if (newCustomerQuestion.trim()) {
      // Split by tab and filter out empty strings
      const questions = newCustomerQuestion.split('\t').filter(question => question.trim());
      
      questions.forEach(question => {
        const trimmedQuestion = question.trim();
        if (trimmedQuestion && !customerQuestions.some(cq => cq.question === trimmedQuestion)) {
          const newQuestion = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            question: trimmedQuestion,
            answer: ''
          };
          
          setCustomerQuestions(prev => [...prev, newQuestion]);
          setThirdStepData(prev => ({
            ...prev,
            key_questions: [...prev.key_questions || [], trimmedQuestion]
          }));
        }
      });
      
      setNewCustomerQuestion('');
    }
  };

  const handleDeleteCustomerQuestion = (id: string) => {
    const updatedQuestions = customerQuestions.filter(q => q.id !== id);
    setCustomerQuestions(updatedQuestions);
    setThirdStepData({
      ...thirdStepData,
      key_questions: updatedQuestions.map(q => q.question)
    });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      // Split by tab and filter out empty strings
      const keywordList = newKeyword.split('\t').filter(keyword => keyword.trim());
      
      keywordList.forEach(keyword => {
        const trimmedKeyword = keyword.trim();
        if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
          setKeywords(prev => [...prev, trimmedKeyword]);
          setThirdStepData(prev => ({
            ...prev,
            keywords: [...prev.keywords || [], trimmedKeyword]
          }));
        }
      });
      
      setNewKeyword('');
    }
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!keywords.includes(suggestion)) {
      const updatedKeywords = [...keywords, suggestion];
      setKeywords(updatedKeywords);
      setThirdStepData({
        ...thirdStepData,
        keywords: updatedKeywords
      });
    }
  };

  const handleAddQuestionSuggestion = (suggestion: string) => {
    if (!customerQuestions.some(q => q.question === suggestion)) {
      const newQuestion = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        question: suggestion,
        answer: ''
      };
      const updatedQuestions = [...customerQuestions, newQuestion];
      setCustomerQuestions(updatedQuestions);
      setThirdStepData({
        ...thirdStepData,
        key_questions: updatedQuestions.map(q => q.question)
      });
    }
  };

  const handleDeleteKeyword = (keywordToDelete: string) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToDelete);
    setKeywords(updatedKeywords);
    setThirdStepData({
      ...thirdStepData,
      keywords: updatedKeywords
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First Message validation
    if (!thirdStepData.first_message?.trim()) {
      newErrors.first_message = 'Please enter a greeting message';
    }

    // Communication Style validation
    if (!thirdStepData.communication_style) {
      newErrors.communication_style = 'Please select a communication style';
    }

    // Languages validation
    if (!thirdStepData.support_languages || thirdStepData.support_languages.length === 0) {
      newErrors.support_languages = 'Please select at least one language';
    }

    // Information to collect validation - check both selectedInfoFields and thirdStepData
    const hasInfoFields = (selectedInfoFields && selectedInfoFields.length > 0) ||
      (thirdStepData.information_to_collect && thirdStepData.information_to_collect.length > 0);
    if (!hasInfoFields) {
      newErrors.information_to_collect = 'Please select at least one information field to collect';
    }

    // FAQ validation
    // if (!keyQuestions || keyQuestions.length === 0) {
    //   newErrors.key_questions = 'Please add at least one frequently asked question';
    // }

    // Knowledge Base Document validation
    // if (!document?.id) {
    //   newErrors.knowledge_base = 'Please upload a knowledge base document';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    onValidate(validateForm);
  }, [thirdStepData, keywords, faqs, document, onValidate]);

  // Trigger validation check whenever form data changes
  useEffect(() => {
    validateForm();
  }, [thirdStepData, keywords, faqs, document]);

  const documentFormik = useFormik({
    initialValues: {
      file: null as File | null
    },
    validationSchema: Yup.object({
      file: Yup.mixed()
        .required('A PDF file is required')
        .test('fileType', 'Only PDF files are allowed', (value) => {
          if (!value || !(value instanceof File)) return false;
          return value.type === 'application/pdf';
        })
    }),
    onSubmit: async (values) => {
      try {
        setIsUploading(true);
        const formData = new FormData();
        if (values.file) {
          formData.append('file', values.file);
        }
        const response = await uploadKnowledgeBaseDocumentsApiRequest(formData);
        // Update the document state with the uploaded file
        setDocument(response.data.data);
        setOpenUploadDocuments(false);
        getKnowledgeBaseDocumentsList()
        documentFormik.resetForm();
        setSelectedFile(null);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploading(false);
      }
    }
  });

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        documentFormik.setFieldValue('file', file);
      } else {
        alert('Please select a PDF file');
        e.target.value = ''; // Reset input
      }
    }
  };

  const getKnowledgeBaseDocumentsList = async () => {
    setIsUploading(true);
    const response = await getKnowledgeBaseDocumentsListApiRequest();
    setDocument(response?.data?.files[0] || []);
    setThirdStepData({
      ...thirdStepData,
      knowledge_base: response?.data?.files[0]?.id
    })
    setIsUploading(false);
  }
  // console.log(document?.object)
  const getFileIconBgColor = (type: string) => {
    if (!type) return 'bg-gray-500';

    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-red-500';
      case 'docx':
      case 'doc':
        return 'bg-blue-500';
      case 'file':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getFileIcon = (type: string) => {
    if (type) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }

    switch (type.toLowerCase()) {
      case 'pdf':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
      case 'docx':
      case 'doc':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m6 0h-6m6 0V9m-12 0V6" /></svg>;
      case 'file':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10M4 7a2 2 0 012-2h2a2 2 0 012 2v10M4 7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2v-10" /></svg>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusClasses = (status: string): StatusClasses => {
    const classes: StatusClasses = {
      text: '',
      icon: null
    };

    switch (status.toLowerCase()) {
      case 'active':
        classes.text = 'text-green-600';
        classes.icon = <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
        break;
      case 'processing':
        classes.text = 'text-yellow-600';
        classes.icon = <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
        break;
      default:
        classes.text = 'text-gray-600';
        classes.icon = <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
    }

    return classes;
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    getKnowledgeBaseDocumentsList()
  }, [])

  // Initialize custom fields from existing data
  useEffect(() => {
    if (thirdStepData.information_to_collect && thirdStepData.information_to_collect.length > 0) {
      const predefinedFields: PredefinedInfoField[] = ['Full Name', 'Email', 'Phone Number', 'Address', 'Company Name', 'Position'];

      const existingCustomFields = thirdStepData.information_to_collect
        .filter(field => !predefinedFields.includes(field as PredefinedInfoField))
        .map((field, index) => ({
          id: Date.now().toString() + index + Math.random().toString(36).substr(2, 9),
          name: field
        }));

      setCustomFields(existingCustomFields);
    }
  }, [thirdStepData.information_to_collect]);

  // Initialize keywords from API response
  useEffect(() => {
    if (thirdStepData.keywords && thirdStepData.keywords.length > 0) {
      setKeywords(thirdStepData.keywords);
    }
  }, [thirdStepData.keywords]);

  // Initialize languages from API response
  useEffect(() => {
    if (thirdStepData.support_languages && thirdStepData.support_languages.length > 0) {
      setSelectedLanguages(thirdStepData.support_languages);
    }
  }, [thirdStepData.support_languages]);

  // Initialize key questions from API response (these are the customer questions)
  useEffect(() => {
    if (thirdStepData.key_questions && thirdStepData.key_questions.length > 0) {
      const initialKeyQuestions = thirdStepData.key_questions.map((questionString, index) => {
        return {
          id: Date.now().toString() + index + Math.random().toString(36).substr(2, 9),
          question: questionString.trim(),
          answer: ''
        };
      });
      setCustomerQuestions(initialKeyQuestions);
    }
  }, [thirdStepData.key_questions]);

  // Initialize customer questions from API response (fallback)
  useEffect(() => {
    if (thirdStepData.customer_questions && thirdStepData.customer_questions.length > 0 && customerQuestions.length === 0) {
      const initialCustomerQuestions = thirdStepData.customer_questions.map((questionString, index) => {
        return {
          id: Date.now().toString() + index + Math.random().toString(36).substr(2, 9),
          question: questionString.trim(),
          answer: ''
        };
      });
      setCustomerQuestions(initialCustomerQuestions);
    }
  }, [thirdStepData.customer_questions, customerQuestions.length]);

  // Initialize FAQs from API response
  useEffect(() => {
    if (thirdStepData.faqs && thirdStepData.faqs.length > 0) {
      const initialFaqs = thirdStepData.faqs.map((faq, index) => ({
        id: Date.now().toString() + index + Math.random().toString(36).substr(2, 9),
        question: faq.question,
        answer: faq.answer
      }));
      setFaqs(initialFaqs);
    }
  }, [thirdStepData.faqs]);

  // Fetch voices when communication style changes
  useEffect(() => {
    if (thirdStepData) {
      fetchVoices().then(setVoices);
    }
  }, [thirdStepData]);

  // Simple effect to log when targetSection changes (for debugging)
  useEffect(() => {
    if (targetSection) {
      console.log('CustomerInteractions received targetSection:', targetSection);
    }
  }, [targetSection]);



  return (
    <Card
      ref={containerRef}
      data-component="customer-interactions"
      title="Customize your AI's communication style"
      subtitle="Define how your AI receptionist should interact with customers"
    >
      <div className=" space-y-8">
        <FormGroup id="first-message-section">
          <FormLabel htmlFor="first_message" className={` ${errors.first_message && isSubmitted ? 'text-red-500' : ''} !flex  items-center justify-between gap-2`}>
            <div className='flex items-center gap-2'>  First Message <span className="text-red-500">*</span> 
            {/* (ID: first-message-section) */}
            </div>
            <button
              type="button"
              className="ml-2 text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none"
              onClick={() => setShowFirstMessageExamples((prev) => !prev)}
              tabIndex={0}
            >
              Examples
            </button>
          </FormLabel>
          <FormTextarea
            id="first_message"
            name="first_message"
            value={thirdStepData.first_message || ''}
            onChange={handleChange}
            placeholder="Enter the first message your AI assistant will send to customers..."
            rows={4}
            className={`${errors.first_message && isSubmitted ? 'border-red-500' : ''} resize-none`}
          />
          {showFirstMessageExamples && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 animate-fade-in">
              <div className="mb-1 font-semibold text-blue-800">Example messages:</div>
              <ul className="space-y-2">
                {firstMessageExamples.map((example, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      className="text-left w-full hover:bg-blue-100 rounded px-2 py-1 transition"
                      onClick={() => {
                        setThirdStepData({ ...thirdStepData, first_message: example });
                        setShowFirstMessageExamples(false);
                      }}
                    >
                      <span className="text-blue-700">{example}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.first_message && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.first_message}</div>
          )}
          <FormHelper>
            This message will be the first thing your AI assistant says when starting a conversation with customers.
          </FormHelper>
        </FormGroup>


        <FormGroup id="voice-selection-section">
          <FormLabel className="text-sm font-semibold text-gray-700">
            What tone should your AI use? <span className="text-red-500">*</span>
          </FormLabel>
          <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
              <div className="relative w-full ">
                <button
                  type="button"
                  onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                  disabled={isSelectingVoice}
                  className={`w-full h-auto bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-primary hover:bg-white/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 rounded-xl shadow-sm px-4 py-3 text-left flex items-center justify-between group ${showVoiceDropdown ? 'border-primary bg-white shadow-md' : ''} ${isSelectingVoice ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-1 w-full text-left">
                    {selectedVoice ? (
                      <div className="block rounded-lg p-2 transition-colors duration-150 w-full">
                        <div className='flex flex-row items-center gap-2'>
                          <p className="text-sm font-semibold text-gray-900 text-start">{selectedVoice.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedVoice.labels?.gender && (
                              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-medium">
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
                        {selectedVoice.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {selectedVoice.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 group-hover:text-gray-700 transition-colors duration-150">Choose a voice for your assistant</span>
                        <div className="flex gap-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Voice</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">AI</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelectingVoice && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span>Selecting...</span>
                      </div>
                    )}
                    {selectedVoice && !isSelectingVoice && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-150">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Selected</span>
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-all duration-200 flex-shrink-0 ml-2 group-hover:text-gray-600 ${showVoiceDropdown ? 'rotate-180 text-primary' : ''} ${isSelectingVoice ? 'opacity-50' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showVoiceDropdown && (
                  <div
                    className={`absolute left-0 right-0 z-[9999] bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 w-full max-h-[300px] overflow-hidden ${dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} animate-fade-in`}
                    style={{ transition: 'box-shadow 0.2s, background 0.2s' }}
                    tabIndex={-1}
                  >
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        {/* <svg className="absolute left-2 top-2.5 h-5 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5A7 7 0 105 5a7 7 0 0012 0z" /></svg> */}
                        <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          placeholder="Search voices by name, accent, gender..."
                          className="pl-8  pr-2 text-sm border border-gray-200 focus:ring-2 h-[40px] focus:ring-primary focus:outline-none rounded-md bg-white/80 w-full"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                      {filteredVoices.length > 0 ? (
                        filteredVoices.map((voice: any) => (
                          <div
                            key={voice.voice_id}
                            className={`group hover:bg-gray-100 transition-all duration-150 hover:bg-primary/10 cursor-pointer rounded-lg px-3 py-2 flex flex-col gap-1 border border-transparent focus-within:ring-2 focus-within:ring-primary/40 ${thirdStepData.communication_style === voice.voice_id ? 'bg-primary/20 border-primary/30 shadow' : ''} ${isSelectingVoice ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onClick={() => !isSelectingVoice && handleVoiceSelect(voice.voice_id)}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' && !isSelectingVoice) handleVoiceSelect(voice.voice_id); }}
                          >
                            <div className="flex items-center gap-2">
                              <p className={`text-base font-semibold text-gray-900 ${thirdStepData.communication_style === voice.voice_id ? 'text-primary' : ''}`}>{voice.name}</p>
                              {isSelectingVoice && thirdStepData.communication_style === voice.voice_id && (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {voice.labels?.gender && (
                                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-medium">
                                    {voice.labels.gender.charAt(0).toUpperCase() + voice.labels.gender.slice(1)}
                                  </span>
                                )}
                                {voice.labels?.accent && (
                                  <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
                                    {voice.labels.accent.charAt(0).toUpperCase() + voice.labels.accent.slice(1)}
                                  </span>
                                )}
                                {voice.labels?.descriptive && (
                                  <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-full font-medium">
                                    {voice.labels.descriptive.charAt(0).toUpperCase() + voice.labels.descriptive.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {voice.description && (
                              <p className={`text-xs text-gray-600 mt-1 line-clamp-2 ${thirdStepData.communication_style === voice.voice_id ? 'text-primary/80' : ''}`}>{voice.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">No voices match your search</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {thirdStepData.communication_style && selectedVoice && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  style={{ border: '1px solid #666666' }}
                  className="h-10 w-10 !p-0 border-1 border-primary rounded-lg bg-primary/10 hover:bg-primary/20 shadow-sm transition"
                  onClick={() => {
                    if (selectedVoice?.preview_url) {
                      playVoiceSample(selectedVoice.voice_id, selectedVoice.preview_url);
                    }
                  }}
                >
                  {playingVoice === thirdStepData?.communication_style ? (
                    <Pause className="h-5 w-5 text-primary" />
                  ) : (
                    <Play className="h-5 w-5 text-primary" />
                  )}
                  <span className="sr-only">
                    {playingVoice === thirdStepData?.communication_style ? "Pause" : "Play"} selected voice
                  </span>
                </Button>
              )}
            </div>
          </div>
        </FormGroup>

        <FormGroup>
          <FormLabel className={errors.support_languages && isSubmitted ? 'text-red-500' : ''}>
            What languages should your AI support? <span className="text-red-500">*</span>
          </FormLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'] as Language[]).map((language) => (
              <div
                key={language}
                onClick={() => handleLanguageToggle(language)}
                className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${selectedLanguages.includes(language)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="font-medium flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  {language}
                </div>
              </div>
            ))}
          </div>
          {errors.support_languages && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.support_languages}</div>
          )}
        </FormGroup>

        <FormGroup id="information-collection-section">
          <FormLabel className={errors.information_to_collect && isSubmitted ? 'text-red-500' : ''}>
            What information should your AI collect from customers? <span className="text-red-500">*</span>
          </FormLabel>

          {/* Predefined Fields */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Standard Information Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(['Full Name', 'Email', 'Phone Number', 'Address', 'Company Name', 'Position'] as PredefinedInfoField[]).map((field) => (
                <div
                  key={field}
                  onClick={() => handleInfoFieldToggle(field)}
                  className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${selectedInfoFields.includes(field)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedInfoFields.includes(field)}
                      onChange={() => handleInfoFieldToggle(field)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    {field}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Fields */}
          <div className="mb-6 flex flex-col gap-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Information Fields</h4>

            {/* Add Custom Field Input */}
            <div className="w-full">
              <textarea
                value={newCustomField}
                onChange={(e) => setNewCustomField(e.target.value)}
                placeholder="Enter custom field names separated by Tab key (e.g., 'Project Type' [Tab] 'Budget Range')"
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    // Add a tab character to the input
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const newValue = newCustomField.substring(0, start) + '\t' + newCustomField.substring(end);
                    setNewCustomField(newValue);
                    
                    // Set cursor position after the tab
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + 1;
                    }, 0);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomField();
                  }
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleAddCustomField}
                disabled={!newCustomField.trim()}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add All Fields
              </Button>
            </div>

            {/* Display Custom Fields */}
            {customFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {customFields.map((customField) => (
                  <div
                    key={customField.id}
                    className="p-4 rounded-lg border border-green-500 bg-green-50 text-green-700 relative"
                  >
                    <div className="font-medium flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedInfoFields.includes(customField.name)}
                        onChange={() => handleInfoFieldToggle(customField.name)}
                        className="h-4 w-4 text-green-600 rounded"
                      />
                      {customField.name}
                    </div>
                    <button
                      onClick={() => handleDeleteCustomField(customField.id)}
                      className="absolute top-2 right-2 p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.information_to_collect && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.information_to_collect}</div>
          )}
        </FormGroup>

        <div className="space-y-4" id="important-keywords-section">
          <h3 className="text-same  text-gray-800">Important Keywords</h3>
          {/* Industry Suggestions Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">💡 Industry Suggestions</h4>
            <p className="text-xs text-blue-600 mb-3">
              Common keywords that customers often ask about. Click to add them to your list:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'pricing', 'hours', 'location', 'contact', 'services',
                'refund', 'booking', 'appointment', 'policy', 'support'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAddSuggestion(suggestion)}
                  disabled={keywords.includes(suggestion)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${keywords.includes(suggestion)
                    ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed'
                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                    }`}
                >
                  {keywords.includes(suggestion) ? '✓ ' : ''}{suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <FormGroup>

          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Keyword</label>
                <textarea
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Enter custom keywords separated by Tab key (e.g., 'pricing' [Tab] 'support' [Tab] 'booking')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      // Add a tab character to the input
                      const target = e.target as HTMLTextAreaElement;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const newValue = newKeyword.substring(0, start) + '\t' + newKeyword.substring(end);
                      setNewKeyword(newValue);
                      
                      // Set cursor position after the tab
                      setTimeout(() => {
                        target.selectionStart = target.selectionEnd = start + 1;
                      }, 0);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add All Keywords
                </Button>
              </div>
            </div>


            <div className="space-y-2 mt-4">
              {keywords.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No important keywords added yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                    >
                      <span className="text-sm font-medium">{keyword}</span>
                      <button
                        onClick={() => handleDeleteKeyword(keyword)}
                        className="p-1 rounded-full text-blue-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <FormHelper>
            Add important keywords or phrases that your AI should recognize and respond to appropriately. Use the suggestions above or add your own custom keywords. You can add multiple keywords at once by separating them with the Tab key.
          </FormHelper>
        </FormGroup>


        <FormGroup id="key-questions-section">
          <FormLabel>
            Key Questions to Ask Customers
          </FormLabel>
          <div className="space-y-4">
            {/* Industry Question Suggestions Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">💡 Industry Question Suggestions</h4>
              <p className="text-xs text-blue-600 mb-3">
                Common questions that help gather important customer information. Click to add them to your list:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'How did you hear about us?',
                  'What service are you interested in?',
                  'What\'s the best time to reach you?',
                  'Do you have any specific requirements?'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddQuestionSuggestion(suggestion)}
                    disabled={customerQuestions.some(q => q.question === suggestion)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${customerQuestions.some(q => q.question === suggestion)
                      ? 'bg-green-100 text-green-700 border-green-300 cursor-not-allowed'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                      }`}
                  >
                    {customerQuestions.some(q => q.question === suggestion) ? '✓ ' : ''}{suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={newCustomerQuestion}
                  onChange={(e) => setNewCustomerQuestion(e.target.value)}
                  placeholder="Enter key questions separated by Tab key (e.g., 'What service do you need?' [Tab] 'What is your budget?')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      // Add a tab character to the input
                      const target = e.target as HTMLTextAreaElement;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const newValue = newCustomerQuestion.substring(0, start) + '\t' + newCustomerQuestion.substring(end);
                      setNewCustomerQuestion(newValue);
                      
                      // Set cursor position after the tab
                      setTimeout(() => {
                        target.selectionStart = target.selectionEnd = start + 1;
                      }, 0);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomerQuestion();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleAddCustomerQuestion}
                  disabled={!newCustomerQuestion.trim()}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add All Questions
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {customerQuestions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No key questions added yet</p>
              ) : (
                customerQuestions.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 bg-white rounded-md border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Q: {faq.question}</h4>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleDeleteCustomerQuestion(faq.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <FormHelper>
            Define key questions your AI should ask customers to gather important information and provide better assistance. These questions help your AI gather important information from customers. You can add multiple questions at once by separating them with the Tab key.
          </FormHelper>
        </FormGroup>

        <FormGroup id="faq-section">
          <FormLabel className={errors.key_questions && isSubmitted ? 'text-red-500' : ''}>
            FAQ Knowledge Base
          </FormLabel>
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="Enter a frequently asked question..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="Enter the answer to this question..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleAddFaq}
                  disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add FAQ
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {faqs.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No FAQs added yet</p>
              ) : (
                faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 bg-white rounded-md border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-2">Q: {faq.question}</h4>
                        <p className="text-gray-600 text-sm">A: {faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {errors.key_questions && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.key_questions}</div>
          )}
        </FormGroup>

        <FormGroup id="knowledge-base-section">
          <FormLabel className={errors.knowledge_base && isSubmitted ? 'text-red-500' : ''}>
            Knowledge Base Document
          </FormLabel>
          <div className="space-y-4">
            {(!openUploadDocuments || document?.id) ? (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Upload a PDF document to help your AI assistant answer questions accurately
                </p>
                <Button
                  variant="primary"
                  onClick={() => setOpenUploadDocuments(true)}
                  disabled={!!document}
                >
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 relative">
                {/* <button
                  type="button"
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setOpenUploadDocuments(false);
                    setSelectedFile(null);
                    documentFormik.resetForm();
                  }}
                >
                  <X className="h-5 w-5" />
                </button> */}

                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>

                {selectedFile && (
                  <div className="mb-4">
                    <h3 className="text-sm text-gray-600">
                      Selected file: {selectedFile.name}
                    </h3>
                  </div>
                )}

                <p className="text-gray-600 mb-6 text-sm">
                  Upload a PDF document to help your AI receptionist answer questions accurately.
                </p>

                <form onSubmit={documentFormik.handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleFileInputClick}
                    disabled={isUploading}
                  >
                    Select PDF
                  </Button>
                  {selectedFile && (
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  )}
                </form>
              </div>
            )}

            {/* Document Display */}
            {document && document.id && (
              <div className="mt-4">
                <div className="flex flex-col">
                  <div className="flex items-center p-4 bg-white rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0  ${getFileIconBgColor(document.object)}`}>
                      {getFileIcon(document.object)}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="font-medium text-gray-800">{document.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(document.bytes)} • Uploaded: {formatDate(document.created_at)}
                      </div>
                      {/* Debug info */}
                      <div className="text-xs text-gray-400 mt-1">
                        Type: {document.type} | ID: {document.id} | URL: {document.url ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* PDF Viewer Toggle Button - More flexible detection */}
                      {(document?.type?.toLowerCase() === 'pdf' ||
                        document?.name?.toLowerCase().endsWith('.pdf') ||
                        document?.mimetype === 'application/pdf') && (
                          <Button
                            variant="text"
                            size="sm"
                            className="p-1.5 text-gray-500 hover:text-blue-600"
                            title={openPdfViewer === document.id ? "Hide PDF" : "View PDF"}
                            onClick={() => {
                              console.log('PDF button clicked:', {
                                documentId: document.id,
                                currentOpenPdfViewer: openPdfViewer,
                                documentType: document.type,
                                documentName: document.name,
                                documentUrl: document.url
                              });
                              setOpenPdfViewer(openPdfViewer === document.id ? null : document.id);
                            }}
                          >
                            {openPdfViewer === document.id ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                          </Button>
                        )}
                    </div>
                  </div>

                  {/* Inline PDF Viewer - Google Viewer Only */}
                  {openPdfViewer === document.id &&
                    (document?.type?.toLowerCase() === 'pdf' ||
                      document?.name?.toLowerCase().endsWith('.pdf') ||
                      document?.mimetype === 'application/pdf') &&
                    document.url && (
                      <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-700 text-sm">PDF Reader - {document.name}</h4>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              {formatFileSize(document?.bytes)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                              title="Open in new tab"
                            >
                              Open in Tab
                            </a>
                            <button
                              onClick={() => setOpenPdfViewer(null)}
                              className="text-gray-500 hover:text-gray-700 p-1"
                              title="Close PDF viewer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Google Docs Viewer - Only View */}
                        <div className="relative bg-gray-100" style={{ height: '600px' }}>
                          <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(document.url)}&embedded=true`}
                            width="100%"
                            height="600px"
                            style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                            title={`PDF Google Viewer - ${document.name}`}
                            allowFullScreen
                          >
                            <div className="p-8 text-center text-gray-500 bg-white h-full flex flex-col items-center justify-center">
                              <div className="mb-4">
                                <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-700 mb-2">Google Viewer Not Loading</h3>
                              <p className="text-sm text-gray-500 mb-4">
                                The PDF might be too large or the URL might not be accessible.
                              </p>
                              <div className="flex gap-3">
                                <a
                                  href={document.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  Open in New Tab
                                </a>
                                <a
                                  href={document.url}
                                  download={document.name}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  Download PDF
                                </a>
                              </div>
                            </div>
                          </iframe>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
          {errors.knowledge_base && isSubmitted && (
            <div className="text-red-500 text-sm mt-2">{errors.knowledge_base}</div>
          )}
        </FormGroup>

      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e7ef;
          border-radius: 8px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e0e7ef transparent;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.18s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </Card>
  );
};

export default CustomerInteraction;
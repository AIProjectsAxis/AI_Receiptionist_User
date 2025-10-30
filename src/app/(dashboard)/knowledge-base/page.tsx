"use client"; // If using Next.js App Router
export const runtime = 'edge';

import React, { useState, ChangeEvent, FormEvent, ReactElement, useEffect } from 'react';
import Card from '@/component/common/Card';
import Button from '@/component/common/Button';
import { getKnowledgeBaseDocumentsListApiRequest } from '@/network/api';
import Link from 'next/link';
import { formatDate } from '@/_utils/general';
import { Loader2 } from 'lucide-react';
import DocumentsComponent from '@/component/KnowledgeBaseComponent/DocumentsComponent';
import QaAnddForm from '@/component/KnowledgeBaseComponent/QaAnddForm';
import QaComponent from '@/component/KnowledgeBaseComponent/QaComponent';
import AnalyticsComponent from '@/component/KnowledgeBaseComponent/AnalyticsComponent';
import { Input } from '@/component/ui/input';


interface Document {
  id: string;
  name: string;
  size: number;
  type: string; // MIME type e.g., 'application/pdf'
  dateUploaded: string; // YYYY-MM-DD
  status: 'indexed' | 'indexing' | 'failed';
  category: string;
}

interface QAPair {
  id: string;
  question: string;
  answer: string;
  source: string; // Could be document name or ID
  dateAdded: string; // YYYY-MM-DD
}

interface DocumentCategory {
  value: string;
  label: string;
}

type ActiveKbTab = 'documents' | 'qa' | 'analytics';

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveKbTab>('documents');
  const [openUploadDocuments, setOpenUploadDocuments] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);

  const [qaPairs, setQaPairs] = useState<QAPair[]>([
    { id: 'qa_1', question: 'What are your business hours?', answer: 'Our standard business hours are Monday to Friday from 9:00 AM to 5:00 PM.', source: 'Company_FAQ.pdf', dateAdded: '2025-05-11' },
    { id: 'qa_2', question: 'Do you offer refunds?', answer: 'Yes, we offer full refunds within 30 days of purchase.', source: 'Return_Policy.pdf', dateAdded: '2025-05-16' },
  ]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): ReactElement => {
    if (fileType?.includes('pdf')) {
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a1 1 0 001 1h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M9 13h6" /></svg>;
    } else if (fileType?.includes('doc')) {
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a1 1 0 001 1h4" /></svg>;
  };

  const getFileIconBgColor = (fileType: string): string => {
    if (fileType?.includes('pdf')) return 'bg-red-100 text-red-600';
    if (fileType?.includes('doc')) return 'bg-blue-100 text-blue-600';
    return 'bg-green-100 text-green-600'; // Default for .txt, .md
  };

  const statusClasses = (status: any): { text: string; icon?: ReactElement } => {
    if (status === 'done') return { text: 'text-green-600', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> };
    if (status === 'processing') return { text: 'text-yellow-600 animate-pulse', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    return { text: 'text-red-600', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> }; // for 'failed'
  };

  // --- Event Handlers ---
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newDocumentsToAdd: Document[] = files.map(file => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      dateUploaded: new Date().toISOString().split('T')[0],
      status: 'indexing',
      category: 'uncategorized',
    }));
    setDocuments(prevDocs => [...prevDocs, ...newDocumentsToAdd]);
    e.target.value = ''; // Reset file input
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
  };

  const [showAddQaForm, setShowAddQaForm] = useState(false);
  const [newQaPair, setNewQaPair] = useState<{ question: string; answer: string; source: string }>({
    question: '', answer: '', source: '',
  });

  const handleQaInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewQaPair(prev => ({ ...prev, [name]: value }));
  };

  const handleAddQaPair = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newQaPair.question.trim() || !newQaPair.answer.trim()) {
      alert("Question and Answer cannot be empty."); // Consider a more integrated notification system
      return;
    }
    const newQaToAdd: QAPair = {
      id: `qa_${Date.now()}`, ...newQaPair, dateAdded: new Date().toISOString().split('T')[0],
    };
    setQaPairs(prevQa => [...prevQa, newQaToAdd]);
    setNewQaPair({ question: '', answer: '', source: '' }); // Reset form
    setShowAddQaForm(false);
  };

  const removeQaPair = (qaId: string) => {
    setQaPairs(prevQa => prevQa.filter(qa => qa.id !== qaId));
  };

  // --- Derived State / Filters ---
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredQaPairs = qaPairs.filter(qa =>
    searchQuery === '' || 
    qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const documentCategories: DocumentCategory[] = [
    { value: 'all', label: 'All Categories' }, { value: 'faq', label: 'FAQs' },
    { value: 'services', label: 'Services' }, { value: 'pricing', label: 'Pricing' },
    { value: 'policies', label: 'Policies' }, { value: 'internal', label: 'Internal' },
    { value: 'uncategorized', label: 'Uncategorized' },
  ];
  
  // --- Common Tailwind Classes ---
  const commonInputClasses = "block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors";
  const commonTextareaClasses = "block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors";
  
const getKnowledgeBaseDocumentsList = async () => {
  setLoading(true);
  const response = await getKnowledgeBaseDocumentsListApiRequest();
    setDocuments(response?.data?.files || []);
    setLoading(false);
  }

useEffect(() => {
  getKnowledgeBaseDocumentsList();
}, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-base md:text-lg text-gray-500 mt-1">Manage documents and information that power your AI receptionist</p>
        </div>
        <div className="mt-4 md:mt-0">
          {activeTab === 'documents' && (
            <Button disabled={loading} variant="primary" className="flex items-center" onClick={() => setOpenUploadDocuments(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Document
            </Button>
          )}
          {activeTab === 'qa' && (
            <Button disabled={loading} variant="primary" onClick={() => setShowAddQaForm(true)} className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Q&A Pair
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {/* <div className="flex mb-6 border-b border-gray-200">
        {(['documents', 'qa', 'analytics'] as ActiveKbTab[]).map(tabName => (
          <button
            key={tabName}
            className={`py-3 px-4 -mb-px cursor-pointer text-sm md:text-base font-medium focus:outline-none transition-colors
                        ${activeTab === tabName 
                            ? 'border-b-2 border-blue-600 text-blue-600' 
                            : 'text-gray-500 hover:text-blue-600 hover:border-b-2 hover:border-blue-300'}`}
            onClick={() => setActiveTab(tabName)}
          >
            {tabName === 'documents' ? 'Documents' : tabName === 'qa' ? 'Q&A Pairs' : 'Knowledge Analytics'}
          </button>
        ))}
      </div> */}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <Input disabled={loading}  type="text" placeholder={activeTab === 'documents' ? "Search documents..." : activeTab === 'qa' ? "Search Q&A..." : "Search analytics..."} value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className={`${commonInputClasses} pl-10`} />
          </div>
          {/* {activeTab === 'documents' && (
            <select disabled={loading} value={selectedCategory} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)} className={`${commonInputClasses} w-full sm:w-auto form-select min-w-[180px]`}>
              {documentCategories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          )} */}
        </div>
        {/* {activeTab === 'documents' && (
          <div className="flex  gap-3 items-center w-full md:w-auto justify-start md:justify-end mt-3 md:mt-0">
            <span className="text-sm text-gray-600 w-[74px] hidden sm:inline">Sort by:</span>
            <select disabled={loading} className={`${commonInputClasses} form-select  w-full  min-w-[180px]`}>
              <option value="date">Recently Uploaded</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">Size</option>
              <option value="status">Status</option>
            </select>
          </div>
        )} */}
      </div>

      {/* Add Q&A Form (Conditional) */}
      {showAddQaForm && activeTab === 'qa' && (
       <QaAnddForm documents={documents} setShowAddQaForm={setShowAddQaForm} newQaPair={newQaPair} commonTextareaClasses={commonTextareaClasses} commonInputClasses={commonInputClasses} handleQaInputChange={handleQaInputChange} handleAddQaPair={handleAddQaPair} setNewQaPair={setNewQaPair} />
      )}

      {/* --- Documents Tab --- */}
      {activeTab === 'documents' && (
     <DocumentsComponent openUploadDocuments={openUploadDocuments} setOpenUploadDocuments={setOpenUploadDocuments} documents={documents} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} getKnowledgeBaseDocumentsList={getKnowledgeBaseDocumentsList} filteredDocuments={filteredDocuments} getFileIcon={getFileIcon} handleFileUpload={handleFileUpload} getFileIconBgColor={getFileIconBgColor} removeDocument={removeDocument} formatFileSize={formatFileSize} statusClasses={statusClasses} formatDate={formatDate}/>
      )}
      {/* --- Q&A Tab --- */}
      {activeTab === 'qa' && (
      <QaComponent  setShowAddQaForm={setShowAddQaForm}  commonInputClasses={commonInputClasses}   filteredQaPairs={filteredQaPairs} showAddQaForm={showAddQaForm} searchQuery={searchQuery} setSearchQuery={setSearchQuery} removeQaPair={removeQaPair}  />
      )}

      {/* --- Analytics Tab --- */}
      {activeTab === 'analytics' && (
       <AnalyticsComponent documents={documents} qaPairs={qaPairs} setActiveTab={setActiveTab} setShowAddQaForm={setShowAddQaForm}/>
      )}
    </div>
  );
};

export default KnowledgeBase;
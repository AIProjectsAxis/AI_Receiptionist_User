'use client'
import React, { useState } from 'react'
import Card from '../common/Card';
import Button from '../common/Button';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { deleteKnowledgeBaseDocumentsApiRequest, getKnowledgeBaseDocumentsByIdApiRequest, updateKnowledgeBaseDocumentsApiRequest, uploadKnowledgeBaseDocumentsApiRequest } from '@/network/api';
import { EditIcon, X, Eye, EyeOff } from 'lucide-react';

type Props = {
    documents: any;
    openUploadDocuments: boolean;
    setOpenUploadDocuments: (open: boolean) => void;
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    getKnowledgeBaseDocumentsList: () => void;
    filteredDocuments: any;
    getFileIcon: (type: string) => React.ReactNode;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    getFileIconBgColor: (type: string) => string;
    removeDocument: (id: string) => void;
    formatFileSize: (size: number) => string;
    statusClasses: any;
    formatDate: (date: string) => string;
}

const DocumentsComponent = ({ documents, openUploadDocuments, setOpenUploadDocuments, loading, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, getKnowledgeBaseDocumentsList, filteredDocuments, getFileIcon, getFileIconBgColor, removeDocument, formatFileSize, statusClasses, formatDate }: Props) => {
    console.log("documents", documents)
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [openPdfViewer, setOpenPdfViewer] = useState<string | null>(null);
    const [pdfViewMode, setPdfViewMode] = useState<'iframe' | 'object' | 'google'>('iframe');

    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [documentToEdit, setDocumentToEdit] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string>("");
    const [updateDocumentName, setUpdateDocumentName] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: {
            files: []
        },
        validationSchema: Yup.object({
            files: Yup.array().min(1, 'At least one file is required').required('Files are required'),
        }),
        onSubmit: async (values) => {
            try {
                setIsUploading(true);
                const formData = new FormData();
                if (values.files && values.files.length > 0) {
                    values.files.forEach((file: File) => {
                        formData.append('file', file);
                    });
                }
                const response = await uploadKnowledgeBaseDocumentsApiRequest(formData);
                getKnowledgeBaseDocumentsList();
                setOpenUploadDocuments(false);
                formik.resetForm();
                setSelectedFiles(null);

            } catch (error) {
                console.error('Error uploading files:', error);
            } finally {
                setIsUploading(false);
            }
        }
    });

    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(e.target.files);
            formik.setFieldValue('files', Array.from(e.target.files));
        }
    };


    const handleConfirmDelete = async () => {
        if (documentToDelete) {
            try {
                const response = await deleteKnowledgeBaseDocumentsApiRequest(documentToDelete);
                getKnowledgeBaseDocumentsList();
                setShowDeleteConfirm(false);
                setDocumentToDelete(null);
            } catch (error) {
                console.error('Error deleting document:', error);
            }
        }
    };

    const getSingleDocument = async (id: string) => {
        try {
            const response = await getKnowledgeBaseDocumentsByIdApiRequest(id);

            setUpdateDocumentName(response.data.data.name);
            setDocumentId(id);
        } catch (error) {
            console.error('Error getting document:', error);
        }
    }

    const handleUpdateDocumentName = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!documentToEdit) return;
        
        try {
            const payload = {
                name: updateDocumentName
            };
            const response = await updateKnowledgeBaseDocumentsApiRequest(documentToEdit, payload);
            getKnowledgeBaseDocumentsList();
            setShowEditConfirm(false);
            setUpdateDocumentName(null);
            setDocumentToEdit(null);
        } catch (error) {
            console.error('Error updating document name:', error);
        }
    };

    return (
        <>
            <Card title="Knowledge Base Documents" subtitle="Documents that your AI receptionist can reference" className="overflow-x-auto">
                {/* Search Input */}
                <div className="mb-4 px-4 md:px-6">

                </div>
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
                    </div>
                ) : documents.length !== 0 && !loading && !openUploadDocuments && filteredDocuments.length > 0 && (
                    <div className="p-4 md:p-0">
                        <div className="mb-4 flex justify-between items-center px-2 md:px-0">
                            <div className="font-medium text-gray-700">
                                {filteredDocuments.length} document{filteredDocuments.length !== 1 && 's'}
                                {searchQuery && filteredDocuments.length !== documents.length && (
                                    <span className="text-gray-500 ml-2">
                                        (filtered from {documents.length} total)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {filteredDocuments.map((doc: any) => (
                                <div key={doc.id} className="flex flex-col">
                                    <div className="flex items-center p-3 md:p-4 bg-white rounded-md border border-gray-200 gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 ${getFileIconBgColor(doc.type)}`}>
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-800 text-sm md:text-base mb-1 truncate" title={doc.name}>{doc.name}</div>
                                            <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs text-gray-500">
                                                <span>{formatFileSize(doc.bytes)}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="whitespace-nowrap">Uploaded: {formatDate(doc?.created_at?.split('T')[0])}</span>
                                                <span className="hidden md:inline">•</span>
                                                <span className={`flex items-center gap-1 whitespace-nowrap ${statusClasses(doc.status).text}`}>
                                                    {statusClasses(doc.status).icon}
                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                            {/* PDF Viewer Toggle Button */}
                                            {(doc?.mimetype === 'application/pdf' || doc?.type?.toLowerCase() === 'pdf') && (
                                                <Button 
                                                    variant="text" 
                                                    size="sm" 
                                                    className="p-1.5 text-gray-500 hover:text-blue-600" 
                                                    title={openPdfViewer === doc.id ? "Hide PDF" : "View PDF"}
                                                    onClick={() => setOpenPdfViewer(openPdfViewer === doc.id ? null : doc.id)}
                                                >
                                                    {openPdfViewer === doc.id ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                                                </Button>
                                            )}
                                            {/* <Link href={doc?.url || ''} target="_blank">
                                                <Button variant="text" size="sm" className="p-1.5 text-gray-500 hover:text-blue-600" title="View Document">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </Button>
                                            </Link> */}
                                            <Button variant="text" size="sm" className="p-1.5 text-gray-500 hover:text-blue-600" title="Edit Document" onClick={() => {
                                                setShowEditConfirm(true);
                                                setUpdateDocumentName(doc.name);
                                                setDocumentToEdit(doc.id);
                                            }}>
                                                <EditIcon className="h-4 w-4 md:h-5 md:w-5" />
                                            </Button>
                                            <Button
                                                variant="text"
                                                size="sm"
                                                className="p-1.5 text-red-500 hover:text-red-700"
                                                title="Delete Document"
                                                onClick={() => {
                                                    setShowDeleteConfirm(true);
                                                    setDocumentToDelete(doc.id);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Inline PDF Viewer */}
                                    {openPdfViewer === doc.id && (doc?.mimetype === 'application/pdf' || doc?.type?.toLowerCase() === 'pdf') && doc.url && (
                                        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium text-gray-700 text-sm">PDF Reader - {doc.name}</h4>
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                                        {formatFileSize(doc?.bytes)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a 
                                                        href={doc.url} 
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
                                            
                                            {/* PDF Viewer Tabs */}
                                            <div className="flex border-b border-gray-200">
                                                <button
                                                    className={`px-4 py-2 text-sm font-medium ${
                                                        pdfViewMode === 'iframe' 
                                                            ? 'text-blue-600 border-b-2 border-blue-600' 
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                    onClick={() => setPdfViewMode('iframe')}
                                                >
                                                    Direct View
                                                </button>
                                                <button
                                                    className={`px-4 py-2 text-sm font-medium ${
                                                        pdfViewMode === 'object' 
                                                            ? 'text-blue-600 border-b-2 border-blue-600' 
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                    onClick={() => setPdfViewMode('object')}
                                                >
                                                    Object View
                                                </button>
                                                <button
                                                    className={`px-4 py-2 text-sm font-medium ${
                                                        pdfViewMode === 'google' 
                                                            ? 'text-blue-600 border-b-2 border-blue-600' 
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                    onClick={() => setPdfViewMode('google')}
                                                >
                                                    Google Viewer
                                                </button>
                                            </div>
                                            
                                            {/* Direct Iframe PDF Viewer */}
                                            {pdfViewMode === 'iframe' && (
                                                <div className="relative bg-gray-100" style={{ height: '600px' }}>
                                                    <iframe
                                                        src={doc.url}
                                                        width="100%"
                                                        height="600px"
                                                        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                                        title={`PDF Direct View - ${doc.name}`}
                                                        allowFullScreen
                                                    >
                                                        <div className="p-8 text-center text-gray-500 bg-white h-full flex flex-col items-center justify-center">
                                                            <div className="mb-4">
                                                                <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <h3 className="text-lg font-medium text-gray-700 mb-2">PDF Not Loading</h3>
                                                            <p className="text-sm text-gray-500 mb-4">
                                                                Try switching to "Google Viewer" tab for better compatibility.
                                                            </p>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => setPdfViewMode('google')}
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    Try Google Viewer
                                                                </button>
                                                                <a 
                                                                    href={doc.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    Open in New Tab
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </iframe>
                                                </div>
                                            )}
                                            
                                            {/* Object PDF Viewer */}
                                            {pdfViewMode === 'object' && (
                                                <div className="relative bg-gray-100" style={{ height: '600px' }}>
                                                    <object
                                                        data={doc.url}
                                                        type="application/pdf"
                                                        width="100%"
                                                        height="600px"
                                                        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                                    >
                                                        <div className="p-8 text-center text-gray-500 bg-white h-full flex flex-col items-center justify-center">
                                                            <div className="mb-4">
                                                                <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <h3 className="text-lg font-medium text-gray-700 mb-2">Object View Not Working</h3>
                                                            <p className="text-sm text-gray-500 mb-4">
                                                                Try switching to "Google Viewer" tab for better compatibility.
                                                            </p>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={() => setPdfViewMode('google')}
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    Try Google Viewer
                                                                </button>
                                                                <a 
                                                                    href={doc.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    Open in New Tab
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </object>
                                                </div>
                                            )}

                                            {/* Google Docs Viewer - Most Reliable */}
                                            {pdfViewMode === 'google' && (
                                                <div className="relative bg-gray-100" style={{ height: '600px' }}>
                                                    <iframe
                                                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`}
                                                        width="100%"
                                                        height="600px"
                                                        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
                                                        title={`PDF Google Viewer - ${doc.name}`}
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
                                                                    href={doc.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    Open in New Tab
                                                                </a>
                                                                <a 
                                                                    href={doc.url} 
                                                                    download={doc.name}
                                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                                >
                                                                    Download PDF
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </iframe>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {(openUploadDocuments || documents.length === 0 || (searchQuery && filteredDocuments.length === 0)) && !loading &&
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center bg-gray-50 m-4 md:m-6 relative">
                        <button type="button" className="absolute top-3 right-5 text-red-500 text-2xl cursor-pointer" onClick={() => {
                            setOpenUploadDocuments(false);
                            setSelectedFiles(null);
                            formik.resetForm();
                        }}><X className="h-6 w-6 md:h-8 md:w-8" /></button>
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="font-semibold mb-3 text-gray-800 text-lg">
                            {selectedFiles &&
                                <h3 className="text-sm text-gray-600">
                                    Selected files: {Array.from(selectedFiles).map(file => file.name).join(', ')}
                                </h3>
                            }
                        </div>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                            {searchQuery || selectedCategory !== 'all'
                                ? "No documents match your search criteria. Try adjusting your filters or clear your search."
                                : "Upload PDF documents to help your AI receptionist answer questions accurately. Only PDF files are supported."
                            }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {(searchQuery || selectedCategory !== 'all') &&
                                <Button variant="secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                                    Clear Filters
                                </Button>
                            }
                            <form onSubmit={formik.handleSubmit}>
                                <input
                                    type="file"
                                    id="fileInput"
                                    multiple
                                    accept=".pdf"
                                    onChange={handleFileSelection}
                                    className="hidden"
                                />
                                <div className="flex gap-2 items-center">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                                        onClick={() => document.getElementById('fileInput')?.click()}
                                        disabled={isUploading}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Select PDF Files
                                    </Button>
                                    {selectedFiles && (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isUploading}
                                            className="flex items-center gap-2"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                    Uploading...
                                                </>
                                            ) : 'Submit'}
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {

                                            setSelectedFiles(null);
                                            formik.resetForm();
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                }
            </Card>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[2000] bg-black/80  bg-opacity-130 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showEditConfirm && (
                <div className="fixed inset-0  bg-opacity-130 backdrop-blur-sm flex items-center justify-center z-50">
                    <form onSubmit={handleUpdateDocumentName} className="bg-white rounded-lg p-6 shadow max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Document</h3>
                        <div className="mb-4">
                            <label htmlFor="documentName" className="block text-sm font-medium text-gray-700 mb-2">
                                Document Name
                            </label>
                            <input
                                type="text"
                                id="documentName"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter new document name"
                                value={updateDocumentName || ''}
                                onChange={(e) => setUpdateDocumentName(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowEditConfirm(false);
                                    setUpdateDocumentName(null);
                                    setDocumentId("");
                                    setDocumentToEdit(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                            >
                                Update
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default DocumentsComponent
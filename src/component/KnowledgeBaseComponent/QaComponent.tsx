import React from 'react'
import Card from '../common/Card'
import Button from '../common/Button'

type Props = {
    setShowAddQaForm: (show: boolean) => void;
    commonInputClasses: string;
    filteredQaPairs: any;
    showAddQaForm: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    removeQaPair: (id: string) => void;
}
const QaComponent = ({ setShowAddQaForm,  commonInputClasses,  filteredQaPairs, showAddQaForm, searchQuery, setSearchQuery, removeQaPair}: Props) => {
    return (
        <>
            <Card title="Q&A Pairs" subtitle="Predefined questions and answers for your AI receptionist" className="overflow-x-auto">
                {filteredQaPairs.length === 0 && !showAddQaForm ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center bg-gray-50 m-4 md:m-6">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.755 4 3.923 0 1.268-.527 2.45-1.42 3.308M12 17.25h.008v.008H12v-.008zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /></svg>
                        </div>
                        <h3 className="font-medium mb-3 text-gray-800 text-lg">No Q&A pairs found</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                            {searchQuery ? "No Q&A pairs match your search criteria." : "Create predefined question and answer pairs to enhance AI responses."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {searchQuery && <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear Search</Button>}
                            <Button variant="primary" className="flex items-center justify-center" onClick={() => setShowAddQaForm(true)}>Add Q&A Pair</Button>
                        </div>
                    </div>
                ) : filteredQaPairs.length > 0 ? (
                    <div className="p-4 md:p-0">
                        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center px-2 md:px-0">
                            <div className="font-medium text-gray-700 mb-2 sm:mb-0">{filteredQaPairs.length} Q&A pair{filteredQaPairs.length !== 1 && 's'}</div>
                            <select className={`${commonInputClasses} w-full sm:w-auto`}>
                                <option value="recent">Recently Added</option>
                                <option value="questions">Questions (A-Z)</option>
                                <option value="source">Source Document</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-4">
                            {filteredQaPairs.map((qa:any )=> (
                                <div key={qa.id} className="p-4 md:p-6 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex items-start gap-3 font-semibold text-gray-800 text-base md:text-lg flex-1 min-w-0 pr-2">
                                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">Q</span>
                                            <span className="break-words">{qa.question}</span>
                                        </div>
                                        <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                            <Button variant="text" size="sm" className="p-1.5 text-gray-500 hover:text-blue-600" title="Edit Q&A">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </Button>
                                            <Button variant="text" size="sm" className="p-1.5 text-red-500 hover:text-red-700" title="Delete Q&A" onClick={() => removeQaPair(qa.id)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-gray-700 mb-4 flex items-start gap-3 text-sm md:text-base">
                                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">A</span>
                                        <p className="flex-1 whitespace-pre-wrap break-words">{qa.answer}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 border-t border-gray-200 pt-3 gap-1 sm:gap-2">
                                        <div className="truncate">
                                            {qa.source ? (
                                                <div className="flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    Source: {qa.source}
                                                </div>
                                            ) : (
                                                <span>No source document</span>
                                            )}
                                        </div>
                                        <span className="whitespace-nowrap">Added on {qa.dateAdded}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </Card></>
    )
}

export default QaComponent
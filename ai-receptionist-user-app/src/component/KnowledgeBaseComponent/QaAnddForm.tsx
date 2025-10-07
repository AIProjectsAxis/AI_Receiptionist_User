import React from 'react'
import Card from '../common/Card';
import Button from '../common/Button';

type Props = {
    documents: any;
    setShowAddQaForm: (show: boolean) => void;
    newQaPair: any;
    handleQaInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLSelectElement>) => void;
    handleAddQaPair: (e: React.FormEvent<HTMLFormElement>) => void;
    setNewQaPair: (qaPair: any) => void;
    commonTextareaClasses: string;
    commonInputClasses: string;
}

const QaAnddForm = ({documents, setShowAddQaForm, newQaPair, handleQaInputChange, handleAddQaPair, setNewQaPair, commonTextareaClasses, commonInputClasses}: Props) => {
  return (
    <>
         <Card title="Add New Q&A Pair" subtitle="Create a predefined question and answer" className="mb-6 animate-fadeIn">
          <form onSubmit={handleAddQaPair} className="space-y-6">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input type="text" name="question" id="question" value={newQaPair.question} onChange={handleQaInputChange} className={commonInputClasses} placeholder="E.g., What are your business hours?" required />
            </div>
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea name="answer" id="answer" value={newQaPair.answer} onChange={handleQaInputChange} className={commonTextareaClasses} rows={4} placeholder="Provide a clear and concise answer..." required></textarea>
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">Source Document (Optional)</label>
              <select name="source" id="source" value={newQaPair.source} onChange={handleQaInputChange} className={commonInputClasses}>
                <option value="">None</option>
                {documents.map((doc: any) => <option key={doc.id} value={doc.name}>{doc.name}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">If this Q&A is based on a document, select it here.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => { setShowAddQaForm(false); setNewQaPair({ question: '', answer: '', source: '' });}}>Cancel</Button>
              <Button variant="primary" type="submit">Add Q&A Pair</Button>
            </div>
          </form>
        </Card>
    </>
  )
}

export default QaAnddForm
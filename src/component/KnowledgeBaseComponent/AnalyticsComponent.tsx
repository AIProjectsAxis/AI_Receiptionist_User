"use client"
export const runtime = 'edge';
import React from 'react'
import Card from '../common/Card';
import Button from '../common/Button';

type Props = {
    documents: any;
    qaPairs: any;
    setActiveTab: any;
    setShowAddQaForm: (show: boolean) => void;
}

const AnalyticsComponent = ({documents, qaPairs, setActiveTab, setShowAddQaForm}: Props) => {
  return (
    <>
     <Card title="Knowledge Analytics" subtitle="Insights about your knowledge base usage">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
            {[
              { title: 'Total Documents', value: documents.length, change: '+3 this month' },
              { title: 'Q&A Pairs', value: qaPairs.length, change: '+2 this month' },
              { title: 'Knowledge Coverage', value: '87%', change: '+5% from last month' },
            ].map(stat => (
              <div key={stat.title} className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm text-gray-600 mb-1 md:mb-2">{stat.title}</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{stat.value}</div>
                <div className="text-xs md:text-sm text-blue-600 flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-6">
            {[
              { 
                title: 'Top Questions Asked',
                data: [
                  { q: 'What are your business hours?', a: 42, s: '98%', l: 'Today' },
                  { q: 'Do you offer refunds?', a: 28, s: '95%', l: 'Yesterday' },
                  { q: 'Premium service cost?', a: 23, s: '92%', l: '2 days ago' }
                ],
                headers: ['Question', 'Times Asked', 'Success Rate', 'Last Asked']
              },
              {
                title: 'Knowledge Gaps',
                data: [
                  { q: 'International return policy?', a: 12, n: '100% No Answer', l: '2 days ago' },
                  { q: 'Student discounts?', a: 8, n: '100% No Answer', l: 'Yesterday' }
                ],
                headers: ['Question', 'Times Asked', 'No Answer Rate', 'Last Asked']
              }
            ].map(tableData => (
              <div key={tableData.title} className="bg-white rounded-lg p-4 md:p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold mb-4 text-gray-800 text-base md:text-lg">{tableData.title}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.headers.map(h => (
                          <th key={h} className="py-2 md:py-3 px-3 md:px-4 font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.data.map((row, idx) => {
                        const hasSuccessRate = 's' in row;
                        const rateValue = hasSuccessRate ? row.s : row.n;
                        
                        return (
                          <tr key={idx} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                            <td className="py-2 md:py-3 px-3 md:px-4 text-gray-700">{row.q}</td>
                            <td className="py-2 md:py-3 px-3 md:px-4 text-gray-700 text-center">{row.a}</td>
                            <td className="py-2 md:py-3 px-3 md:px-4 text-gray-700 text-center">{rateValue}</td>
                            <td className="py-2 md:py-3 px-3 md:px-4 text-gray-700 whitespace-nowrap">{row.l}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {tableData.title === 'Knowledge Gaps' && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="primary" size="sm" onClick={() => { setActiveTab('qa'); setShowAddQaForm(true); }}>Add Missing Q&A</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card></>
  )
}

export default AnalyticsComponent
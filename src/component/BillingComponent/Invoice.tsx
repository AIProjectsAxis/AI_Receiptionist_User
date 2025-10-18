import React from 'react'
import Button from '../common/Button';
import Card from '../common/Card';
import { formatDate } from '@/_utils/general';

type Props = {
    invoices: any[];
    setActiveTab: any;
}

const Invoice = ({ invoices, setActiveTab }: Props) => {
    return (
        <>
            <Card
                title="Billing History"
                subtitle="View and download your invoices"
            >
                {invoices.length > 0 ? (
                    <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    {/* <th>Invoice</th> */}
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        {/* <td style={{ fontWeight: '500' }}>{invoice.description}</td> */}
                                        <td>{formatDate(invoice.created_at)}</td>
                                        <td>${invoice.amount.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge badge-${invoice.status === 'paid' ? 'success' : 'warning'}`}>
                                                {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => window.open(invoice?.invoice_pdf, '_blank')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                        <polyline points="7 10 12 15 17 10"></polyline>
                                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                                    </svg>
                                                    Download
                                                </Button>
                                                {/* <Button variant="text" size="sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="8" x2="12" y2="16"></line>
                                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                                    </svg>
                                                </Button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--gray-500)',
                        border: '1px dashed var(--gray-300)'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', color: 'var(--gray-400)' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <div style={{ marginBottom: '1rem', fontWeight: '500', fontSize: '1.125rem' }}>
                            No invoices available
                        </div>
                        <div style={{ fontSize: '0.9375rem' }}>
                            Your billing history will appear here once you've been charged
                        </div>
                    </div>
                )}
            </Card>
            <style jsx>{`
        .billing-tabs {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--glass-border);
          position: relative;
          overflow-x: auto;
        }
        
        .tabs-container {
          display: flex;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
        }
        
        .billing-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          min-width: 120px;
          transition: all var(--transition-normal);
          border: 1px solid transparent;
        }
        
        .billing-tab:hover {
          background: var(--gray-50);
        }
        
        .billing-tab.active {
          background: var(--primary-lighter);
          border-color: var(--primary-light);
          color: var(--primary);
        }
        
        .billing-tab-icon {
          margin-bottom: 0.5rem;
          color: var(--gray-500);
        }
        
        .billing-tab.active .billing-tab-icon {
          color: var(--primary);
        }
        
        .billing-tab-text {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .billing-tab {
            min-width: 100px;
            padding: 0.75rem 1rem;
          }
          
          .billing-tab-text {
            font-size: 0.75rem;
          }
        }
      `}</style>
        </>
    )
}

export default Invoice
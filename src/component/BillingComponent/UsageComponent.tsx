import React from 'react'
import Button from '../common/Button';
import Card from '../common/Card';
import { FcSms } from 'react-icons/fc';
import { Cloud, Mail, MessageCircle } from 'lucide-react';

type Props = {
  usageStats: any;
  setActiveTab: any;
  currentPlanUserHave: any;
}

const UsageComponent = ({ usageStats, setActiveTab, currentPlanUserHave }: Props) => {
  console.log("currentPlanUserHave", currentPlanUserHave);
  console.log("usageStats", usageStats);
  const callsUsed = usageStats?.minutes;
  const smsUsed = usageStats?.sms || 0;
  const storageUsed = usageStats?.storage?.used || 0;
  const storageTotal = usageStats?.storage?.total || 0;
  return (
    <>
      <Card
        title="Usage Statistics"
        subtitle="Monitor your current usage metrics"
      >
        <div className="grid grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'var(--white)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                  Calls Minutes Used
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  {usageStats?.minutes || 0} / {currentPlanUserHave?.plan?.features?.minutes_included} <span className='text-xs text-gray-500'>Minutes</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <div>{(callsUsed / currentPlanUserHave?.plan?.features?.minutes_included * 100).toFixed(2)}% used</div>
                <div>{Number(currentPlanUserHave?.plan?.features?.minutes_included) - Number(callsUsed)} remaining</div>
              </div>
              <div style={{
                height: '8px',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(callsUsed / currentPlanUserHave?.plan?.features?.minutes_included * 100).toFixed(3)}%`,
                  background: callsUsed > 80 ? 'var(--warning)' : 'var(--primary)',
                  borderRadius: 'var(--radius-full)'
                }}></div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--white)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--success-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)'
              }}>
                <MessageCircle />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                  SMS Used
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  {usageStats?.sms || 0} / {currentPlanUserHave?.plan?.features?.sms_included}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <div>{(usageStats?.sms / currentPlanUserHave?.plan?.features?.sms_included * 100).toFixed(0)}% used</div>
                <div>{currentPlanUserHave?.plan?.features?.sms_included - usageStats?.sms} remaining</div>
              </div>
              <div style={{
                height: '8px',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${(usageStats?.sms / currentPlanUserHave?.plan?.features?.sms_included * 100).toFixed(0)}%`,
                  background: 'var(--success)',
                  borderRadius: 'var(--radius-full)'
                }}></div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--white)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--info-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--info)'
              }}>
                <Mail className='w-5 h-5' />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                  Emails Used
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                  {usageStats?.email || 0} / {currentPlanUserHave?.plan?.features?.emails_included}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <div>{usageStats?.email ? (usageStats?.email / currentPlanUserHave?.plan?.features?.emails_included * 100).toFixed(2) : 0}% used</div>
                <div>{currentPlanUserHave?.plan?.features?.emails_included - usageStats?.email} remaining</div>
              </div>
              <div style={{
                height: '8px',
                background: 'var(--gray-100)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${usageStats?.email ? (usageStats?.email / currentPlanUserHave?.plan?.features?.emails_included * 100).toFixed(2) : 0}%`,
                  background: 'var(--info)',
                  borderRadius: 'var(--radius-full)'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--primary-lighter)',
          border: '1px solid var(--primary-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(67, 97, 238, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: '500', fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--primary-dark)' }}>
              Need more capacity?
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
              Your current plan includes {currentPlanUserHave?.plan?.features?.minutes_included} calls per month. Upgrade to a higher plan or contact us for custom pricing options.
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab('subscription');
              }}
            >
              View Plans
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}

export default UsageComponent
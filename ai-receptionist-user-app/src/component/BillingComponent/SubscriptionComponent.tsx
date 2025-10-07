import React, { useState } from 'react'
import Button from '../common/Button';
import Card from '../common/Card';
import { cancelSubscriptionApiRequest, downgradeSubscriptionApiRequest, getStripeCheckoutApiRequest, pauseSubscriptionApiRequest, resumeSubscriptionApiRequest, upgradeSubscriptionApiRequest } from '@/network/api';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { formatBillingDate } from '@/_utils/general';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

type Props = {
  currentPlanPrice: number;
  currentPlanFeatures: string[];
  plans: any[];
  billingCycle: string;
  handleBillingCycleChange: any;
  handlePlanChange: any;
  currentPlanUserHave: any;
  currentSubscriptionError: string;
  subscriptionLoaded: boolean;
  fetchPlans: any;
  getCurrentPlanUserHave: any;
}

const SubscriptionComponent = ({
  plans,
  billingCycle,
  handleBillingCycleChange,
  handlePlanChange,
  currentPlanUserHave,
  currentSubscriptionError = '',
  subscriptionLoaded,
  fetchPlans,
  getCurrentPlanUserHave
}: Props) => {

  const companyData = useSelector((state: any) => state.company.companyData);
  const router = useRouter();
  const [btnLoading, setBtnLoading] = useState(false);
  const [showManagePlan, setShowManagePlan] = useState(false);
  const [manageAction, setManageAction] = useState<'pause' | 'cancel' | 'resume' | null>(null);
  const [btnLoaderWithIcon, setBtnLoaderWithIcon] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgradeDowngradeConfirm, setShowUpgradeDowngradeConfirm] = useState(false);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<any>(null);
  const [changeType, setChangeType] = useState<'upgrade' | 'downgrade' | null>(null);
  const [manageButtonLoading, setManageButtonLoading] = useState(false);
    // console.log("currentPlanUserHave", currentPlanUserHave?.cancel_at_period_end);

  // Helper function to map billing cycle type to display format
  const getBillingCycleDisplay = (billingCycleType: string, billingCycle?: string): string => {

    if (billingCycleType === 'anniversary' && billingCycle === 'month') {
      return 'monthly';
    } else if (billingCycleType === 'anniversary' && billingCycle === 'year') {
      return 'yearly';
    } else if (billingCycleType === 'monthly_anchor') {
      return 'monthly';
    }
    return billingCycleType;
  };

  // Helper function to convert features object to array, including overage/extra costs
  const getFeaturesArray = (features: any): string[] => {
    if (!features) return [];

    const arr: string[] = [];

    if (features.minutes_included > 0) {
      arr.push(`${features.minutes_included.toLocaleString()} Minutes per month`);
    }
    if (features.sms_included > 0) {
      arr.push(`${features.sms_included.toLocaleString()} SMS per month`);
    }
    if (features.emails_included > 0) {
      arr.push(`${features.emails_included.toLocaleString()} Emails per month`);
    }
    if (features.phone_numbers_included > 0) {
      arr.push(`${features.phone_numbers_included} Phone Number${features.phone_numbers_included > 1 ? 's' : ''}`);
    }
    if (features.support_level) {
      arr.push(features.support_level);
    }
    if (features.custom_features && Array.isArray(features.custom_features) && features.custom_features.length > 0) {
      arr.push(...features.custom_features);
    }
    // Add overage/extra costs if present (updated for new structure)
    if (features.extra_phone_number_cost && typeof features.extra_phone_number_cost === 'object' && features.extra_phone_number_cost.usd > 0) {
      arr.push(`$${features.extra_phone_number_cost.usd} per extra phone number`);
    }
    if (features.overage_minute_cost && typeof features.overage_minute_cost === 'object' && features.overage_minute_cost.usd > 0) {
      arr.push(`$${features.overage_minute_cost.usd} per extra minute`);
    }
    if (features.overage_sms_cost && typeof features.overage_sms_cost === 'object' && features.overage_sms_cost.usd > 0) {
      arr.push(`$${features.overage_sms_cost.usd} per extra SMS`);
    }
    if (features.overage_email_cost && typeof features.overage_email_cost === 'object' && features.overage_email_cost.usd > 0) {
      arr.push(`$${features.overage_email_cost.usd} per extra email`);
    }

    return arr;
  };

  // Helper function to filter plans based on billing cycle type
  const getFilteredPlans = (cycle: string) => {
    return plans.filter(plan => {
      if (cycle === 'monthly') {
        // Handle both old and new data structures
        return plan.billing_cycle_type === 'monthly_anchor' || 
               (plan.billing_cycle_type === 'anniversary' && plan.billing_cycle === 'month');
      } else if (cycle === 'yearly') {
        return plan.billing_cycle_type === 'anniversary' && plan.billing_cycle === 'year';
      }
      return true;
    });
  };

  const handlePlanSelection = (planId: string) => {
    // Enable upgrade/downgrade functionality
    if (currentPlanUserHave) {
      if (currentPlanUserHave?.plan?.id !== planId) {
        const selectedPlan = plans?.find(plan => plan.id === planId);
        const isDowngrade = currentPlanUserHave?.plan?.price > selectedPlan?.price;
        
        setSelectedPlanForChange(selectedPlan);
        setChangeType(isDowngrade ? 'downgrade' : 'upgrade');
        setShowUpgradeDowngradeConfirm(true);
        setBtnLoading(false); // Reset loading state when showing confirmation
      }
    } else {
      // New subscription - proceed directly
      fetchSubscriptionCheckout(planId);
    }
  };

  // Enable upgrade/downgrade confirmation function
  const confirmPlanChange = async () => {
    if (!selectedPlanForChange || !changeType) return;
    
    setBtnLoading(true);
    
    try {
      let response;
      response = await upgradeSubscriptionApiRequest(currentPlanUserHave?.id, {
        new_plan_id: selectedPlanForChange.id,
        subscription_id: currentPlanUserHave?.id
      });
      toast.success('Subscription upgraded successfully',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      
      // Close the confirmation dialog after successful API call
      setShowUpgradeDowngradeConfirm(false);
      setSelectedPlanForChange(null);
      setChangeType(null);
      
      // Redirect to checkout if there's a checkout URL
      if (response?.data?.checkout_url) {
        router.push(response?.data?.checkout_url);
      }
      
      // Refresh the current plan data
      getCurrentPlanUserHave();
    } catch (error) {
      console.error('Error changing subscription:', error);
      toast.error('Error changing subscription',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const fetchSubscriptionCheckout = async (planId: string) => {
    if (currentPlanUserHave) {
      if (currentPlanUserHave?.plan?.id !== planId) {
        // This should not be called directly anymore - use handlePlanSelection instead
        return;
      }
    } else {
      const response : any = await getStripeCheckoutApiRequest({
        plan_id: planId,
        company_id: companyData.id,
      });
      toast.success('New subscription initiated',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      console.log("response---", response?.checkout_url);
      router.push(response?.checkout_url);
    }
    setBtnLoading(false);
    getCurrentPlanUserHave();
    setBtnLoading(false);
    
  };

  const handlePauseSubscription = async () => {

    setIsProcessing(true);
    try {
      const response = await pauseSubscriptionApiRequest(currentPlanUserHave?.id);

      if (response?.data) {
        // alert('Subscription paused successfully');
        toast.success('Subscription paused successfully',{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowManagePlan(false);
        setManageAction(null);
        setPauseReason('');
        // Refresh the page or update the subscription data
        // window.location.reload();
        getCurrentPlanUserHave()
        fetchPlans()

      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription. Please try again.',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const response = await cancelSubscriptionApiRequest(currentPlanUserHave?.id);

      if (response?.data) {
        // alert('Subscription cancelled successfully');
        toast.success('Subscription cancelled successfully',{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowManagePlan(false);
        setManageAction(null);
        // Refresh the page or update the subscription data
        // window.location.reload();
        getCurrentPlanUserHave()
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
     toast.error('Failed to cancel subscription. Please try again.',{
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
     });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsProcessing(true);
    try {
      const response = await resumeSubscriptionApiRequest(currentPlanUserHave?.id);

      if (response?.data) {
        // alert('Subscription resumed successfully');
        toast.success('Subscription resumed successfully',{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setShowManagePlan(false);
        setManageAction(null);
        // Refresh the page or update the subscription data
        // window.location.reload();
        getCurrentPlanUserHave()
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription. Please try again.',{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <>
      {subscriptionLoaded && (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
      {!subscriptionLoaded && (
        <>
          {currentPlanUserHave ? (
            <Card
              title="Current Subscription"
              subtitle="Your active plan and details"
              style={{ marginBottom: '2rem' }}
            >
              <div className='flex justify-center items-center w-full'>
                {currentSubscriptionError && (
                  <div className='text-red-500 text-center text-xl'>
                    {currentSubscriptionError}
                  </div>
                )}
              </div>
              {!currentSubscriptionError && (
                <div>
                  <div className='absolute top-4 right-4'>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => {
                        setManageButtonLoading(true);
                        setShowManagePlan(true);
                        setManageButtonLoading(false);
                      }}
                      disabled={manageButtonLoading}
                    >
                      {manageButtonLoading ? (
                        btnLoaderWithIcon ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Loading...
                          </span>
                        ) : (
                          'Loading...'
                        )
                      ) : (
                        'Manage Plan'
                      )}
                    </Button>
                  </div>
                  <div className='flex justify-between items-center w-full'>
                    <div>
                      <div className='space-x-3' style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      <span>  {currentPlanUserHave?.plan?.name} </span>
                         <span className='text-sm rounded-md px-2 py-1 bg-green-600 text-white'>{currentPlanUserHave?.status}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                        Next billing date: {formatBillingDate(currentPlanUserHave?.next_billing_date)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--gray-900)'
                    }}>
                      <span className='text-xl font-bold' >
                        {currentPlanUserHave?.plan?.price} /{getBillingCycleDisplay(currentPlanUserHave?.plan?.billing_cycle_type, currentPlanUserHave?.plan?.billing_cycle) === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--glass-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
                        <p className='text-sm font-bold my-1 '>Active Features</p>
                        <ul className='flex  gap-2' style={{ paddingLeft: 0, margin: 0, flexWrap: 'wrap' }}>
                          {getFeaturesArray(currentPlanUserHave?.plan?.features).map((feature: string, index: number) => (
                            <li
                              className='bg-blue-100 text-primary-600 rounded-md px-2 py-1'
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                fontSize: '0.875rem',
                                color: 'var(--gray-700)',
                                listStyle: 'none'
                              }}
                            >
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card
              title="No Active Subscription"
              subtitle="Get started with a plan to unlock all features"
              style={{ marginBottom: '2rem' }}
            >
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                {/* No Subscription Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg 
                      className="w-10 h-10 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    You don't have an active subscription yet. Choose a plan below to get started and unlock all the features for your business.
                  </p>
                </div>

                {/* Benefits List */}
               
                {/* CTA */}
                <div className="text-sm text-gray-500">
                  <p>Ready to get started? Choose a plan below </p>
                </div>
              </div>
            </Card>
          )}

          <Card
            title="Available Plans"
            subtitle="Choose the right plan for your business"
          >
            {/* {plans?.find(plan => (plan.billing_cycle_type === 'anniversary' || plan.billing_cycle_type === 'monthly_anchor')) && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  gap: '0.5rem',
                  background: 'var(--gray-100)',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '0.5rem'
                }}>
                  <button
                    className={`billing-toggle ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => handleBillingCycleChange('monthly')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: billingCycle === 'monthly' ? 'var(--white)' : 'transparent',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      color: billingCycle === 'monthly' ? 'var(--primary)' : 'var(--gray-500)',
                      boxShadow: billingCycle === 'monthly' ? 'var(--shadow-sm)' : 'none',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    className={`billing-toggle ${billingCycle === 'yearly' ? 'active' : ''}`}
                    onClick={() => handleBillingCycleChange('yearly')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: billingCycle === 'yearly' ? 'var(--white)' : 'transparent',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      color: billingCycle === 'yearly' ? 'var(--primary)' : 'var(--gray-500)',
                      boxShadow: billingCycle === 'yearly' ? 'var(--shadow-sm)' : 'none',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Yearly
                  </button>
                </div>
              </div>)} */}

            <div className="grid grid-3" style={{ gap: '1.5rem' }}>
              {getFilteredPlans(billingCycle).map(plan => (
                <div
                  key={plan.id}
                  className="plan-card"
                  style={{
                    position: 'relative',
                    padding: '1.5rem',
                    background: 'var(--white)',
                    border: `1px solid ${plan.id === false ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: plan.id === false ? '0 0 0 3px rgba(67, 97, 238, 0.2)' : 'var(--shadow-md)',
                    transition: 'all var(--transition-normal)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    fontSize: '1.25rem',
                    color: 'var(--gray-900)',
                    marginBottom: '0.5rem'
                  }}>
                    {plan.name}
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {plan?.price}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      /{getBillingCycleDisplay(plan?.billing_cycle_type, plan?.billing_cycle)}
                    </span>
                  </div>
                  <div className='mb-2 border-b border-gray-200 pb-2'>
                      <p className='text-sm text-gray-500'>
                        {plan?.description}
                      </p>
                  </div>

                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 1.5rem 0',
                    flex: 1
                  }}>
                    {getFeaturesArray(plan.features).map((feature: string, index: number) => (
                      <li
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.875rem',
                          color: 'var(--gray-700)'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 'auto' }}>
                    {plan.id === currentPlanUserHave?.plan?.id ? (
                      <Button
                        variant="secondary"
                        style={{ width: '100%', fontWeight: '600' }}
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : currentPlanUserHave ? (
                      // Enable upgrade/downgrade button for existing subscribers
                      <Button
                        variant={plan.popular ? 'primary' : 'secondary'}
                        style={{ width: '100%', fontWeight: '600', position: 'relative' }}
                        onClick={() => {
                          setBtnLoading(true);
                          setBtnLoaderWithIcon(plan.id);
                          handlePlanSelection(plan.id);
                        }}
                        disabled={btnLoading}
                      >
                        {btnLoading && btnLoaderWithIcon === plan.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Processing...
                          </span>
                        ) : (
                          'Select Plan'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant={plan.popular ? 'primary' : 'secondary'}
                        style={{ width: '100%', fontWeight: '600', position: 'relative' }}
                        onClick={() => {
                          setBtnLoading(true);
                          setBtnLoaderWithIcon(plan.id);
                          handlePlanSelection(plan.id);
                        }}
                        disabled={btnLoading}
                      >
                        {btnLoading && btnLoaderWithIcon === plan.id ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            Processing...
                          </span>
                        ) : (
                          'Select Plan'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {showManagePlan && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: 'var(--shadow-xl)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    margin: 0
                  }}>
                    Manage Subscription
                  </h2>
                  <button
                    onClick={() => {
                      setShowManagePlan(false);
                      setManageAction(null);
                      setPauseReason('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: 'var(--gray-500)',
                      padding: '0.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>

                {!manageAction ? (
                  <div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: 'var(--gray-900)',
                        marginBottom: '0.5rem'
                      }}>
                        Current Plan: {currentPlanUserHave?.plan?.name}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--gray-600)',
                        margin: 0
                      }}>
                        Status: {currentPlanUserHave?.status}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {currentPlanUserHave?.cancel_at_period_end ? (
                        <Button
                          variant="primary"
                          disabled={true}
                          onClick={() => setManageAction('resume')}
                         
                        >
                          Your plan is already cancelled.
                        </Button>
                      ) : (
                        <>
                          {/* <Button
                            variant="secondary"
                            onClick={() => setManageAction('pause')}
                            disabled={isProcessing}
                          >
                            Pause Subscription
                          </Button> */}
                          <Button
                            variant="button"
                            className='w-full !bg-red-500 !text-white'
                            onClick={() => setManageAction('cancel')}
                            disabled={isProcessing}
                          >
                            Cancel Subscription
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : manageAction === 'pause' ? (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      color: 'var(--gray-900)',
                      marginBottom: '1rem'
                    }}>
                      Pause Subscription
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-600)',
                      marginBottom: '1rem'
                    }}>
                      Your subscription will be paused and you won't be charged until you resume it. You can resume at any time.
                    </p>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--gray-700)',
                        marginBottom: '0.5rem'
                      }}>
                        Reason for pausing (optional)
                      </label>
                      <textarea
                        value={pauseReason}
                        onChange={(e) => setPauseReason(e.target.value)}
                        placeholder="Tell us why you're pausing your subscription..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '0.75rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setManageAction(null)}
                        disabled={isProcessing}
                      >
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handlePauseSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Pausing...' : 'Pause Subscription'}
                      </Button>
                    </div>
                  </div>
                ) : manageAction === 'cancel' ? (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      color: 'var(--gray-900)',
                      marginBottom: '1rem'
                    }}>
                      Cancel Subscription
                    </h3>
                    <div style={{
                      padding: '1rem',
                      background: 'var(--red-50)',
                      border: '1px solid var(--red-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--red-700)',
                        margin: 0
                      }}>
                        ⚠️ Warning: Cancelling your subscription will stop auto-renewal from the next billing cycle. You’ll retain access until the end of your current period, after which premium features will be disabled.
                      </p>
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-600)',
                      marginBottom: '1rem'
                    }}>
                      Are you sure you want to cancel your subscription? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setManageAction(null)}
                        disabled={isProcessing}
                      >
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                      </Button>
                    </div>
                  </div>
                ) : manageAction === 'resume' ? (
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      color: 'var(--gray-900)',
                      marginBottom: '1rem'
                    }}>
                      Resume Subscription
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-600)',
                      marginBottom: '1rem'
                    }}>
                      Your subscription will be reactivated and billing will resume immediately.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setManageAction(null)}
                        disabled={isProcessing}
                      >
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleResumeSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Resuming...' : 'Resume Subscription'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Upgrade/Downgrade Confirmation Popup - Enabled */}
          {showUpgradeDowngradeConfirm && selectedPlanForChange && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: 'var(--shadow-xl)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    margin: 0
                  }}>
                    Confirm {changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowUpgradeDowngradeConfirm(false);
                      setSelectedPlanForChange(null);
                      setChangeType(null);
                      setBtnLoading(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: 'var(--gray-500)',
                      padding: '0.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  {currentPlanUserHave?.cancel_at_period_end ? (
                    <div style={{
                      padding: '1rem',
                      background: 'var(--yellow-50)',
                      border: '1px solid var(--yellow-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.95rem',
                        color: 'var(--yellow-800)',
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        Your current plan is active and scheduled to be cancelled at the end of the billing period.<br />
                        <span style={{ color: 'var(--gray-800)' }}>
                          You are not eligible to upgrade or change your plan until your current subscription ends.<br />
                          After your current plan finishes, you will be able to select a new plan.
                        </span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        padding: '1rem',
                        background: changeType === 'upgrade' ? 'var(--blue-50)' : 'var(--yellow-50)',
                        border: `1px solid ${changeType === 'upgrade' ? 'var(--blue-200)' : 'var(--yellow-200)'}`,
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.875rem',
                          color: changeType === 'upgrade' ? 'var(--blue-700)' : 'var(--yellow-700)',
                          margin: 0,
                          fontWeight: '500'
                        }}>
                          {changeType === 'upgrade' ? '⬆️' : '⬇️'} You are about to {changeType} your subscription
                        </p>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '500',
                          color: 'var(--gray-900)',
                          marginBottom: '0.5rem'
                        }}>
                          Plan Change Details
                        </h3>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>From</div>
                            <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                              {currentPlanUserHave?.plan?.name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                              {currentPlanUserHave?.plan?.price} /{getBillingCycleDisplay(currentPlanUserHave?.plan?.billing_cycle_type, currentPlanUserHave?.plan?.billing_cycle) === 'monthly' ? 'mo' : 'yr'}
                            </div>
                          </div>
                          <div style={{ fontSize: '1.5rem', color: 'var(--gray-400)' }}>→</div>
                          <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>To</div>
                            <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                              {selectedPlanForChange.name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                              {selectedPlanForChange.price} /{getBillingCycleDisplay(selectedPlanForChange.billing_cycle_type, selectedPlanForChange.billing_cycle)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {changeType === 'downgrade' && (
                        <div style={{
                          padding: '1rem',
                          background: 'var(--red-50)',
                          border: '1px solid var(--red-200)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1rem'
                        }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--red-700)',
                            margin: 0
                          }}>
                            ⚠️ Warning: Downgrading may result in loss of features or reduced limits. 
                            Make sure this plan meets your current needs.
                          </p>
                        </div>
                      )}

                      {changeType === 'upgrade' && (
                        <div style={{
                          padding: '1rem',
                          background: 'var(--green-50)',
                          border: '1px solid var(--green-200)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1rem'
                        }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--green-700)',
                            margin: 0
                          }}>
                            ✅ Great choice! You'll get access to more features and higher limits with this upgrade.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowUpgradeDowngradeConfirm(false);
                      setSelectedPlanForChange(null);
                      setChangeType(null);
                      setBtnLoading(false);
                    }}
                    disabled={btnLoading}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={changeType === 'upgrade' ? 'primary' : 'secondary'}
                    onClick={confirmPlanChange}
                    disabled={btnLoading || !!currentPlanUserHave?.cancel_at_period_end}
                    style={{ flex: 1 }}
                  >
                    {btnLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        {changeType === 'upgrade' ? 'Upgrading...' : 'Downgrading...'}
                      </span>
                    ) : (
                      currentPlanUserHave?.cancel_at_period_end
                        ? 'Not Eligible'
                        : `Confirm ${changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default SubscriptionComponent
'use client';
export const runtime = 'edge';

import Invoice from '@/component/BillingComponent/Invoice';
import UsageComponent from '@/component/BillingComponent/UsageComponent';
import React, { useState, useEffect, useRef } from 'react';
import SubscriptionComponent from '@/component/BillingComponent/SubscriptionComponent';
import { currentSubscriptionApiRequest, getInvoiceListApiRequest, getStripePlansApiRequest, upgradeSubscriptionApiRequest, getUsageListApiRequest } from '@/network/api';
import BillingComponent from '@/component/BillingComponent/BillingComponent';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';


type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  downloadUrl: string;
};

type UsageStats = {
  calls: UsageDetail;
  agents: UsageDetail;
  storage: UsageDetail;
};

type UsageDetail = {
  used: number;
  total: number;
  percentage: number;
};

type NewCard = {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
};

type TabType = 'subscription' | 'payment methods' | 'invoices' | 'usage';

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  billing_cycle_type: string;
  billing_anchor_day: number | null;
  features: {
    minutes_included: number;
    sms_included: number;
    emails_included: number;
    phone_numbers_included: number;
    support_level: string;
    custom_features: string[];
    extra_phone_number_cost: number;
    overage_minute_cost: number;
    overage_sms_cost: number;
    overage_email_cost: number;
  };
  description: string;
  is_active: boolean;
  discount_percentage: number | null;
  original_price: number | null;
  discount_label: string | null;
  is_company_specific: boolean;
  assigned_company_ids: string[];
  created_by_admin_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};


const Billing: React.FC = () => {
  const singleTypeLoad = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [isLoading, setIsLoading] = useState(true);
  const [plansLists, setPlansLists] = useState<any[]>([]);
  const router = useRouter();
  
  // Get user role from Redux store
  const profileDetails = useSelector((state: any) => state.company.profileDetails);
  const companyData = useSelector((state: any) => state.company.companyData);
  const [currentPlanUserHave, setCurrentPlanUserHave] = useState<any>();
  const [currentSubscriptionError, setCurrentSubscriptionError] = useState<string>('');
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>();
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [usageStats] = useState<UsageStats>({
    calls: { used: 248, total: 500, percentage: 49.6 },
    agents: { used: 2, total: 3, percentage: 66.7 },
    storage: { used: 1.2, total: 5, percentage: 24 },
  });

  // Redirect non-owner users away from billing page
  useEffect(() => {
    if (!profileDetails?.companies || !companyData?.id) {
      router.replace('/dashboard');
      return;
    }
    
    // Check if user has access to the current company
    const userCompany = profileDetails.companies.find((company: any) => company.company_id === companyData.id);
    if (!userCompany || userCompany.role !== 'owner') {
      router.replace('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [profileDetails, companyData, router]);

  const fetchPlans = async () => {
    getStripePlansApiRequest().then(res => {
        // Check if res.data is an array or if we need to access a nested property
        const plansData = Array.isArray(res.data) ? res.data : res.data?.plans || [];
        // Extract plans with currency_options.usd as a number, then sort by that value (ascending)
        const filteredAndSortedPlans = plansData
          .filter((plan: any) => typeof plan?.currency_options?.usd === 'number')
          .sort((a: any, b: any) => a.currency_options.usd - b.currency_options.usd);
        setPlansLists(filteredAndSortedPlans);
        
        // Set initial current plan based on default billing cycle
        // const filteredPlans = plansData.filter((plan: any) => {
        //   if (billingCycle === 'monthly') {
        //     return plan.billing_cycle_type === 'monthly_anchor';
        //   } else if (billingCycle === 'yearly') {
        //     return plan.billing_cycle_type === 'anniversary';
        //   }
        //   return true;
        // });
      });
  }

  const getCurrentPlanUserHave = async () => {
    setSubscriptionLoaded(true);
    try{
      const response = await currentSubscriptionApiRequest();
      console.log("response CURRENT---+", response?.data?.subscription);
      if(response?.data?.subscription === null){
        console.log("No subscription found");
        setCurrentSubscriptionError('No subscription found');
        return;
      }
      else{
        setCurrentPlanUserHave(response?.data?.subscription);
        setCurrentSubscriptionError('');
      }

    }catch(error :any){
      console.log("error---+", error?.message);
      setCurrentSubscriptionError(error?.message);
    }finally{
      setSubscriptionLoaded(false);
    }
  }

  const getInvoiceList = async () => {
    const response = await getInvoiceListApiRequest();
    console.log("response INVOICE---+", response?.data?.invoices);
    setInvoices(response?.data?.invoices);
  }

  const getUsageList = async () => {
    const response = await getUsageListApiRequest();
    console.log("response USAGE---+", response?.data);
    setUsage(response?.data);
  }

  // Load Stripe plans
  useEffect(() => {
    if (!singleTypeLoad.current) {
      singleTypeLoad.current = true;
      fetchPlans();
      getCurrentPlanUserHave();
      getInvoiceList();
      getUsageList();
    }
  }, []);

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }


  const currentPlanFeatures: string[] = [];
  // const currentPlanName = plansLists.find(p => p.id === currentPlan)?.name || '';
  const currentPlanPrice = plansLists.find(p => p.id === currentPlanUserHave)?.price || 0;


  const handlePlanChange = (planId: string) => setCurrentPlanUserHave(planId);
  const handleBillingCycleChange = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    
    // Set default current plan based on the selected cycle
    const filteredPlans = plansLists.filter(plan => {
      if (cycle === 'monthly') {
        return plan.billing_cycle_type === 'monthly_anchor';
      } else if (cycle === 'yearly') {
        return plan.billing_cycle_type === 'anniversary';
      }
      return true;
    });
    
    // Set the first available plan as current, or empty if no plans available
  
  };

  const tabs: TabType[] = ['subscription', 'invoices', 'usage'];

  return (
    <div>
      <div className="mb-8">
        <div>
          <div className="text-2xl font-semibold text-gray-900">Billing & Subscription</div>
          <div className="text-sm text-gray-600">Manage your subscription plan and payment methods</div>
        </div>
      </div>
      
      {/* Billing Tabs */}
      <BillingComponent tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Subscription Plan Tab */}
      {activeTab === 'subscription' && (
        <SubscriptionComponent 
          currentSubscriptionError={currentSubscriptionError}
          currentPlanPrice={currentPlanPrice} 
          currentPlanFeatures={currentPlanFeatures} 
          plans={plansLists} 
          billingCycle={billingCycle} 
          fetchPlans={fetchPlans}
          getCurrentPlanUserHave={getCurrentPlanUserHave}
          handleBillingCycleChange={handleBillingCycleChange} 
          handlePlanChange={handlePlanChange} 
          currentPlanUserHave={currentPlanUserHave}
          subscriptionLoaded={subscriptionLoaded}
        />
      )}
      
      {/* Payment Methods Tab */}
      {/* {activeTab === 'payment methods' && (
        <PaymentComponent card={paymentMethods} handleCardInputChange={handleCardInputChange} handleAddCard={handleAddCard} getCardType={getCardType} setDefaultCard={setDefaultCard} removeCard={removeCard} />
      )}
       */}
      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Invoice invoices={invoices} setActiveTab={setActiveTab} />
      )}
      
      {/* Usage Tab */}
      {activeTab === 'usage' && (
       <UsageComponent usageStats={usage} setActiveTab={setActiveTab} currentPlanUserHave={currentPlanUserHave} />
      )}
    </div>
  );
};

export default Billing;

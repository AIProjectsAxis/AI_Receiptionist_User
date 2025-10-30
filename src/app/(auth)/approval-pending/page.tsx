"use client";

import React, { useEffect, useState } from 'react';
import Card from '@/component/common/Card';
import { getCompanyCountsStatsApiRequest, getCompanyOnBoardingApiRequest } from '@/network/api';
import { useRouter } from 'next/navigation';


const ApprovalPendingPage = () => {
  const router = useRouter();
  const getCompanyData = async () => {
    const response = await getCompanyOnBoardingApiRequest();
    if(response?.data?.status=== "approved"){
      router.push("/dashboard");
    }
  }
  useEffect(() => {
    getCompanyData()
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card>
        <div className="text-center p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Account not verified – approval is pending.
          </h2>
          <div className="text-gray-600 mb-6">
            <p>Your account is currently not verified.</p>
            <p>Please wait for an administrator to verify and activate your account.</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-700">
              Once your account is verified, you will be able to access all features.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApprovalPendingPage;
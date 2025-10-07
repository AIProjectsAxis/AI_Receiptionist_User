import { createAsyncThunk } from "@reduxjs/toolkit";
import {  getCompanyOnBoardingApiRequest, getCompanySwitchApiRequest, getUserProfileApiRequest, switchCompanyApiRequest } from "@/network/api";
import { setToken } from "@/_utils/cookies";

const getProfileDetailsThunkRequest = createAsyncThunk("company/getProfileDetails", async () => {
    try {
        const response = await getUserProfileApiRequest ();
        return response.data;
    } catch (error) {
        console.log(error);
        return error;
    }
});

const getCompanyDataThunkRequest = createAsyncThunk("company/getCompanyData", async () => {
    try {
        const response = await getCompanyOnBoardingApiRequest();
        // if(response.data.status_onboarding === "pending_onboarding" || response.data.status === "pending" || response.data.status_onboarding !== "completed"){
        //     router.push('/onboarding')
        // }
        return response.data;
    } catch (error) {
        console.log(error);
        return error;
    }
});

const getCompanySwitchThunkRequest = createAsyncThunk("company/getCompanySwitch", async (company_id: string) => {
    try {
        const response = await switchCompanyApiRequest({company_id: company_id});

        if(response.data.token){
            setToken(response.data.token);
            getCompanyDataThunkRequest()
        }
        return response.data;
    } catch (error) {
        console.log(error);
        return error;
    }
});

export { getProfileDetailsThunkRequest, getCompanyDataThunkRequest, getCompanySwitchThunkRequest };
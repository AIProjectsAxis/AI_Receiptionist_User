import { ENDPOINTS } from "./EndPoint";

import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "./ApiRequest";
import { formatDateForAPI } from "@/_utils/general";


// User
export const getUserProfileApiRequest = async () => {
  return getRequest(ENDPOINTS.USER_PROFILE);
};

export const updateUserProfileApiRequest = async (payload: any) => {
  return putRequest(ENDPOINTS.USER_PROFILE, payload);
};

export const updateUserPasswordApiRequest = async (payload: any) => {
  return putRequest(ENDPOINTS.USER_PROFILE_PASSWORD_UPDATE, payload);
};

//  Authentication
export const loginApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.LOGIN, payload);
};

export const registerMailApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.REGISTER_MAIL, payload);
};

export const sendOtpApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.SEND_OTP, payload);
};

export const setPasswordApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.SET_PASSWORD, payload);
};

export const verifyResetPasswordOtpApiRequest = async (payload: any) => {
  return postRequest(`${ENDPOINTS.VERIFY_RESET_PASSWORD}`, payload);
};

export const forgotPasswordApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.FORGOT_PASSWORD, payload);
};


// Assistant Management
export const getAssistantListApiRequest = async (page: number = 1, pageSize: number = 10) => {
  return getRequest(`${ENDPOINTS.ASSISTANT}?page=${page}&page_size=${pageSize}`);
};

export const createCloneAgent = async (Id: string) => {
  return postRequest(`assistant/${Id}/${ENDPOINTS.CLONE_AGENT}`, {});
};

// Company
export const getCompanyOnBoardingApiRequest = () => {
  return getRequest(ENDPOINTS.ONBOARDING_GET);
};

export const updateCompanyApiRequest = (payload: any) => {
  return putRequest(ENDPOINTS.ONBOARDING_GET, payload);
};

// Call Management
export const getCallListApiRequest = async (Id: string = "") => {
  if (Id) {
    return getRequest(`${ENDPOINTS.CALL_LIST_BY_ID}/${Id}`);
  }
  return getRequest(ENDPOINTS.CALL_LIST);
};

export const getCallDetailsApiRequest = async (Id: string) => {
  return getRequest(`${ENDPOINTS.CALL_DETAILS_BY_ID}/${Id}`);
};

// Knowledge Base Management
export const getKnowledgeBaseDocumentsListApiRequest = async () => {
  return getRequest(ENDPOINTS.KNOWLEDGE_BASE_DOCUMENTS_LIST);
};

export const uploadKnowledgeBaseDocumentsApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.KNOWLEDGE_BASE_DOCUMENTS_UPLOAD, payload);
};

export const deleteKnowledgeBaseDocumentsApiRequest = async (Id: string) => {
  return deleteRequest(`${ENDPOINTS.KNOWLEDGE_BASE_DOCUMENTS}/${Id}`);
};

export const updateKnowledgeBaseDocumentsApiRequest = async (
  Id: string,
  payload: any
) => {
  return putRequest(`${ENDPOINTS.KNOWLEDGE_BASE_DOCUMENTS}/${Id}`, payload);
};

export const getKnowledgeBaseDocumentsByIdApiRequest = async (Id: string) => {
  return getRequest(`${ENDPOINTS.KNOWLEDGE_BASE_DOCUMENTS}/${Id}`);
};

// Agent Management

export const createAgentApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.AGENT_DATA, payload);
};

export const getAgentByIdApiRequest = async (Id: string) => {
  return getRequest(`${ENDPOINTS.AGENT_DATA}${Id}`);
};

export const updateAgentApiRequest = async (Id: string, payload: any) => {
  return putRequest(`${ENDPOINTS.AGENT_DATA}${Id}`, payload);
};

export const deleteAgentApiRequest = async (Id: string) => {
  return deleteRequest(`${ENDPOINTS.AGENT_DATA}${Id}`);
};

// Phone Number Management
export const getAlReadyHavePhoneNumberApiRequest = async (
  page: number = 1,
  pageSize: number = 50
) => {
  return getRequest(
    `${ENDPOINTS.PHONE_NUMBER_LIST}?page=${page}&page_size=${pageSize}`
  );
};

export const buyPhoneNumberApiRequest = async (payload: any) => {
  return postRequest(ENDPOINTS.PHONE_NUMBER_BUY, payload);
};

export const assignPhoneNumberApiRequest = async (Id: string, payload: any) => {
  return putRequest(`${ENDPOINTS.PHONE_NUMBER}/${Id}`, payload);
};

export const listPhoneNumberApiRequest = async (
  country: string = "CA",
  locality: string = "",
  area_code: string = ""
) => {
  const queryParams = new URLSearchParams();
  if (country) queryParams.append("country", country);
  if (locality) queryParams.append("locality", locality);
  if (area_code) queryParams.append("area_code", area_code);
  return getRequest(
    `${ENDPOINTS.PHONE_NUMBER_AVAILABLE}?${queryParams.toString()}`
  );
};

export const deletePhoneNumberApiRequest = async (Id: string) => {
  return deleteRequest(`${ENDPOINTS.PHONE_NUMBER}/${Id}`);
};

// App Integrations

export const fetchLatestCalendarApiRequest = () => {
  return getRequest(ENDPOINTS.CALENDAR_FETCH_ALL_LATEST);
};

export const removeCalendarAccountApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.CALENDAR_REMOVE + Id);
};

export const connectCalendarApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.CONNECT_CALENDAR, payload);
};

export const disconnectCalendarApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.CALENDAR + Id);
};

export const googleAuthApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.GOOGLE_AUTH, payload);
};

export const outlookAuthApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.OUTLOOK_AUTH, payload);
};

export const zohoAuthApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.ZOHO_AUTH, payload);
};

export const zohoIntegrationListApiRequest = () => {
  return getRequest(ENDPOINTS.ZOHO_INTEGRATION);
};

export const zohoDisconnectApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.ZOHO_INTEGRATION + "/" + Id);
};

// Actions
export const createActionApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.CREATE_ACTION, payload);
};

export const getActionListApiRequest = (page: number = 1, pageSize: number = 1000) => {
  return getRequest(ENDPOINTS.ACTIONS + `?page=${page}&page_size=${pageSize}`);
};
export const getActionByIdApiRequest = (Id: string) => {
  return getRequest(ENDPOINTS.ACTION + Id);
};

export const deleteActionApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.ACTION + Id);
};

export const updateActionApiRequest = (Id: string, payload: any) => {
  return putRequest(ENDPOINTS.ACTION + Id, payload);
};

// Calendar Management

export const getCalendarListApiRequest = () => {
  return getRequest(ENDPOINTS.CALENDAR_LIST);
};

export const getCalendarAvailabilityApiRequest = () => {
  return getRequest(ENDPOINTS.CALENDAR_FETCH_ALL_LATEST);
};
export const updateCalendarAvailabilityApiRequest = (
  Id: string,
  payload: any
) => {
  return putRequest(ENDPOINTS.CALENDAR_FETCH_ALL_LATEST + Id, payload);
};

export const getCalendarEventsApiRequest = (
  Id?: string,
  startDate?: string,
  endDate?: string
) => {
  if (Id) {
    return getRequest(
      `${ENDPOINTS.GOOGLE_CALENDAR_LIST}?calendar_id=${Id}&start_time=${startDate}&end_time=${endDate}`
    );
  }
  let startDateTemp = new Date();
  let endDateTemp = new Date();
  endDateTemp.setDate(endDateTemp.getDate() + 30);
  const formattedStartDate = formatDateForAPI(startDateTemp);
  const formattedEndDate = formatDateForAPI(endDateTemp);
  return getRequest(
    `${ENDPOINTS.GOOGLE_CALENDAR_LIST}?start_time=${formattedStartDate}&end_time=${formattedEndDate}`
  );
};

export const getBookingCalendarApiRequest = () => {
  return getRequest(`${ENDPOINTS.GOOGLE_CALENDAR_LIST}`);
};


// Team Members Management
export const getTeamMembersApiRequest = () => {
    return getRequest(ENDPOINTS.TEAM_MEMBER);
};

export const createTeamMemberInviteApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.TEAM_INVITE, payload);
};

export const updateTeamMemberStatusApiRequest = (Id: string, payload: any) => { 
  return putRequest(ENDPOINTS.TEAM_INVITE + Id, payload);
};

export const deleteTeamMemberApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.TEAM_MEMBER + "/" + Id);
};

export const cancelTeamMemberInviteApiRequest = (Id: string) => {
  return deleteRequest(ENDPOINTS.GET_TEAM_INVITATION + "/" + Id);
};

export const getPendingInvitesApiRequest = () => {
  return getRequest(ENDPOINTS.GET_TEAM_INVITATION_PENDING);
};

export const acceptTeamInvitationApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.ACCEPT_TEAM_INVITATION, payload);
};


// Company 
export const getCompanySwitchApiRequest = () => {
  return getRequest(ENDPOINTS.COMPANY_SWITCH);
};

export const switchCompanyApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.COMPANY_SWITCH, payload);
};


export const OnBoardingApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.ONBOARDING, payload);
};


export const getCompanyCountsStatsApiRequest = () => {
  return getRequest(ENDPOINTS.COMPANY_STATS);
};

// Billing

export const getStripePlansApiRequest = () => {
  return getRequest(ENDPOINTS.STRIPE_PLAN);
};

export const getStripeCheckoutApiRequest = (payload: any) => {
  return getRequest(ENDPOINTS.STRIPE_CHECKOUT + "/"+ payload?.plan_id);
};

export const upgradeSubscriptionApiRequest = ( Id: string,payload: any) => {
  return postRequest(`${ENDPOINTS.STRIPE_SUBSCRIPTION}${Id}/upgrade`,payload);
};

export const cancelSubscriptionApiRequest = (Id: string) => {
  return postRequest(`${ENDPOINTS.STRIPE_SUBSCRIPTION}${Id}/cancel`);
};

export const downgradeSubscriptionApiRequest = (Id: string,payload: any) => {
  return postRequest(`${ENDPOINTS.STRIPE_SUBSCRIPTION}${Id}/downgrade?new_plan_id=${payload?.new_plan_id}`);
};

export const pauseSubscriptionApiRequest = (Id: string) => {
  return postRequest(`${ENDPOINTS.STRIPE_SUBSCRIPTION}${Id}/pause`);
};

export const resumeSubscriptionApiRequest = (Id: string) => {
  return postRequest(`${ENDPOINTS.STRIPE_SUBSCRIPTION}${Id}/resume` );
};

export const currentSubscriptionApiRequest = () => {
  return getRequest(`${ENDPOINTS.ACTIVE_SUBSCRIPTION}`);
};

export const getInvoiceListApiRequest = () => {
  return getRequest(`${ENDPOINTS.INVOICE_LIST}`);
};

export const getInvoiceByIdApiRequest = (Id: string) => {
  return getRequest(`${ENDPOINTS.INVOICE_LIST}/${Id}`);
};

export const getUsageListApiRequest = () => {
  return getRequest(ENDPOINTS.USAGE_LIST);
};


// Campaign Management

export const getCampaignListApiRequest = () => {
  return getRequest(ENDPOINTS.CAMPAIGN_LIST);
};

export const createCampaignApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.CAMPAIGN_CREATE, payload);
}; 

export const getCampaignByIdApiRequest = (Id: string) => {
  return getRequest(`${ENDPOINTS.CAMPAIGN}/${Id}`);
};

export const updateCampaignApiRequest = (Id: string, payload: any) => {
  return putRequest(`${ENDPOINTS.CAMPAIGN}/${Id}`, payload);
};

export const deleteCampaignApiRequest = (Id: string) => {
  return deleteRequest(`${ENDPOINTS.CAMPAIGN}/${Id}`);
};



// Campaign Document Upload
export const uploadCampaignDocumentApiRequest = async (campaignId: string, formData: FormData) => {
  return postRequest(`${ENDPOINTS.CAMPAIGN_DOCUMENT_UPLOAD}/${campaignId}`, formData);
};




// Folder Management

export const getFolderListApiRequest = () => {
  return getRequest(ENDPOINTS.FOLDER_LIST);
};

export const createFolderApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.FOLDER_LIST, payload);
};

export const updateFolderVariableApiRequest = (Id: string, payload: any) => {
  return putRequest(`${ENDPOINTS.FOLDER_VARIABLE}${Id}`, payload);
};

export const cloneFolderApiRequest = (Id: string , payload: any) => {
  
  return putRequest(`${ENDPOINTS.FOLDER_LIST}/${Id}/clone`, payload);
};

export const deleteFolderApiRequest = (Id: string) => {
  return deleteRequest(`${ENDPOINTS.FOLDER_LIST}/${Id}`);
};



// Settings

export const getSmtpConfigApiRequest = () => {
  return getRequest(ENDPOINTS.SMTP_CONFIG);
};

export const updateSmtpConfigApiRequest = (payload: any) => {
  return putRequest(ENDPOINTS.SMTP_CONFIG, payload);
};


export const testSmtpConnectionApiRequest = (payload: any) => {
  return postRequest(ENDPOINTS.SMTP_CONFIG + "/test", payload);
};
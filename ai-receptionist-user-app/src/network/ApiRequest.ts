import { axiosClient } from './AxiosClient';

export const getRequest = (url: any) => {
  return axiosClient.get(url);
};

export const postRequest = (url: any, payload?: any) => {
  return axiosClient.post(url, payload);
};

export const putRequest = (url: any, payload?: any) => {
  return axiosClient.put(url, payload);
};

export const deleteRequest = (url: any) => {
  return axiosClient.delete(url);
};

export const patchRequest = (url: any, payload: any) => {
  return axiosClient.patch(url, payload);
};

export const getDownloadRequest = (url: any, payload: any) => {
  return axiosClient.get(url, {
    responseType: "blob",
  });
};

export const getSubscriptionType = (url: any) => {
  return axiosClient.get(url);
};

export const bulkUploadRequest = (url: any, payload: any) => {
  return axiosClient.post(url, payload, {
    timeout: 1200000, // 20 minutes timeout
  });
};

export const distributionRequest = (url: any, payload: any) => {
  return axiosClient.post(url, payload, {
    timeout: 1200000, // 20 minutes timeout
  });
};

export const customAssistantPrepareRequest = (url: any, payload: any) => {
  return axiosClient.post(url, payload, {
    timeout: 120000, // 20 minutes timeout
  });
};


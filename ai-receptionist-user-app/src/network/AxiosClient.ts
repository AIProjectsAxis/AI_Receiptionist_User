
import axios from "axios";
import {
  getToken,
  removeHasPhoneNumber,
  removeHasSubscription,
  removeIsOnboardingDone,
  removeToken,
} from "../_utils/cookies";
import { toast } from "react-toastify";



export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const hasAccessToken = getToken();
    if (hasAccessToken) {
      config.headers.Authorization = `Bearer ${hasAccessToken}`;
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    logError(error);
    return Promise.reject(error);
  },
  { synchronous: true }
);

axiosClient.interceptors.response.use(
  (response: any) => {
    return response?.data || response;
  },
  (error: any) => {
    if (process.env.NODE_ENV === "development") {
      logError(error);
    }

    const status = error?.response?.status;

    switch (status) {
      case 400:
        // toast.error("Invalid request");
        break;
      case 401:
        // toast.error("Unauthorized: Invalid credentials");
        break;
      case 403:
        // toast.error("Forbidden: You don't have permission");
        unauthorizeAccess();
        break;
      case 404:
        // toast.error("Resource not found");
        break;
      case 422:
        // toast.error("Validation failed");
        break;
      case 500:
        // toast.error("Server error");
        break;
      default:
        
        // toast.error("An unexpected error occurred");
        break;
    }

    return Promise.reject(error?.response?.data || error);
  }
);

function getUrl(config: any) {
  return config?.url || "";
}

function logError(error: any) {
  const status = error?.response?.status;
  const url = getUrl(error?.response?.config);
  const message = error?.response?.statusText || "Unknown error";
  console.error(`ERROR ${status} - ${url}: ${message}`);
}

function unauthorizeAccess() {
  removeToken();
  removeIsOnboardingDone();
  removeHasSubscription();
  removeHasPhoneNumber();

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

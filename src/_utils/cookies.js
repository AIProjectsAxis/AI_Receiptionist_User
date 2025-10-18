import Cookies from "js-cookie";
import { COOKIES } from "./constants";

//\\\\\\Token////////\\
export const setToken = (token) => {
  return Cookies.set(COOKIES.ACCESS_TOKEN, token, { expires: 60 });
};
export const setIsOnboardingDone = (isOnboardingDone) => {
  return Cookies.set(COOKIES.ONBOARDING_DONE, isOnboardingDone, { expires: 60 });
};

export const getToken = () => {
  return Cookies.get(COOKIES.ACCESS_TOKEN);
};
export const getIsOnboardingDone = () => {
  return Cookies.get(COOKIES.ONBOARDING_DONE);
};

export const removeToken = () => {
  return Cookies.remove(COOKIES.ACCESS_TOKEN);
};
export const removeIsOnboardingDone = () => {
  return Cookies.remove(COOKIES.ONBOARDING_DONE);
};
//\\\\\\UserID////////\\
export const setUserId = (id) => {
  return Cookies.set(COOKIES.USER_ID, id, { expires: 60 });
};
export const getUserId = () => {
  return Cookies.get(COOKIES.USER_ID);
};
export const removeUserId = () => {
  return Cookies.remove(COOKIES.USER_ID);
};

//\\\\\\User Email////////\\
export const setUserEmail = (id) => {
  return Cookies.set(COOKIES.USER_EMAIL, id);
};
export const getUserEmail = () => {
  return Cookies.get(COOKIES.USER_EMAIL);
};
export const removeUserEmail = () => {
  return Cookies.remove(COOKIES.USER_EMAIL);
};

//\\\\\\UserData////////\\
export const setUserData = (data) => {
  return Cookies.set(COOKIES.USER_DATA, data);
};

export const getUserData = () => {
  return Cookies.get(COOKIES.USER_DATA);
};

export const removeUserData = () => {
  return Cookies.remove(COOKIES.USER_DATA);
};


// Last Calendar used when creating new event
export const setLastUsedCalendar = (data) => {
  return Cookies.set(COOKIES.LAST_USED_CALENDAR, data, { expires: 60 });
};

export const getLastUsedCalendar = () => {
  return Cookies.get(COOKIES.LAST_USED_CALENDAR);
};

export const removeLastUsedCalendar = () => {
  return Cookies.remove(COOKIES.LAST_USED_CALENDAR);  
};

//HasSubscription
export const setHasSubscription = (data) => {
  return Cookies.set(COOKIES.HAS_SUBSCRIPTION, data, { expires: 60 });
};

export const getHasSubscription = () => {
  return Cookies.get(COOKIES.HAS_SUBSCRIPTION);
};

export const removeHasSubscription = () => {
  return Cookies.remove(COOKIES.HAS_SUBSCRIPTION);  
};

//HasPhoneNumber
export const setHasPhoneNumber = (data) => {
  return Cookies.set(COOKIES.HAS_PHONE_NUMBER, data, { expires: 60 });
};

export const getHasPhoneNumber = () => {
  return Cookies.get(COOKIES.HAS_PHONE_NUMBER);
};

export const removeHasPhoneNumber = () => {
  return Cookies.remove(COOKIES.HAS_PHONE_NUMBER);  
};

///////////
export const getCurrentLocale = () => {
  return Cookies.get("NEXT_LOCALE");
};
/////////// 
export const saveMailSenderData = (data)=>{
  return Cookies.set(COOKIES.SAVE_DATA , data)
}

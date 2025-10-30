import { configureStore } from "@reduxjs/toolkit";
import companySlice from "../slices/CompanySlice";

export const store = configureStore({
  reducer: {
    company: companySlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
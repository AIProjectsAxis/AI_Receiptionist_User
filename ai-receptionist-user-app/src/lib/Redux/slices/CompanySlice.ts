import { createSlice } from "@reduxjs/toolkit";
import { getCompanyDataThunkRequest, getProfileDetailsThunkRequest } from "../SliceActions/CompanyActions";

const initialState = {
  profileDetails: {},
  companyData: {},
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getProfileDetailsThunkRequest.pending, (state, action) => {
        state.profileDetails = {};
      });
    builder.addCase(getProfileDetailsThunkRequest.fulfilled, (state, action) => {
      state.profileDetails = action.payload;
    });
    builder.addCase(getProfileDetailsThunkRequest.rejected, (state, action) => {
      state.profileDetails = {};
    });
  
    builder.addCase(getCompanyDataThunkRequest.pending, (state, action) => {
      state.companyData = {};
    });
    builder.addCase(getCompanyDataThunkRequest.fulfilled, (state, action) => {
      state.companyData = action.payload;
    });
    builder.addCase(getCompanyDataThunkRequest.rejected, (state, action) => {
      state.companyData = {};
    });
  },
});

export const {  } = companySlice.actions;

export default companySlice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import { getCurrentFiscalYear } from "../../../helpers/utils";

const initialState = {
    researchProjectFundingDetails: {},
    selectedFiscalYear: { value: getCurrentFiscalYear(new Date()) }
};

const ResearchProjectFundingSlice = createSlice({
    name: "researchProjectFundingSlice",
    initialState,
    reducers: {
        setResearchProjectFundingDetails: (state, action) => {
            state.researchProjectFundingDetails = action.payload;
        },
        setSelectedFiscalYear: (state, action) => {
            state.selectedFiscalYear = action.payload;
        }
    }
});

export const { setSelectedFiscalYear, setResearchProjectFundingDetails } = ResearchProjectFundingSlice.actions;

export default ResearchProjectFundingSlice.reducer;

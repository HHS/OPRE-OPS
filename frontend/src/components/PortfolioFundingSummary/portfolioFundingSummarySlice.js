import { createSlice } from "@reduxjs/toolkit";

export const defaultPortfolioFunding = {
    total_funding: {
        amount: 0,
        label: "",
    },
    planned_funding: {
        amount: 0,
        label: "",
    },
    obligated_funding: {
        amount: 0,
        label: "",
    },
    in_execution_funding: {
        amount: 0,
        label: "",
    },
    available_funding: {
        amount: 0,
        label: "",
    },
};

export const defaultPortfolioFundingChart = [
    {
        id: "planned_funding",
        value: 0,
        label: "0",
        fill: "",
    },
    {
        id: "available_funding",
        value: 0,
        label: "0",
        fill: "",
    },
    {
        id: "obligated_funding",
        value: 0,
        label: "0",
        fill: "",
    },
    {
        id: "in_execution_funding",
        value: 0,
        label: "0",
        fill: "",
    },
];

const initialState = {
    portfolio: {},
    portfolioFunding: defaultPortfolioFunding,
    portfolioFundingChart: defaultPortfolioFundingChart,
};

const portfolioFundingSummarySlice = createSlice({
    name: "portfolioFunding",
    initialState,
    reducers: {
        setPortfolio: (state, action) => {
            state.portfolio = action.payload;
        },
        setPortfolioFunding: (state, action) => {
            state.portfolioFunding = action.payload;
            state.portfolioFundingChart = [
                {
                    id: "planned_funding",
                    value: action.payload.planned_funding.amount,
                    // label: action.payload.planned_funding.label,
                    fill: "#336A90",
                },
                {
                    id: "available_funding",
                    value: action.payload.available_funding.amount,
                    // label: action.payload.available_funding.label,
                    fill: "#E5A000",
                },
                {
                    id: "obligated_funding",
                    value: action.payload.obligated_funding.amount,
                    // label: action.payload.obligated_funding.label,
                    fill: "#B50909",
                },
                {
                    id: "in_execution_funding",
                    value: action.payload.in_execution_funding.amount,
                    // label: action.payload.in_execution_funding.label,
                    fill: "#A1D0BE",
                },
            ];
        },
    },
});

export const { setPortfolio, setPortfolioFunding } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;

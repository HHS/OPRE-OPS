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
        x: "planned_funding",
        y: 0,
        label: "0",
        fill: "",
    },
    {
        x: "available_funding",
        y: 0,
        label: "0",
        fill: "",
    },
    {
        x: "obligated_funding",
        y: 0,
        label: "0",
        fill: "",
    },
    {
        x: "in_execution_funding",
        y: 0,
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
                    x: "planned_funding",
                    y: action.payload.planned_funding.amount,
                    label: action.payload.planned_funding.label,
                    fill: "#336A90",
                },
                {
                    x: "available_funding",
                    y: action.payload.available_funding.amount,
                    label: action.payload.available_funding.label,
                    fill: "#E5A000",
                },
                {
                    x: "obligated_funding",
                    y: action.payload.obligated_funding.amount,
                    label: action.payload.obligated_funding.label,
                    fill: "#B50909",
                },
                {
                    x: "in_execution_funding",
                    y: action.payload.in_execution_funding.amount,
                    label: action.payload.in_execution_funding.label,
                    fill: "#A1D0BE",
                },
            ];
        },
    },
});

export const { setPortfolio, setPortfolioFunding } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;

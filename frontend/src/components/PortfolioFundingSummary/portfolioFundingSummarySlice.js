import { createSlice } from "@reduxjs/toolkit";

export const defaultPortfolioFunding = {
    total_funding: {
        amount: 0,
        percent: "",
    },
    planned_funding: {
        amount: 0,
        percent: "",
    },
    obligated_funding: {
        amount: 0,
        percent: "",
    },
    in_execution_funding: {
        amount: 0,
        percent: "",
    },
    available_funding: {
        amount: 0,
        percent: "",
    },
};

export const defaultPortfolioFundingChart = [
    {
        id: "planned_funding",
        value: 0,
        percent: "0",
        fill: "",
    },
    {
        id: "available_funding",
        value: 0,
        percent: "0",
        fill: "",
    },
    {
        id: "obligated_funding",
        value: 0,
        percent: "0",
        fill: "",
    },
    {
        id: "in_execution_funding",
        value: 0,
        percent: "0",
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
                    percent: `${parseInt(action.payload.planned_funding.percent)}%`,
                    color: "#336A90",
                },
                {
                    id: "available_funding",
                    value: action.payload.available_funding.amount,
                    percent: `${parseInt(action.payload.available_funding.percent)}%`,
                    color: "#E5A000",
                },
                {
                    id: "obligated_funding",
                    value: action.payload.obligated_funding.amount,
                    percent: `${parseInt(action.payload.obligated_funding.percent)}%`,
                    color: "#B50909",
                },
                {
                    id: "in_execution_funding",
                    value: action.payload.in_execution_funding.amount,
                    percent: `${parseInt(action.payload.in_execution_funding.percent)}%`,
                    color: "#A1D0BE",
                },
            ];
        },
    },
});

export const { setPortfolio, setPortfolioFunding } = portfolioFundingSummarySlice.actions;

export default portfolioFundingSummarySlice.reducer;

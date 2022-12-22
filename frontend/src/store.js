import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/list/canListSlice";
import canDetailSlice from "./store/canDetailSlice";
import portfolioListSlice from "./pages/portfolios/list/portfolioListSlice";
import portfolioBudgetSummarySlice from "./components/Portfolios/PortfolioBudgetSummary/portfolioBudgetSummarySlice";
// eslint-disable-next-line import/no-named-as-default
import authSlice from "./components/Auth/authSlice";
import portfolioSlice from "./store/portfolioSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
        canDetail: canDetailSlice,
        portfolioList: portfolioListSlice,
        portfolioBudgetSummary: portfolioBudgetSummarySlice,
        auth: authSlice,
        portfolio: portfolioSlice,
    },
});

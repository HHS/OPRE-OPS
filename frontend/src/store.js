import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/list/canListSlice";
import canDetailSlice from "./pages/cans/detail/canDetailSlice";
import canFiscalYearSlice from "./pages/cans/detail/budgetSummary/canFiscalYearSlice";
import portfolioListSlice from "./pages/portfolios/list/portfolioListSlice";
import portfolioDetailSlice from "./store/portfolioDetailSlice";
import portfolioBudgetSummarySlice from "./components/PortfolioBudgetSummary/portfolioBudgetSummarySlice";
// eslint-disable-next-line import/no-named-as-default
import authSlice from "./components/Auth/authSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
        canDetail: canDetailSlice,
        canFiscalYearDetail: canFiscalYearSlice,
        portfolioList: portfolioListSlice,
        portfolioDetail: portfolioDetailSlice,
        portfolioBudgetSummary: portfolioBudgetSummarySlice,
        auth: authSlice,
    },
});

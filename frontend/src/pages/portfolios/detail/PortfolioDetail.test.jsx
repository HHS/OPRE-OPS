import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildTrailState, LIST_CRUMBS } from "../../../helpers/breadcrumb.helpers";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import sessionUIReducer from "../../../sessionUISlice";
import PortfolioDetail from "./PortfolioDetail";

vi.mock("../../../api/opsAPI", () => ({
    useGetPortfolioByIdQuery: () => ({ data: { id: 3, name: "Portfolio A" }, isLoading: false }),
    useGetPortfolioFundingSummaryQuery: () => ({ data: undefined, isLoading: false }),
    useGetProjectsByPortfolioQuery: () => ({ data: [] }),
    useGetPortfolioUrlByIdQuery: () => ({ data: undefined })
}));
vi.mock("../../../App", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../../../components/Portfolios/PortfolioHero", () => ({ default: () => null }));
vi.mock("../../../components/Portfolios/PortfolioTabsSection", () => ({ default: () => null }));

const renderPortfolio = (initialEntry) => {
    const store = configureStore({ reducer: { sessionUI: sessionUIReducer } });
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route
                        path="/portfolios/:id/*"
                        element={<PortfolioDetail />}
                    />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    return { store };
};

const pickedYear = String(Number(getCurrentFiscalYear()) - 1);
const pickFiscalYear = () => fireEvent.change(screen.getByLabelText("Fiscal Year"), { target: { value: pickedYear } });
const listYear = (store, page) => store.getState().sessionUI.listFilters[page].selectedFiscalYear;

describe("PortfolioDetail fiscal year", () => {
    it("gives a picked year to the Portfolios list, which its breadcrumb falls back to", () => {
        const { store } = renderPortfolio("/portfolios/3/spending");
        pickFiscalYear();
        expect(listYear(store, "portfolios")).toBe(pickedYear);
        expect(listYear(store, "cans")).not.toBe(pickedYear);
    });

    it("gives a picked year to the Portfolios list in a carried trail", () => {
        const { store } = renderPortfolio({
            pathname: "/portfolios/3/spending",
            state: buildTrailState("/portfolios/3/spending", [{ ...LIST_CRUMBS.portfolios, to: "/portfolios?tab=my" }])
        });
        pickFiscalYear();
        expect(listYear(store, "portfolios")).toBe(pickedYear);
    });
});

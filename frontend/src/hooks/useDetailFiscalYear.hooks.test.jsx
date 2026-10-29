import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import sessionUIReducer, { setDetailFiscalYear } from "../sessionUISlice";
import { useDetailFiscalYear, useHandOverFiscalYear, useSyncFiscalYearParam } from "./useDetailFiscalYear.hooks";

const makeStore = () => configureStore({ reducer: { sessionUI: sessionUIReducer } });

const renderAt = (hook, url, store = makeStore()) => {
    const wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
        </Provider>
    );
    return { store, ...renderHook(hook, { wrapper }) };
};

describe("useDetailFiscalYear", () => {
    it("uses the page's fallback until a year is chosen", () => {
        const { result } = renderAt(() => useDetailFiscalYear(2026), "/cans/1");
        expect(result.current.fiscalYear).toBe(2026);
    });

    it("uses ?fy= when no year has been chosen", () => {
        const { result } = renderAt(() => useDetailFiscalYear(2026), "/cans/1?fy=2024");
        expect(result.current.fiscalYear).toBe(2024);
    });

    it("prefers the year chosen on another detail page over a stale ?fy=", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2023));
        const { result } = renderAt(() => useDetailFiscalYear(2026), "/portfolios/2/funding?fy=2025", store);
        expect(result.current.fiscalYear).toBe(2023);
    });

    it("shares a picked year, and ignores values that aren't a specific year", () => {
        const { result, store } = renderAt(() => useDetailFiscalYear(2026), "/cans/1");

        act(() => result.current.setFiscalYear("2024"));
        expect(result.current.fiscalYear).toBe(2024);
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2024);

        act(() => result.current.setFiscalYear("All"));
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2024);
    });
});

describe("useSyncFiscalYearParam", () => {
    const LocationProbe = () => {
        const { pathname, search, state } = useLocation();
        return <div data-testid="location">{`${pathname}${search} ${JSON.stringify(state)}`}</div>;
    };

    const renderPage = (initialEntry, store) => {
        const Page = () => {
            const { fiscalYear } = useDetailFiscalYear(2026);
            useSyncFiscalYearParam(fiscalYear);
            return <LocationProbe />;
        };
        return render(
            <Provider store={store}>
                <MemoryRouter initialEntries={[initialEntry]}>
                    <Routes>
                        <Route
                            path="*"
                            element={<Page />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );
    };

    it("rewrites a stale ?fy= to the shown year, keeping the location state", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2023));
        renderPage({ pathname: "/portfolios/2/funding", search: "?fy=2025", state: { trail: 1 } }, store);
        expect(screen.getByTestId("location")).toHaveTextContent('/portfolios/2/funding?fy=2023 {"trail":1}');
    });

    it("adds ?fy= once a year has been chosen", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2023));
        renderPage("/cans/1", store);
        expect(screen.getByTestId("location")).toHaveTextContent("/cans/1?fy=2023");
    });

    it("leaves a page showing its default without a ?fy= alone", () => {
        renderPage("/cans/1", makeStore());
        expect(screen.getByTestId("location")).toHaveTextContent(/^\/cans\/1 null$/);
    });
});

describe("useHandOverFiscalYear", () => {
    const renderListLink = (fiscalYear, store) => {
        const ListLink = () => {
            const handOverFiscalYear = useHandOverFiscalYear();
            return (
                <Link
                    to="/cans/1"
                    onClick={handOverFiscalYear(fiscalYear)}
                >
                    CAN 1
                </Link>
            );
        };
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ListLink />
                </MemoryRouter>
            </Provider>
        );
    };

    it("hands the list's year to the detail pages when the link is followed", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2023));
        renderListLink(2024, store);
        fireEvent.click(screen.getByRole("link", { name: "CAN 1" }));
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2024);
    });

    it("hands nothing over from a list showing all years", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2023));
        renderListLink("All", store);
        fireEvent.click(screen.getByRole("link", { name: "CAN 1" }));
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2023);
    });

    it("ignores a click that opens the link in a new tab", () => {
        const store = makeStore();
        renderListLink(2024, store);
        fireEvent.click(screen.getByRole("link", { name: "CAN 1" }), { metaKey: true });
        expect(store.getState().sessionUI.detailFiscalYear).toBeNull();
    });
});

describe("going back between detail pages", () => {
    const FiscalYearPage = ({ name, linkTo }) => {
        const { fiscalYear, setFiscalYear } = useDetailFiscalYear(2026);
        useSyncFiscalYearParam(fiscalYear);
        const navigate = useNavigate();
        return (
            <div>
                <p data-testid="page">{`${name} FY ${fiscalYear}`}</p>
                <button onClick={() => setFiscalYear(2023)}>Pick FY 2023</button>
                <button onClick={() => navigate(-1)}>Back</button>
                {linkTo && <Link to={linkTo}>Next</Link>}
                <Link to="/portfolios/2/funding?fy=2025">Breadcrumb</Link>
            </div>
        );
    };

    it("shows the year picked on a later page, whether returning by breadcrumb or browser Back", () => {
        const store = makeStore();
        store.dispatch(setDetailFiscalYear(2025));
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={["/portfolios/2/funding?fy=2025"]}>
                    <Routes>
                        <Route
                            path="/portfolios/:id/funding"
                            element={
                                <FiscalYearPage
                                    name="Portfolio"
                                    linkTo="/cans/504?fy=2025"
                                />
                            }
                        />
                        <Route
                            path="/cans/:id"
                            element={<FiscalYearPage name="CAN" />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByRole("link", { name: "Next" }));
        expect(screen.getByTestId("page")).toHaveTextContent("CAN FY 2025");
        fireEvent.click(screen.getByRole("button", { name: "Pick FY 2023" }));
        expect(screen.getByTestId("page")).toHaveTextContent("CAN FY 2023");

        // Browser Back returns to the portfolio's history entry, whose URL still says ?fy=2025.
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolio FY 2023");

        // So does the breadcrumb, which links with the FY the portfolio had when the user left it.
        fireEvent.click(screen.getByRole("link", { name: "Next" }));
        fireEvent.click(screen.getByRole("link", { name: "Breadcrumb" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolio FY 2023");
    });
});

describe("a year from ?fy= on a fresh load (new tab, refresh, bookmark)", () => {
    const Page = ({ name }) => {
        const { fiscalYear } = useDetailFiscalYear(2027);
        useSyncFiscalYearParam(fiscalYear);
        return (
            <div>
                <p data-testid="page">{`${name} FY ${fiscalYear}`}</p>
                <Link to="/cans/5/funding">CAN Funding tab</Link>
                <Link to="/portfolios/2/funding?fy=2025">Portfolio crumb</Link>
            </div>
        );
    };

    const renderFreshAt = (url) =>
        render(
            <Provider store={makeStore()}>
                <MemoryRouter initialEntries={[url]}>
                    <Routes>
                        <Route
                            path="/cans/:id/*"
                            element={<Page name="CAN" />}
                        />
                        <Route
                            path="/portfolios/:id/*"
                            element={<Page name="Portfolio" />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

    it("survives a switch to another tab, whose link carries no ?fy=", () => {
        renderFreshAt("/cans/5/spending?fy=2023");
        fireEvent.click(screen.getByRole("link", { name: "CAN Funding tab" }));
        expect(screen.getByTestId("page")).toHaveTextContent("CAN FY 2023");
    });

    it("applies to an earlier page reached by a breadcrumb carrying an older ?fy=", () => {
        renderFreshAt("/cans/5/spending?fy=2023");
        fireEvent.click(screen.getByRole("link", { name: "Portfolio crumb" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolio FY 2023");
    });
});

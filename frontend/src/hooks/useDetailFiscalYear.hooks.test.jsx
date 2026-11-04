import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DEFAULT_PORTFOLIO_BUDGET_RANGE } from "../constants";
import { buildTrailState, LIST_CRUMBS } from "../helpers/breadcrumb.helpers";
import sessionUIReducer, { setDetailFiscalYear, setListFilters } from "../sessionUISlice";
import { useListFilters } from "./useListFilters.hooks";
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

describe("useDetailFiscalYear: the lists in the breadcrumb", () => {
    const portfolioA = { label: "Portfolio A", to: "/portfolios/3/funding" };
    const at = (pathname, ancestors) => ({ pathname, state: ancestors && buildTrailState(pathname, ancestors) });
    const listYear = (store, page) => store.getState().sessionUI.listFilters[page].selectedFiscalYear;

    it("gives a picked year to the Portfolios list in the trail, resetting only its budget range", () => {
        const store = makeStore();
        const filters = { portfolios: [{ id: 3 }], budgetRange: [10, 20], availablePct: ["over90"] };
        store.dispatch(setListFilters({ page: "portfolios", filters }));
        const { result } = renderAt(
            () => useDetailFiscalYear(2026, { fallbackCrumb: LIST_CRUMBS.cans }),
            at("/cans/1", [{ ...LIST_CRUMBS.portfolios, to: "/portfolios?tab=mine" }, portfolioA]),
            store
        );

        act(() => result.current.setFiscalYear("2025"));

        expect(listYear(store, "portfolios")).toBe("2025");
        expect(store.getState().sessionUI.listFilters.portfolios.filters).toEqual({
            ...filters,
            budgetRange: DEFAULT_PORTFOLIO_BUDGET_RANGE
        });
        // The CANs list isn't in this trail, so it keeps its own year.
        expect(listYear(store, "cans")).not.toBe("2025");
    });

    it("gives a picked year to the fallback list when no trail was carried", () => {
        const { result, store } = renderAt(
            () => useDetailFiscalYear(2026, { fallbackCrumb: LIST_CRUMBS.cans }),
            at("/cans/1")
        );
        act(() => result.current.setFiscalYear(2024));
        expect(listYear(store, "cans")).toBe("2024");
    });

    it("leaves the Projects list on its own year", () => {
        const { result, store } = renderAt(
            () => useDetailFiscalYear(2026, { fallbackCrumb: LIST_CRUMBS.projects }),
            at("/projects/1/funding", [LIST_CRUMBS.projects])
        );
        act(() => result.current.setFiscalYear(2024));
        expect(listYear(store, "projects")).toBe("All");
    });

    it("leaves the lists alone for a year their dropdowns don't offer", () => {
        const { result, store } = renderAt(
            () => useDetailFiscalYear(2026, { fallbackCrumb: LIST_CRUMBS.portfolios }),
            at("/portfolios/3/funding")
        );
        const before = listYear(store, "portfolios");
        act(() => result.current.setFiscalYear(2010));
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2010);
        expect(listYear(store, "portfolios")).toBe(before);
    });

    it("doesn't change the lists for a year that only comes from ?fy=", () => {
        const store = makeStore();
        const before = listYear(store, "portfolios");
        renderAt(
            () => useDetailFiscalYear(2026, { fallbackCrumb: LIST_CRUMBS.portfolios }),
            "/portfolios/3/funding?fy=2024",
            store
        );
        expect(store.getState().sessionUI.detailFiscalYear).toBe(2024);
        expect(listYear(store, "portfolios")).toBe(before);
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

describe("going back to the Portfolios list (UX scenario from #3789)", () => {
    const PortfoliosList = () => {
        const { selectedFiscalYear, changeFiscalYear } = useListFilters("portfolios");
        const handOverFiscalYear = useHandOverFiscalYear();
        return (
            <div>
                <p data-testid="page">{`Portfolios FY ${selectedFiscalYear}`}</p>
                <button onClick={() => changeFiscalYear("2029")}>List FY 2029</button>
                <Link
                    to="/portfolios/3/funding"
                    state={buildTrailState("/portfolios/3/funding", [LIST_CRUMBS.portfolios])}
                    onClick={handOverFiscalYear(selectedFiscalYear)}
                >
                    Portfolio A
                </Link>
            </div>
        );
    };

    const DetailPage = ({ name, fallbackCrumb, child }) => {
        const { pathname, state } = useLocation();
        const { fiscalYear, setFiscalYear } = useDetailFiscalYear(2027, { fallbackCrumb });
        const ancestors = state?.breadcrumbTrail?.ancestors ?? [fallbackCrumb];
        return (
            <div>
                <p data-testid="page">{`${name} FY ${fiscalYear}`}</p>
                <button onClick={() => setFiscalYear("2025")}>Detail FY 2025</button>
                {child && (
                    <Link
                        to={child}
                        state={buildTrailState(child, [...ancestors, { label: name, to: pathname }])}
                    >
                        Child
                    </Link>
                )}
                {ancestors.map((crumb) => (
                    <Link
                        key={crumb.to}
                        to={crumb.to}
                    >{`Crumb ${crumb.label}`}</Link>
                ))}
            </div>
        );
    };

    it("shows the year picked on the CAN at every step back to the list", () => {
        render(
            <Provider store={makeStore()}>
                <MemoryRouter initialEntries={["/portfolios"]}>
                    <Routes>
                        <Route
                            path="/portfolios"
                            element={<PortfoliosList />}
                        />
                        <Route
                            path="/portfolios/:id/funding"
                            element={
                                <DetailPage
                                    name="Portfolio A"
                                    fallbackCrumb={LIST_CRUMBS.portfolios}
                                    child="/cans/504"
                                />
                            }
                        />
                        <Route
                            path="/cans/:id"
                            element={
                                <DetailPage
                                    name="CAN"
                                    fallbackCrumb={LIST_CRUMBS.cans}
                                />
                            }
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByRole("button", { name: "List FY 2029" }));
        fireEvent.click(screen.getByRole("link", { name: "Portfolio A" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolio A FY 2029");
        fireEvent.click(screen.getByRole("link", { name: "Child" }));
        expect(screen.getByTestId("page")).toHaveTextContent("CAN FY 2029");

        fireEvent.click(screen.getByRole("button", { name: "Detail FY 2025" }));
        fireEvent.click(screen.getByRole("link", { name: "Crumb Portfolio A" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolio A FY 2025");
        fireEvent.click(screen.getByRole("link", { name: "Crumb Portfolios" }));
        expect(screen.getByTestId("page")).toHaveTextContent("Portfolios FY 2025");
    });
});

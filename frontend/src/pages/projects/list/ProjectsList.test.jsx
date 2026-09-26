import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectsList from "./ProjectsList";
import { opsApi } from "../../../api/opsAPI";

const mockNavigate = vi.fn();
const mockUseGetProjectsQuery = vi.fn();
const mockUseGetProjectsFilterOptionsQuery = vi.fn();
const mockLazyTrigger = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve({ projects: [] }) });

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetProjectsQuery: (args) => mockUseGetProjectsQuery(args),
        useLazyGetProjectsQuery: () => [mockLazyTrigger],
        useGetProjectsFilterOptionsQuery: () => mockUseGetProjectsFilterOptionsQuery()
    };
});

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

// Mocked with real removeFilter wiring (not a static stub) so tests can exercise the
// actual tag-removal codepath that drives ProjectsList's FY revert logic, while still
// providing lightweight seed buttons to set up filter state without driving the real
// Compare Fiscal Years combobox UI.
vi.mock("./ProjectFilterTags/ProjectFilterTags", async () => {
    const { removeFilter } = await vi.importActual("./ProjectFilterTags/ProjectFilterTags.hooks");
    return {
        default: ({ filters, setFilters }) => (
            <div data-testid="filter-tags">
                Filter Tags
                <button
                    type="button"
                    data-testid="seed-fy-tag"
                    onClick={() => setFilters((prev) => ({ ...prev, fiscalYear: [{ id: 2025, title: 2025 }] }))}
                >
                    Seed FY tag
                </button>
                <button
                    type="button"
                    data-testid="seed-fy-tag-outside-window"
                    onClick={() => setFilters((prev) => ({ ...prev, fiscalYear: [{ id: 2010, title: 2010 }] }))}
                >
                    Seed FY tag outside default window
                </button>
                <button
                    type="button"
                    data-testid="seed-portfolio-tag"
                    onClick={() => setFilters((prev) => ({ ...prev, portfolio: [{ id: 1, name: "OPRE" }] }))}
                >
                    Seed portfolio tag
                </button>
                {(filters?.fiscalYear ?? []).map((fy) => (
                    <button
                        type="button"
                        key={fy.id}
                        data-testid={`remove-fy-tag-${fy.id}`}
                        onClick={() => removeFilter({ filter: "fiscalYear", tagText: `FY ${fy.title}` }, setFilters)}
                    >
                        Remove FY {fy.title}
                    </button>
                ))}
            </div>
        )
    };
});

// Mock that simulates applying the filter modal in two modes:
// - "apply-with-empty-fy": Apply with Compare FYs cleared (the Reset+Apply bug scenario)
// - "apply-without-touching-fy": Apply without changing Compare FYs (only other filters)
vi.mock("./ProjectFilterButton/ProjectFilterButton", () => ({
    default: ({ setFilters }) => (
        <div>
            <button
                type="button"
                data-testid="apply-with-empty-fy"
                onClick={() => {
                    setFilters((prev) => ({ ...prev, fiscalYear: [] }));
                }}
            >
                Apply with empty FY
            </button>
            <button
                type="button"
                data-testid="apply-without-touching-fy"
                onClick={() => {
                    setFilters((prev) => ({ ...prev, portfolio: [{ id: 9, name: "Other Portfolio" }] }));
                }}
            >
                Apply without touching FY
            </button>
        </div>
    )
}));

/** Two projects with the full set of new fields from the API */
const MOCK_PROJECT_1 = {
    id: 10,
    title: "Project Alpha",
    short_title: "ALPHA",
    description: "Alpha description",
    project_type: "RESEARCH",
    origination_date: "2021-01-01",
    start_date: "2021-06-13",
    end_date: "2025-09-30",
    fiscal_year_totals: { 2026: "500000.00", 2025: "300000.00" },
    project_total: "800000.00",
    agreement_name_list: [{ id: 1, name: "Agreement One" }]
};

const MOCK_PROJECT_2 = {
    id: 11,
    title: "Support Beta",
    short_title: "BETA",
    description: "Beta description",
    project_type: "ADMINISTRATIVE_AND_SUPPORT",
    origination_date: "2020-01-01",
    start_date: null,
    end_date: null,
    fiscal_year_totals: {},
    project_total: "0",
    agreement_name_list: []
};

describe("ProjectsList", () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProjectsFilterOptionsQuery.mockReturnValue({
            data: { fiscal_years: [2023, 2024, 2025], portfolios: [], project_types: [] },
            isLoading: false
        });
        mockStore = configureStore({
            reducer: {
                [opsApi.reducerPath]: opsApi.reducer,
                auth: () => ({
                    isLoggedIn: true,
                    activeUser: { id: 1, roles: [] }
                }),
                alert: () => ({
                    isActive: false,
                    type: "",
                    heading: "",
                    message: "",
                    redirectUrl: ""
                })
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
        });
    });

    const renderComponent = () =>
        render(
            <Provider store={mockStore}>
                <MemoryRouter>
                    <ProjectsList />
                </MemoryRouter>
            </Provider>
        );

    it("renders skeleton loading state when projects are loading", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isFetching: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByRole("table", { name: "Loading projects" })).toBeInTheDocument();
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("renders skeleton loading state when refetching (sort/FY change)", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isFetching: true,
            isError: false
        });

        renderComponent();

        expect(screen.getByRole("table", { name: "Loading projects" })).toBeInTheDocument();
    });

    it("renders the projects page with all column headers on success", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("All Projects")).toBeInTheDocument();
        expect(screen.getByRole("table")).toBeInTheDocument();
        // "Project" header button text is exactly "Project" (with arrow icon); use exact false to catch it
        // Default FY is "All" → FY Total column hidden, 5 data columns + expand = 6 total
        expect(screen.getAllByRole("columnheader").length).toBe(6);
        expect(screen.getByRole("columnheader", { name: /^Project$/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Type/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Start/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /End/ })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: /Lifetime Total/ })).toBeInTheDocument();
    });

    it("renders project link with correct href", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        const link = screen.getByRole("link", { name: "Project Alpha" });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/projects/10");
    });

    it("renders project type using display label", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("Research")).toBeInTheDocument();
    });

    it("renders start and end dates when present", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("6/13/2021")).toBeInTheDocument();
        expect(screen.getByText("9/30/2025")).toBeInTheDocument();
    });

    it("renders TBD for null start and end dates", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_2], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        // start_date and end_date are both null, plus project_total of "0" → 3 TBD cells
        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(2);
    });

    it("renders fiscal year total as currency for the selected FY", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2026");

        // MOCK_PROJECT_1.fiscal_year_totals[2026] is "500000.00"
        expect(screen.getByText("$500,000.00")).toBeInTheDocument();
    });

    it("renders project total as currency", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("$800,000.00")).toBeInTheDocument();
    });

    it("renders TBD for project total of zero", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_2], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getAllByText("TBD").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the fiscal year select dropdown", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByLabelText("Fiscal Year")).toBeInTheDocument();
    });

    it("changes fiscal year selection and passes it to the query", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2025");

        // Verify the query was called with the new FY value, resolved into filters.fiscalYear
        expect(mockUseGetProjectsQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                filters: expect.objectContaining({ fiscalYear: [{ id: 2025, title: 2025 }] })
            })
        );
    });

    it("hides FY Total column when All is selected and shows it for a specific FY", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        // Default is All — FY Total column should not be present
        expect(screen.queryByRole("columnheader", { name: /fy total/i })).not.toBeInTheDocument();

        // Select a specific year — FY Total column should appear
        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2044");

        expect(screen.getByRole("columnheader", { name: /FY44 Total/i })).toBeInTheDocument();
    });

    it("resets sort to TITLE when fiscal year changes back to All while sorted by FY Total", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2025");
        await user.click(screen.getByRole("button", { name: /FY25 Total/i }));

        expect(mockUseGetProjectsQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({ sortConditions: "FY_TOTAL" })
        );

        await user.selectOptions(fySelect, "All");

        expect(mockUseGetProjectsQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({
                sortConditions: "TITLE",
                filters: expect.objectContaining({ fiscalYear: [] })
            })
        );
    });

    it("does not render pagination when total pages is 1", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    });

    it("renders pagination when there are multiple pages", () => {
        const manyProjects = Array.from({ length: 10 }, (_, i) => ({
            ...MOCK_PROJECT_1,
            id: i + 1,
            title: `Project ${i + 1}`
        }));

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: manyProjects, count: 30, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    });

    it("passes sort params to the query when a header is clicked", async () => {
        const user = userEvent.setup();

        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1, MOCK_PROJECT_2], count: 2, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        await user.click(screen.getByRole("button", { name: /Type/i }));

        expect(mockUseGetProjectsQuery).toHaveBeenCalledWith(
            expect.objectContaining({ sortConditions: "PROJECT_TYPE" })
        );
    });

    it("passes pagination params to the query", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(mockUseGetProjectsQuery).toHaveBeenCalledWith(
            expect.objectContaining({ page: 0, limit: expect.any(Number) })
        );
    });

    it("navigates to the error page when the query fails", async () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    it("renders the Export button when there are projects", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("does not render the Export button when there are zero projects", () => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [], count: 0, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });

        renderComponent();

        expect(screen.queryByText("Export")).not.toBeInTheDocument();
    });
});

// ─── Model B FY filter behavior (OPS-6257) ──────────────────────────────────

describe("ProjectsList - Model B FY behavior (OPS-6257)", () => {
    beforeEach(() => {
        mockUseGetProjectsQuery.mockReturnValue({
            data: { projects: [MOCK_PROJECT_1], count: 1, limit: 10, offset: 0 },
            isLoading: false,
            isError: false
        });
        // Self-contained default so this describe block doesn't depend on the sibling
        // "ProjectsList" describe's beforeEach having already run first in file order.
        mockUseGetProjectsFilterOptionsQuery.mockReturnValue({
            data: { fiscal_years: [2023, 2024, 2025], portfolios: [], project_types: [] },
            isLoading: false
        });
    });

    const renderComponent = () =>
        render(
            <Provider
                store={configureStore({
                    reducer: {
                        [opsApi.reducerPath]: opsApi.reducer,
                        auth: () => ({ isLoggedIn: true, activeUser: { id: 1, roles: [] } }),
                        alert: () => ({ isActive: false, type: "", heading: "", message: "", redirectUrl: "" })
                    },
                    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
                })}
            >
                <MemoryRouter>
                    <ProjectsList />
                </MemoryRouter>
            </Provider>
        );

    it("dropdown-only FY change passes correct year to query via resolveForAPI", async () => {
        const user = userEvent.setup();
        renderComponent();

        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2024");

        await waitFor(() => {
            expect(mockUseGetProjectsQuery).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    filters: expect.objectContaining({ fiscalYear: [{ id: 2024, title: 2024 }] })
                })
            );
        });
    });

    it("default query sends empty fiscalYear with All selected (resolveForAPI: All → [])", async () => {
        renderComponent();

        await waitFor(() => {
            expect(mockUseGetProjectsQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    filters: expect.objectContaining({ fiscalYear: [] })
                })
            );
        });
    });

    it("changing dropdown clears only filters.fiscalYear, not other filters", async () => {
        const user = userEvent.setup();
        renderComponent();

        // Seed a non-FY filter via the mocked ProjectFilterTags
        await user.click(screen.getByTestId("seed-portfolio-tag"));

        await waitFor(() => {
            expect(mockUseGetProjectsQuery).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    filters: expect.objectContaining({ portfolio: [{ id: 1, name: "OPRE" }] })
                })
            );
        });

        // Change the dropdown — should only clear filters.fiscalYear
        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2024");

        await waitFor(() => {
            expect(mockUseGetProjectsQuery).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    filters: expect.objectContaining({
                        fiscalYear: [{ id: 2024, title: 2024 }],
                        portfolio: [{ id: 1, name: "OPRE" }]
                    })
                })
            );
        });
    });

    it("Apply with empty Compare FYs reverts dropdown to All (Reset+Apply bug regression guard)", async () => {
        const user = userEvent.setup();
        renderComponent();

        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2024");
        await waitFor(() => expect(fySelect).toHaveValue("2024"));

        // Seed active panel FYs (non-zero → zero is the transition we need to test).
        await user.click(screen.getByTestId("seed-fy-tag"));
        await waitFor(() => expect(fySelect).toHaveValue("2025"));

        // Simulate Reset → Apply with empty Compare FYs (the reported bug scenario).
        // filters.fiscalYear transitions from [{id:2025}] → [].
        await user.click(screen.getByTestId("apply-with-empty-fy"));

        // Dropdown must revert to "All" — NOT stay on 2024 (the stale dropdown year).
        await waitFor(() => expect(fySelect).toHaveValue("All"));
    });

    it("removing the last FY tag reverts the dropdown to All, not a stale dropdown year", async () => {
        const user = userEvent.setup();
        renderComponent();

        // Set the dropdown shortcut to a specific year first.
        const fySelect = screen.getByLabelText("Fiscal Year");
        await user.selectOptions(fySelect, "2024");
        await waitFor(() => expect(fySelect).toHaveValue("2024"));

        // Apply a Compare FYs selection (filters.fiscalYear), which takes precedence over
        // the dropdown shortcut and should override the displayed value to 2025.
        await user.click(screen.getByTestId("seed-fy-tag"));
        await waitFor(() => expect(fySelect).toHaveValue("2025"));

        // Remove the FY 2025 tag via the real removeFilter/handleFYTagRemoval codepath.
        await user.click(screen.getByTestId("remove-fy-tag-2025"));

        // Compare FYs is now empty, so the dropdown falls back to selectedFiscalYear.
        // The revert-to-"All" effect must reset it — otherwise this would show the
        // stale "2024" the dropdown shortcut was left on before Compare FYs took over.
        await waitFor(() => expect(fySelect).toHaveValue("All"));
    });

    it("renders an <option> for a Compare FY outside the default rolling window", async () => {
        mockUseGetProjectsFilterOptionsQuery.mockReturnValue({
            data: { fiscal_years: [2010, 2023, 2024, 2025], portfolios: [], project_types: [] },
            isLoading: false
        });
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByTestId("seed-fy-tag-outside-window"));

        const fySelect = screen.getByLabelText("Fiscal Year");
        await waitFor(() => expect(fySelect).toHaveValue("2010"));
        // The dropdown's value must match a rendered <option> — otherwise the <select>
        // silently shows blank instead of the selected Compare FY.
        expect(screen.getByRole("option", { name: "2010" })).toBeInTheDocument();
    });
});

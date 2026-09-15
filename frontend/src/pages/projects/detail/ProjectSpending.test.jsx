import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProjectSpending from "./ProjectSpending";
import { opsApi } from "../../../api/opsAPI";

const mockNavigate = vi.fn();
const mockUseGetProjectByIdQuery = vi.fn();
const mockUseGetProjectSpendingByIdQuery = vi.fn();
const mockUseGetAgreementsByResearchProjectFilterQuery = vi.fn();

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
        useGetProjectByIdQuery: () => mockUseGetProjectByIdQuery(),
        useGetProjectSpendingByIdQuery: () => mockUseGetProjectSpendingByIdQuery(),
        useGetAgreementsByResearchProjectFilterQuery: () => mockUseGetAgreementsByResearchProjectFilterQuery()
    };
});

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

// Expose the card's props rather than its rendering — this test is about the wiring.
vi.mock("../../../components/Projects/ProjectSpendingTotalsCard", () => ({
    default: ({ fyAgreementCount, fyTotal }) => (
        <div
            data-testid="totals-card"
            data-fy-agreement-count={fyAgreementCount}
            data-fy-total={fyTotal}
        />
    )
}));

vi.mock("../../../components/UI/Cards/DonutGraphWithLegendCard", () => ({
    default: () => <div data-testid="donut-card" />
}));

vi.mock("../../../components/Projects/ProjectSpendingAgreementsTable", () => ({
    default: ({ agreements }) => (
        <div data-testid="agreements-table">
            {agreements.map((agreement) => (
                <div
                    key={agreement.id}
                    data-testid={`agreement-${agreement.id}`}
                />
            ))}
        </div>
    )
}));

vi.mock("../../../components/Projects/ProjectSpendingAgreementsTable/ProjectSpendingAgreementsTableLoading", () => ({
    default: () => <div data-testid="agreements-table-loading" />
}));

const mockProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    project_type: "RESEARCH"
};

// FY 2043: agreements 1 and 2 have non-draft spending; agreement 3 only has drafts.
// FY 2044: agreement 3 only, and only drafts — no spending at all.
const mockSpendingData = {
    total: "1000.00",
    total_by_fiscal_year: { 2043: "1000.00" },
    spending_type_by_fiscal_year: {
        2043: { contract: "1000.00", grant: "0.00", partner: "0.00", direct_obligation: "0.00" }
    },
    agreements_by_fy: { 2043: [1, 2, 3], 2044: [3] },
    agreements_with_spending_by_fy: { 2043: [1, 2] }
};

const mockAgreements = [
    { id: 1, display_name: "Contract A" },
    { id: 2, display_name: "Contract B" },
    { id: 3, display_name: "Draft Only Contract" }
];

describe("ProjectSpending", () => {
    let mockStore;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProjectByIdQuery.mockReturnValue({ data: mockProject, isLoading: false, error: undefined });
        mockUseGetProjectSpendingByIdQuery.mockReturnValue({
            data: mockSpendingData,
            isLoading: false,
            error: undefined
        });
        mockUseGetAgreementsByResearchProjectFilterQuery.mockReturnValue({
            data: mockAgreements,
            isLoading: false,
            error: undefined
        });
        mockStore = configureStore({
            reducer: {
                [opsApi.reducerPath]: opsApi.reducer,
                auth: () => ({ isLoggedIn: true, activeUser: { id: 1, roles: [] } }),
                alert: () => ({ isActive: false, type: "", heading: "", message: "", redirectUrl: "" })
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware)
        });
    });

    const renderComponent = (id = "1000") =>
        render(
            <Provider store={mockStore}>
                <MemoryRouter initialEntries={[`/projects/${id}/spending`]}>
                    <Routes>
                        <Route
                            path="/projects/:id/spending"
                            element={<ProjectSpending />}
                        />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

    it("offers a fiscal year whose agreements only have draft budget lines", () => {
        renderComponent();

        expect(screen.getByRole("option", { name: "2044" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "2043" })).toBeInTheDocument();
    });

    it("lists the draft-only agreement for a fiscal year that has no spending", () => {
        renderComponent();

        // 2044 is the highest available FY, so it is selected by default
        expect(screen.getByRole("combobox")).toHaveValue("2044");
        expect(screen.getByTestId("agreement-3")).toBeInTheDocument();
        expect(screen.queryByTestId("agreement-1")).not.toBeInTheDocument();
    });

    it("lists draft-only and spending agreements together for a fiscal year that has both", () => {
        renderComponent();

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "2043" } });

        expect(screen.getByTestId("agreement-1")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-2")).toBeInTheDocument();
        expect(screen.getByTestId("agreement-3")).toBeInTheDocument();
    });

    it("counts only agreements with non-draft spending on the summary card", () => {
        renderComponent();

        // FY 2044 has one listed agreement but no spending at all
        expect(screen.getByTestId("totals-card")).toHaveAttribute("data-fy-agreement-count", "0");
        expect(screen.getByTestId("totals-card")).toHaveAttribute("data-fy-total", "0");

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "2043" } });

        // FY 2043 lists three agreements but only two have spending
        expect(screen.getByTestId("totals-card")).toHaveAttribute("data-fy-agreement-count", "2");
        expect(screen.getByTestId("totals-card")).toHaveAttribute("data-fy-total", "1000");
    });
});

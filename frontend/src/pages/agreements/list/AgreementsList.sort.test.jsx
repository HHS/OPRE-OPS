import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    useGetAgreementsQuery,
    useGetAgreementsFilterOptionsQuery,
    useLazyGetUserQuery,
    useLazyGetAgreementsQuery,
    useGetChangeRequestsListQuery
} from "../../../api/opsAPI";
import { tableSortCodes } from "../../../helpers/utils";
import store from "../../../store";
import AgreementsList from "./AgreementsList";

// Deliberately do NOT mock Table.hooks here (contrast with AgreementsList.test.jsx),
// so the real useSetSortConditions initialization is exercised. This is the
// regression guard for issue #6147 — the default (no-click) sort sent to the API.
vi.mock("../../../api/opsAPI");

vi.mock("../../../helpers/tableExport.helpers", () => ({
    exportTableToXlsx: vi.fn()
}));

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-mock">{children}</div>
}));

vi.mock("../../../components/Agreements/AgreementsTable", () => ({
    default: () => <div data-testid="agreements-table" />
}));

vi.mock("./AgreementsTabs", () => ({
    default: () => <div data-testid="agreement-tabs">All Agreements</div>
}));

vi.mock("./AgreementsFilterButton/AgreementsFilterButton", () => ({
    default: () => <button data-testid="filter-button">Filter</button>
}));

vi.mock("./AgreementsFilterTags/AgreementsFilterTags", () => ({
    default: () => <div data-testid="filter-tags">Filter Tags</div>
}));

vi.mock("../../../components/UI/PaginationNav/PaginationNav", () => ({
    default: () => <nav data-testid="pagination-nav" />
}));

vi.mock("../../../components/UI/FiscalYear", () => ({
    default: () => <div data-testid="fiscal-year-select" />
}));

vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
        useNavigate: vi.fn(() => vi.fn())
    };
});

const mockAgreementsResponse = {
    agreements: [],
    count: 0,
    limit: 10,
    offset: 0
};

describe("AgreementsList - default sort on initial load", () => {
    beforeEach(() => {
        useLazyGetUserQuery.mockReturnValue([vi.fn(), {}]);
        useLazyGetAgreementsQuery.mockReturnValue([vi.fn(), {}]);

        useGetChangeRequestsListQuery.mockReturnValue({
            data: { data: [], count: 0, limit: 10, offset: 0 },
            error: undefined,
            isLoading: false
        });

        useGetAgreementsFilterOptionsQuery.mockReturnValue({
            data: {
                fiscal_years: [2023, 2024, 2025],
                portfolios: [],
                project_titles: [],
                agreement_types: [],
                agreement_names: [],
                contract_numbers: [],
                research_types: []
            },
            error: undefined,
            isLoading: false
        });
    });

    it("requests agreements sorted alphabetically by name, ascending, before any header click", async () => {
        const mockQuery = vi.fn();
        useGetAgreementsQuery.mockImplementation((params) => {
            mockQuery(params);
            return {
                data: mockAgreementsResponse,
                error: undefined,
                isLoading: false,
                isFetching: false
            };
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AgreementsList />
                </BrowserRouter>
            </Provider>
        );

        await waitFor(() => {
            expect(mockQuery).toHaveBeenCalled();
        });

        const initialCall = mockQuery.mock.calls[0];
        expect(initialCall[0].sortConditions).toBe(tableSortCodes.agreementCodes.AGREEMENT);
        expect(initialCall[0].sortDescending).toBe(false);
    });
});

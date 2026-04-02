import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CanList from "./CanList";
import { useGetCanFilterOptionsQuery, useGetCansFundingQuery, useGetCansQuery } from "../../../api/opsAPI";

vi.mock("../../../api/opsAPI");

vi.mock("../../../App", () => ({
    default: ({ children }) => <div data-testid="app-wrapper">{children}</div>
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn()
    };
});

vi.mock("../../../components/CANs/CANTable", () => ({
    default: () => <div data-testid="can-table">CAN table</div>
}));

vi.mock("../../../components/CANs/CANSummaryCards", () => ({
    default: () => <div data-testid="can-summary-cards">Summary cards</div>
}));

vi.mock("../../../components/CANs/CanTabs", () => ({
    default: () => <div data-testid="can-tabs">CAN tabs</div>
}));

vi.mock("./CANFilterButton", () => ({
    default: () => <button data-testid="can-filter-button">Filter</button>
}));

vi.mock("./CANFilterTags", () => ({
    default: () => <div data-testid="can-filter-tags">Tags</div>
}));

vi.mock("./CANFiscalYearSelect", () => ({
    default: () => <div data-testid="can-fiscal-year-select">FY</div>
}));

vi.mock("../../../components/UI/Table/Table.hooks", () => ({
    useSetSortConditions: () => ({
        sortDescending: false,
        sortCondition: null,
        setSortConditions: vi.fn()
    })
}));

describe("CanList", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        useGetCansQuery.mockReturnValue({
            data: {
                cans: [{ id: 1, display_name: "CAN 1", portfolio: { abbreviation: "HS" } }],
                count: 1
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        useGetCanFilterOptionsQuery.mockReturnValue({
            data: {
                portfolios: [],
                can_numbers: [],
                fy_budget_range: { min: 0, max: 100 }
            },
            isLoading: false,
            isFetching: false
        });

        useGetCansFundingQuery.mockReturnValue({
            data: {
                funding: {
                    total_funding: 100,
                    new_funding: 10,
                    carry_forward_funding: 5,
                    planned_funding: 20,
                    obligated_funding: 30,
                    in_execution_funding: 40
                }
            },
            isLoading: false,
            isFetching: false
        });
    });

    it("renders a loading skeleton while CAN data is loading", () => {
        useGetCansQuery.mockReturnValue({
            data: undefined,
            isError: false,
            isLoading: true,
            isFetching: false
        });

        render(<CanList />);

        expect(screen.getByRole("table", { name: "Loading CANs" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "CAN" })).toBeInTheDocument();
    });

    it("renders the CAN table once data has loaded", () => {
        render(<CanList />);

        expect(screen.getByTestId("can-table")).toBeInTheDocument();
        expect(screen.getByTestId("can-summary-cards")).toBeInTheDocument();
    });
});

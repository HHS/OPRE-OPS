import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { describe, expect, it, vi } from "vitest";
import store from "../../../store";
import AllBLIRow from "./AllBLIRow";

vi.mock("../../../hooks/useServicesComponents.hooks", () => ({
    useGetServicesComponentDisplayName: () => "Test Service"
}));

vi.mock("../../../hooks/useChangeRequests.hooks", () => ({
    useChangeRequestsForTooltip: () => null
}));

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementByIdQuery: () => ({
        data: null,
        isLoading: false,
        isError: false
    }),
    useLazyGetCansQuery: () => [
        vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({ cans: [], count: 0 }) }),
        { isLoading: false, isError: false }
    ],
    useGetPortfolioByIdQuery: () => ({
        data: { id: 789, name: "Test Portfolio", abbreviation: "TP" },
        isLoading: false,
        isError: false
    })
}));

vi.mock("../../../helpers/changeRequests.helpers", () => ({
    hasProcurementShopChange: () => false
}));

const mockBudgetLine = {
    id: 123,
    agreement: {
        name: "Test Agreement",
        agreement_type: "IAA",
        awarding_entity_id: 1,
        project: {
            id: 1,
            title: "Test Project"
        },
        procurement_shop: {
            id: 1,
            abbr: "TEST",
            current_fee: { fee: 0.1 }
        }
    },
    line_description: "Test Description",
    agreement_id: 456,
    portfolio_id: 789,
    services_component_id: 1,
    date_needed: "2043-06-13",
    fiscal_year: 2043,
    can: {
        id: 1,
        display_name: "Test CAN",
        number: "123456",
        portfolio: {
            id: 789,
            name: "Test Portfolio",
            abbreviation: "TP",
            division_id: 1,
            division: {
                id: 1,
                name: "Test Division",
                abbreviation: "TD",
                division_director_id: 1,
                deputy_division_director_id: 2
            }
        },
        portfolio_id: 789
    },
    amount: 1000,
    fees: 1,
    total: 1001,
    procurement_shop_fee: null,
    proc_shop_fee_percentage: 0.1,
    status: "DRAFT",
    created_by: "user123",
    created_by_user: { id: "user123", name: "John Doe" },
    created_on: new Date("2024-05-27T19:20:46.105099Z"),
    comments: "Test comments",
    in_review: false,
    team_members: [],
    updated_by: "user123",
    updated_by_user: { id: "user123", name: "John Doe" },
    updated_on: new Date("2024-01-01"),
    _meta: {
        isEditable: true,
        limit: 0,
        number_of_pages: 0,
        offset: 0,
        queryParameters: "",
        total_amount: 0,
        total_count: 0,
        total_draft_amount: 0,
        total_in_execution_amount: 0,
        total_obligated_amount: 0,
        total_planned_amount: 0
    }
};

describe("AllBLIRow", () => {
    it("renders basic budget line information", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AllBLIRow budgetLine={mockBudgetLine} />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText("123")).toBeInTheDocument();
        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        expect(screen.getByText("Partner - IAA")).toBeInTheDocument();
        expect(screen.getByText("Test Service")).toBeInTheDocument();
        expect(screen.getByText("Test CAN")).toBeInTheDocument();
        expect(screen.getByText("TP")).toBeInTheDocument();
        expect(screen.getByText("$1,001.00")).toBeInTheDocument();
    });

    it("expands to show additional information when clicked", async () => {
        const user = userEvent.setup();
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <AllBLIRow budgetLine={mockBudgetLine} />
                </BrowserRouter>
            </Provider>
        );

        // Find and click the expand button
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);

        // Verify expanded content is visible
        const expandedRow = screen.getByTestId("expanded-data");
        expect(expandedRow).toBeInTheDocument();

        // Check for specific expanded row content
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText(/TEST - Current Fee Rate :\s*0.1%/)).toBeInTheDocument();
        expect(screen.getByText("SubTotal")).toBeInTheDocument();
        expect(screen.getByText("$1,000.00")).toBeInTheDocument();
        expect(screen.getByText("Fees")).toBeInTheDocument();
        expect(screen.getByText("$1.00")).toBeInTheDocument();
        expect(screen.getByText("Project")).toBeInTheDocument();
        expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
});

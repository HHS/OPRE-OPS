import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AllBLIRow from "./AllBLIRow";

vi.mock("../../../hooks/user.hooks", () => ({
    default: () => "John Doe"
}));

vi.mock("../../../hooks/useServicesComponents.hooks", () => ({
    useGetServicesComponentDisplayName: () => "Test Service"
}));

vi.mock("../../../hooks/useChangeRequests.hooks", () => ({
    useChangeRequestsForTooltip: () => null
}));

vi.mock("../../../api/opsAPI", () => ({
    useLazyGetAgreementByIdQuery: () => [
        vi.fn().mockResolvedValue({
            data: {
                procurement_shop: {
                    abbr: "TEST"
                }
            }
        })
    ]
}));

const mockBudgetLine = {
    id: 123,
    agreement: {
        name: "Test Agreement",
        agreement_type: "IAA"
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
    proc_shop_fee_percentage: 0.1,
    status: "DRAFT",
    created_by: "user123",
    created_by_user: { id: "user123", name: "John Doe" },
    created_on: "2024-05-27T19:20:46.105099Z",
    comments: "Test comments",
    in_review: false,
    team_members: [],
    updated_by: "user123",
    updated_by_user: { id: "user123", name: "John Doe" },
    updated_on: "2024-01-01"
};

describe("AllBLIRow", () => {
    it("renders basic budget line information", () => {
        render(
            <BrowserRouter>
                <AllBLIRow budgetLine={mockBudgetLine} />
            </BrowserRouter>
        );

        expect(screen.getByText("123")).toBeInTheDocument();
        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        expect(screen.getByText("Test Service")).toBeInTheDocument();
        expect(screen.getByText("Test CAN")).toBeInTheDocument();
        expect(screen.getByText("$1,100.00")).toBeInTheDocument();
    });

    it("expands to show additional information when clicked", async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <AllBLIRow budgetLine={mockBudgetLine} />
            </BrowserRouter>
        );

        // Find and click the expand button
        const expandButton = screen.getByTestId("expand-row");
        await user.click(expandButton);

        // Verify expanded content is visible
        const expandedRow = screen.getByTestId("expanded-data");
        expect(expandedRow).toBeInTheDocument();

        // Check for specific expanded row content
        expect(screen.getByText("Created By")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("May 27, 2024")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("TEST-Fee Rate: 10%")).toBeInTheDocument();
        expect(screen.getByText("Fees")).toBeInTheDocument();
        expect(screen.getByText("$100.00")).toBeInTheDocument();
        expect(screen.getByText("SubTotal")).toBeInTheDocument();
        expect(screen.getByText("$1,100.00")).toBeInTheDocument();
    });
});

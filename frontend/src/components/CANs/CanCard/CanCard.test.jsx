import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CanCard from "./CanCard";
import { getPortfolioCansFundingDetails } from "../../../api/getCanFundingSummary";

// Mock the external dependencies
vi.mock("../../../api/getCanFundingSummary");

// Mock the ResponsiveDonutWithInnerPercent component
vi.mock("../../UI/DataViz/ResponsiveDonutWithInnerPercent", () => ({
    __esModule: true,
    default: () => <div data-testid="mock-donut-chart" />
}));

describe("CanCard", () => {
    beforeEach(() => {
        vi.mocked(getPortfolioCansFundingDetails).mockResolvedValue(mockCanFundingData);
    });

    it("renders CanCard with correct information", async () => {
        render(
            <CanCard
                can={mockCan}
                fiscalYear={mockFiscalYear}
            />
        );

        // Check if basic CAN information is rendered
        expect(screen.getByText("G994426")).toBeInTheDocument();
        expect(screen.getByText("HS")).toBeInTheDocument();

        // Wait for the async data to be loaded
        await waitFor(() => {
            expect(screen.getByText("FY 2023 CAN Total Funding")).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText("FY 2023 CAN Budget Status")).toBeInTheDocument();
        });

        // Check if the funding data is rendered correctly
        expect(screen.getByText("$ 6,000,000.00")).toBeInTheDocument(); // Funding YTD
        expect(screen.getByText("$ 4,000,000.00")).toBeInTheDocument(); // Funding Expected
        expect(screen.getByText("$ 7,000,000.00")).toBeInTheDocument(); // Available
        expect(screen.getByText("$ 1,000,000.00")).toBeInTheDocument(); // Planned
        expect(screen.getByText("$ 2,000,000.00")).toBeInTheDocument(); // Executing
        expect(screen.getByText("$ 0")).toBeInTheDocument(); // Obligated

        // Check if the donut chart is rendered
        expect(screen.getByTestId("mock-donut-chart")).toBeInTheDocument();
    });

    // Add more test cases as needed
});

const mockCan = {
    appropriation_date: "2023-10-01T00:00:00.000000Z",
    active_period: 1,
    arrangement_type: "OPRE_APPROPRIATION",
    authorizer: 26,
    authorizer_id: 26,
    budget_line_items: [15012, 15022, 15023, 15001, 15000],
    can_type: null,
    created_by: null,
    created_by_user: null,
    created_on: "2024-08-22T13:24:43.428178Z",
    description: "Head Start Research",
    display_name: "G994426",
    division_id: 4,
    expiration_date: "2024-09-01T00:00:00.000000Z",
    funding_sources: [26],
    id: 504,
    managing_portfolio: 2,
    portfolio_id: 2,
    nick_name: "HS",
    number: "G994426",
    projects: [],
    shared_portfolios: [],
    updated_by: null,
    updated_by_user: null,
    updated_on: "2024-08-22T13:24:43.428178Z",
    versions: [
        {
            id: 504,
            transaction_id: 216
        }
    ]
};

const mockFiscalYear = 2023;

const mockCanFundingData = {
    available_funding: "7000000.00",
    cans: [
        {
            can: {
                appropriation_date: "2023-10-01T00:00:00.000000Z",
                active_period: 1,
                arrangement_type: "OPRE_APPROPRIATION",
                authorizer: 26,
                authorizer_id: 26,
                budget_line_items: [15012, 15022, 15023, 15001, 15000],
                can_type: null,
                created_by: null,
                created_by_user: null,
                created_on: "2024-08-22T13:24:43.428178Z",
                description: "Head Start Research",
                display_name: "G994426",
                division_id: 4,
                expiration_date: "2024-09-01T00:00:00.000000Z",
                funding_sources: [26],
                id: 504,
                managing_portfolio: 2,
                portfolio_id: 2,
                nick_name: "HS",
                number: "G994426",
                projects: [],
                shared_portfolios: [],
                updated_by: null,
                updated_by_user: null,
                updated_on: "2024-08-22T13:24:43.428178Z",
                versions: [
                    {
                        id: 504,
                        transaction_id: 216
                    }
                ]
            },
            carry_forward_label: "Carry-Forward",
            expiration_date: "09/01/2024"
        }
    ],
    carry_forward_funding: 0,
    expected_funding: "4000000.00",
    in_draft_funding: 0,
    in_execution_funding: "2000000.00",
    new_funding: 0,
    obligated_funding: 0,
    planned_funding: "1000000.00",
    received_funding: "6000000.00",
    total_funding: "10000000.00"
};

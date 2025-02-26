import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import CanCard from "./CanCard";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";

// Mock the external dependencies
vi.mock("../../../api/opsAPI", () => ({
    useGetCanFundingSummaryQuery: vi.fn()
}));

// Mock the ResponsiveDonutWithInnerPercent component
vi.mock("../../UI/DataViz/LineGraph/ReverseLineGraph", () => ({
    __esModule: true,
    default: () => <div data-testid="mock-reverse-line-graph" />
}));
vi.mock("../../UI/DataViz/LineGraph", () => ({
    __esModule: true,
    default: () => <div data-testid="mock-line-graph" />
}));

describe("CanCard", () => {
    beforeEach(() => {
        vi.mocked(useGetCanFundingSummaryQuery).mockReturnValue({
            data: mockCanFundingData,
            isLoading: false,
            refetch: vi.fn()
        });
    });

    it("renders CanCard with correct information", async () => {
        render(
            <BrowserRouter>
                <CanCard
                    canId={mockCan.id}
                    fiscalYear={mockFiscalYear}
                />
            </BrowserRouter>
        );

        // Check basic CAN information
        expect(screen.getByText("G994426")).toBeInTheDocument();
        expect(screen.getByText("HS")).toBeInTheDocument();
        expect(screen.getByText(/1 year/)).toBeInTheDocument();

        // Wait for the async data to be rendered
        await waitFor(() => {
            expect(screen.getByText(`FY ${mockFiscalYear} CAN Budget`)).toBeInTheDocument();
        });
        // Check the funding tag
        expect(screen.getByText(`FY ${mockFiscalYear} New Funding`)).toBeInTheDocument();

        // Check currency formatting
        expect(screen.getByText("$10,000,000.00")).toBeInTheDocument(); // Total funding
        expect(screen.getByText("$6,000,000.00")).toBeInTheDocument(); // Received funding
        expect(screen.getByText("$4,000,000.00")).toBeInTheDocument(); // Expected funding
        expect(screen.getByText("$1,000,000.00")).toBeInTheDocument(); // Spending = planned + executing + obligated = 1M + 2M + 0
        expect(screen.getByText("$7,000,000.00")).toBeInTheDocument(); // Available funding

        // Check if chart sections are rendered
        expect(screen.getByTestId("mock-reverse-line-graph")).toBeInTheDocument();
        expect(screen.getByTestId("mock-line-graph")).toBeInTheDocument();
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
            can: mockCan,
            carry_forward_label: "Carry-Forward",
            expiration_date: "09/01/2024"
        }
    ],
    carry_forward_funding: "7000000.00",
    expected_funding: "4000000.00",
    in_draft_funding: 0,
    in_execution_funding: "2000000.00",
    new_funding: 0,
    obligated_funding: 0,
    planned_funding: "1000000.00",
    received_funding: "6000000.00",
    total_funding: "10000000.00"
};

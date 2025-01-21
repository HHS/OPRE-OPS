import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CANFundingReceivedTable from "./CANFundingReceivedTable";
import CANFundingReceivedTableRow from "./CANFundingReceivedTableRow";

const mockFundingReceived = [
    {
        id: 1,
        fiscal_year: 2043,
        funding: 100000,
        created_by_user: { full_name: "John Doe" },
        created_on: "2023-10-01T00:00:00Z",
        notes: "Initial funding"
    },
    {
        id: 2,
        fiscal_year: 2043,
        funding: 200000,
        created_by_user: { full_name: "Jane Smith" },
        created_on: "2023-11-01T00:00:00Z",
        notes: "Additional funding"
    }
];

const mockTotalFunding = "500000";
const mockPopulateFundingReceivedForm = vi.fn();
const mockDeleteFundingReceived = vi.fn();

describe("CANFundingReceivedTable", () => {
    it("renders the table with funding received data", () => {
        render(
            <CANFundingReceivedTable
                fundingReceived={mockFundingReceived}
                totalFunding={mockTotalFunding}
                isEditMode={false}
                populateFundingReceivedForm={mockPopulateFundingReceivedForm}
                deleteFundingReceived={mockDeleteFundingReceived}
            />
        );

        expect(screen.getByText("Funding ID")).toBeInTheDocument();
        expect(screen.getByText("FY")).toBeInTheDocument();
        expect(screen.getByText("Funding Received")).toBeInTheDocument();
        expect(screen.getByText("% of Total FY Budget")).toBeInTheDocument();

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getAllByText("2043")).toHaveLength(2);
        expect(screen.getByText("$100,000.00")).toBeInTheDocument();
        expect(screen.getByText("20%")).toBeInTheDocument();

        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("$200,000.00")).toBeInTheDocument();
        expect(screen.getByText("40%")).toBeInTheDocument();
    });
});

describe("CANFundingReceivedTableRow", () => {
    it("renders a table row with funding received data", () => {
        render(
            <table>
                <tbody>
                    <CANFundingReceivedTableRow
                        fundingReceived={mockFundingReceived[0]}
                        totalFunding={mockTotalFunding}
                        isEditMode={false}
                        populateFundingReceivedForm={mockPopulateFundingReceivedForm}
                        deleteFundingReceived={mockDeleteFundingReceived}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2043")).toBeInTheDocument();
        expect(screen.getByText("$100,000.00")).toBeInTheDocument();
        expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("calls populateFundingReceivedForm and deleteFundingReceived on user interactions", async () => {
        render(
            <table>
                <tbody>
                    <CANFundingReceivedTableRow
                        fundingReceived={mockFundingReceived[0]}
                        totalFunding={mockTotalFunding}
                        isEditMode={true}
                        populateFundingReceivedForm={mockPopulateFundingReceivedForm}
                        deleteFundingReceived={mockDeleteFundingReceived}
                    />
                </tbody>
            </table>
        );

        // First simulate hovering over the table row
        const row = screen.getByRole("row");
        await userEvent.hover(row);

        // Wait for buttons to become visible after hover
        const editButton = screen.getByTestId("edit-row");
        const deleteButton = screen.getByTestId("delete-row");
        // Test the edit button click
        await userEvent.click(editButton);
        expect(mockPopulateFundingReceivedForm).toHaveBeenCalledWith(1);

        await userEvent.click(deleteButton);
        expect(mockDeleteFundingReceived).toHaveBeenCalledWith(1);
    });
});

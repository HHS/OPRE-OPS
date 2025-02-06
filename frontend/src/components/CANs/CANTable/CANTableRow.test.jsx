import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CANTableRow from "./CANTableRow";
import { MemoryRouter } from "react-router-dom";
import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";

// Mock the Tooltip component
vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ children }) => <div data-testid="tooltip">{children}</div>
}));

// Mock the API hook
vi.mock("../../../api/opsAPI");

describe("CANTableRow", () => {
    const mockProps = {
        name: "Test CAN",
        nickname: "Test Nickname",
        portfolio: "Test Portfolio",
        fiscalYear: 2023,
        activePeriod: 2,
        obligateBy: "2023-09-30",
        transfer: "RWA",
        fyBudget: 1_000_000,
        canId: 1
    };

    beforeEach(() => {
        useGetCanFundingSummaryQuery.mockReturnValue({
            data: { available_funding: 500000 },
            isLoading: false,
            isError: false
        });
    });

    it("renders the row with correct data", () => {
        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow {...mockProps} />
                    </tbody>
                </table>
            </MemoryRouter>
        );

        expect(screen.getByText("Test CAN")).toBeInTheDocument();
        expect(screen.getByText("Test Portfolio")).toBeInTheDocument();
        expect(screen.getByText("2 years")).toBeInTheDocument();
        expect(screen.getByText("2023-09-30")).toBeInTheDocument();
        expect(screen.getByText("$1,000,000.00")).toBeInTheDocument();
        expect(screen.getByText("$500,000.00")).toBeInTheDocument();
    });

    it("renders 'Loading...' when data is loading", () => {
        useGetCanFundingSummaryQuery.mockReturnValue({
            isLoading: true
        });

        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow {...mockProps} />
                    </tbody>
                </table>
            </MemoryRouter>
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error message when there's an error", () => {
        useGetCanFundingSummaryQuery.mockReturnValue({
            isError: true,
            error: { message: "Test error" }
        });

        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow {...mockProps} />
                    </tbody>
                </table>
            </MemoryRouter>
        );

        expect(screen.getByText("Error:")).toBeInTheDocument();
    });

    it("renders correct active period text for single year", () => {
        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow
                            {...mockProps}
                            activePeriod={1}
                        />
                    </tbody>
                </table>
            </MemoryRouter>
        );

        expect(screen.getByText("1 year")).toBeInTheDocument();
    });

    it("renders tooltip with nickname", () => {
        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow {...mockProps} />
                    </tbody>
                </table>
            </MemoryRouter>
        );

        expect(screen.getByTestId("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Test CAN")).toBeInTheDocument();
    });
});

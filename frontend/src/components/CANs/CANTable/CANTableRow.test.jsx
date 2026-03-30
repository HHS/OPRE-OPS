import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CANTableRow from "./CANTableRow";
import { MemoryRouter } from "react-router-dom";

// Mock the Tooltip component
vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ children }) => <div data-testid="tooltip">{children}</div>
}));

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
        canId: 1,
        fundingSummary: {
            available_funding: 100_000,
            received_funding: 50_000,
            total_funding: 150_000
        }
    };

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
        expect(screen.getByText("$150,000.00")).toBeInTheDocument();
        expect(screen.getByText("$50,000.00")).toBeInTheDocument();
        expect(screen.getByText("$100,000.00")).toBeInTheDocument();
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

    it("renders TBD when totalFunding is 0", () => {
        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow
                            {...mockProps}
                            fundingSummary={{ available_funding: 100_000, received_funding: 50_000, total_funding: 0 }}
                        />
                    </tbody>
                </table>
            </MemoryRouter>
        );
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("renders TBD when totalReceived is 0", () => {
        render(
            <MemoryRouter>
                <table>
                    <tbody>
                        <CANTableRow
                            {...mockProps}
                            fundingSummary={{ available_funding: 100_000, received_funding: 0, total_funding: 100_000 }}
                        />
                    </tbody>
                </table>
            </MemoryRouter>
        );
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CANTableRow from "./CANTableRow";
import { getProbedTrail, renderWithProviders } from "../../../test-utils";

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
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow {...mockProps} />
                </tbody>
            </table>
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
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow
                        {...mockProps}
                        activePeriod={1}
                    />
                </tbody>
            </table>
        );

        expect(screen.getByText("1 year")).toBeInTheDocument();
    });

    it("renders tooltip with nickname", () => {
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow {...mockProps} />
                </tbody>
            </table>
        );

        expect(screen.getByTestId("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Test CAN")).toBeInTheDocument();
    });

    it("renders TBD when totalFunding is 0", () => {
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow
                        {...mockProps}
                        fundingSummary={{ available_funding: 100_000, received_funding: 50_000, total_funding: 0 }}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("renders TBD when totalReceived is 0", () => {
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow
                        {...mockProps}
                        fundingSummary={{ available_funding: 100_000, received_funding: 0, total_funding: 100_000 }}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("passes a CANs-list breadcrumb trail when the CAN link is clicked", async () => {
        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow {...mockProps} />
                </tbody>
            </table>,
            { withLocationProbe: true }
        );

        await userEvent.click(screen.getByRole("link", { name: "Test CAN" }));

        expect(getProbedTrail()).toEqual({
            targetPath: `/cans/${mockProps.canId}?fy=2023`,
            ancestors: [{ label: "CANs", to: "/cans" }]
        });
    });

    it("links to the CAN on the list's selected FY, and without one when the list shows all FYs", () => {
        const { unmount } = renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow {...mockProps} />
                </tbody>
            </table>
        );
        expect(screen.getByRole("link", { name: mockProps.name })).toHaveAttribute(
            "href",
            `/cans/${mockProps.canId}?fy=2023`
        );
        unmount();

        renderWithProviders(
            <table>
                <tbody>
                    <CANTableRow
                        {...mockProps}
                        fiscalYear={undefined}
                    />
                </tbody>
            </table>
        );
        expect(screen.getByRole("link", { name: mockProps.name })).toHaveAttribute("href", `/cans/${mockProps.canId}`);
    });
});

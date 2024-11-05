import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CanDetailTabs from "./CanDetailTabs";

// Mock the router hooks
vi.mock("react-router-dom", () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    useLocation: () => ({ pathname: "/cans/123" }),
    useNavigate: () => mockNavigate
}));

// Create a mock navigate function outside
const mockNavigate = vi.fn();

describe("CanDetailTabs", () => {
    const mockCanId = 123;

    // Clear mock calls between tests
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it("renders all tab buttons with correct labels", () => {
        render(<CanDetailTabs canId={mockCanId} />);

        // Check if all tab labels are rendered
        expect(screen.getByText("CAN Details")).toBeInTheDocument();
        expect(screen.getByText("CAN Spending")).toBeInTheDocument();
        expect(screen.getByText("CAN Funding")).toBeInTheDocument();
    });

    it("renders tab buttons with correct data-value attributes", () => {
        render(<CanDetailTabs canId={mockCanId} />);

        // Check if all buttons have correct data-value attributes
        const buttons = screen.getAllByRole("button");

        expect(buttons[0]).toHaveAttribute("data-value", `/cans/${mockCanId}`);
        expect(buttons[1]).toHaveAttribute("data-value", `/cans/${mockCanId}/spending`);
        expect(buttons[2]).toHaveAttribute("data-value", `/cans/${mockCanId}/funding`);
    });

    it("renders the correct number of tabs", () => {
        render(<CanDetailTabs canId={mockCanId} />);

        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(3);
    });

    it("renders with correct data-cy attributes", () => {
        render(<CanDetailTabs canId={mockCanId} />);

        expect(screen.getByText("CAN Details")).toHaveAttribute("data-cy", "details-tab-CAN Details");
        expect(screen.getByText("CAN Spending")).toHaveAttribute("data-cy", "details-tab-CAN Spending");
        expect(screen.getByText("CAN Funding")).toHaveAttribute("data-cy", "details-tab-CAN Funding");
    });

    it("navigates when a tab is clicked", () => {
        render(<CanDetailTabs canId={mockCanId} />);

        const spendingTab = screen.getByText("CAN Spending");
        fireEvent.click(spendingTab);

        expect(mockNavigate).toHaveBeenCalledWith(`/cans/${mockCanId}/spending`);
    });
});

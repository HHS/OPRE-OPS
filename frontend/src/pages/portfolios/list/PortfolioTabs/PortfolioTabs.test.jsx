import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PortfolioTabs from "./PortfolioTabs";

// Mock TabsSection to simplify testing
vi.mock("../../../../components/UI/TabsSection", () => ({
    default: ({ links }) => <div data-testid="tabs-section">{links}</div>
}));

describe("PortfolioTabs", () => {
    const defaultProps = {
        activeTab: "all",
        setActiveTab: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders both tab buttons", () => {
        render(<PortfolioTabs {...defaultProps} />);

        expect(screen.getByRole("button", { name: "All Portfolios" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "My Portfolios" })).toBeInTheDocument();
    });

    it("applies selected styling to active tab", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const allButton = screen.getByRole("button", { name: "All Portfolios" });
        expect(allButton).toHaveClass("text-bold");
        expect(allButton).toHaveClass("text-base-darkest");
        expect(allButton).toHaveClass("border-bottom-05");
        expect(allButton).toHaveClass("border-primary");
    });

    it("applies not-selected styling to inactive tab", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const myButton = screen.getByRole("button", { name: "My Portfolios" });
        expect(myButton).toHaveClass("text-bold");
        expect(myButton).toHaveClass("text-base");
        expect(myButton).toHaveClass("cursor-pointer");
        expect(myButton).toHaveClass("hover:text-primary");
    });

    it("calls setActiveTab with 'all' when All Portfolios is clicked", () => {
        render(<PortfolioTabs {...defaultProps} activeTab="my" />);

        const allButton = screen.getByRole("button", { name: "All Portfolios" });
        fireEvent.click(allButton);

        expect(defaultProps.setActiveTab).toHaveBeenCalledWith("all");
    });

    it("calls setActiveTab with 'my' when My Portfolios is clicked", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const myButton = screen.getByRole("button", { name: "My Portfolios" });
        fireEvent.click(myButton);

        expect(defaultProps.setActiveTab).toHaveBeenCalledWith("my");
    });

    it("highlights My Portfolios tab when activeTab is 'my'", () => {
        render(<PortfolioTabs {...defaultProps} activeTab="my" />);

        const myButton = screen.getByRole("button", { name: "My Portfolios" });
        const allButton = screen.getByRole("button", { name: "All Portfolios" });

        expect(myButton).toHaveClass("text-base-darkest");
        expect(myButton).toHaveClass("border-bottom-05");
        expect(allButton).toHaveClass("text-base");
        expect(allButton).not.toHaveClass("border-bottom-05");
    });

    it("adds correct data-cy attribute to selected tab", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const allButton = screen.getByRole("button", { name: "All Portfolios" });
        expect(allButton).toHaveAttribute("data-cy", "tab-selected");
    });

    it("adds correct data-cy attribute to unselected tab", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const myButton = screen.getByRole("button", { name: "My Portfolios" });
        expect(myButton).toHaveAttribute("data-cy", "tab-not-selected");
    });

    it("renders buttons with correct type attribute", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
            expect(button).toHaveAttribute("type", "button");
        });
    });

    it("wraps tabs in TabsSection component", () => {
        render(<PortfolioTabs {...defaultProps} />);

        expect(screen.getByTestId("tabs-section")).toBeInTheDocument();
    });

    it("switches active tab styling when activeTab prop changes", () => {
        const { rerender } = render(<PortfolioTabs {...defaultProps} activeTab="all" />);

        let allButton = screen.getByRole("button", { name: "All Portfolios" });
        let myButton = screen.getByRole("button", { name: "My Portfolios" });

        expect(allButton).toHaveClass("border-primary");
        expect(myButton).not.toHaveClass("border-primary");

        rerender(<PortfolioTabs {...defaultProps} activeTab="my" />);

        allButton = screen.getByRole("button", { name: "All Portfolios" });
        myButton = screen.getByRole("button", { name: "My Portfolios" });

        expect(myButton).toHaveClass("border-primary");
        expect(allButton).not.toHaveClass("border-primary");
    });

    it("calls setActiveTab exactly once per click", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const myButton = screen.getByRole("button", { name: "My Portfolios" });
        fireEvent.click(myButton);

        expect(defaultProps.setActiveTab).toHaveBeenCalledTimes(1);
    });

    it("applies consistent font styling to all tabs", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
            expect(button).toHaveClass("font-sans-2xs");
            expect(button).toHaveClass("text-bold");
        });
    });

    it("applies consistent padding to all tabs", () => {
        render(<PortfolioTabs {...defaultProps} />);

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
            expect(button).toHaveClass("padding-x-105");
            expect(button).toHaveClass("padding-y-1");
        });
    });
});

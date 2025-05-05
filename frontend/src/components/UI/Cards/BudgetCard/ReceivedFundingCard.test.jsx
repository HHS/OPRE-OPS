import { render, screen } from "@testing-library/react";
import ReceivedFundingCard from "./ReceivedFundingCard";
import { describe, it, expect } from "vitest";

describe("ReceivedFundingCard", () => {
    it("renders the title correctly", () => {
        render(
            <ReceivedFundingCard
                title="Test Title"
                totalReceived={1000}
                totalFunding={5000}
            />
        );
        expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("displays the total received amount correctly", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1234.56}
                totalFunding={5000}
            />
        );
        expect(screen.getByText("$1,234.56")).toBeInTheDocument();
    });

    it("displays the total funding amount correctly", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1234.5678}
                totalFunding={5000.2345}
            />
        );
        expect(screen.getByTestId("received-funding-card-text")).toHaveTextContent("Received $1,234.57 of $5,000.23");
    });

    it("renders the 'Received' tag when totalFunding is greater than 0", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1000}
                totalFunding={5000}
            />
        );
        expect(screen.getByText("Received")).toBeInTheDocument();
    });

    it("does not render the 'Received' tag when totalFunding is 0", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1000}
                totalFunding={0}
            />
        );
        expect(screen.queryByText("Received")).not.toBeInTheDocument();
    });

    it("renders the ReverseLineGraph when totalFunding is greater than 0", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1000}
                totalFunding={5000}
            />
        );
        expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle("flex: 0 1 20%");
    });

    it("does not render the ReverseLineGraph when totalFunding is 0", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={1000}
                totalFunding={0}
            />
        );
        expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
    });

    it("handles zero totalReceived and totalFunding gracefully", () => {
        render(
            <ReceivedFundingCard
                title="Test"
                totalReceived={0}
                totalFunding={0}
            />
        );
        expect(screen.getByTestId("received-funding-card-text")).toHaveTextContent("Received $0 of $0");
    });
});

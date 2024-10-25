import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LineGraphWithLegendCard from "./LineGraphWithLegendCard";

// Mock the LineGraph component
vi.mock("../../DataViz/LineGraph", () => ({
    default: () => <div data-testid="mock-line-graph">Mock Line Graph</div>
}));

const mockData = [
    {
        id: 1,
        label: "Test Label 1",
        value: 1000,
        color: "#FF0000",
        percent: "50%",
        tagActiveStyle: "active-style-1"
    },
    {
        id: 2,
        label: "Test Label 2",
        value: 2000,
        color: "#00FF00",
        percent: "30%",
        tagActiveStyle: "active-style-2"
    }
];

const defaultProps = {
    data: mockData,
    bigNumber: 3000,
    heading: "Test Heading"
};

describe("LineGraphWithLegendCard", () => {
    it("renders without crashing", () => {
        render(<LineGraphWithLegendCard {...defaultProps} />);
        expect(screen.getByText("Test Heading")).toBeInTheDocument();
    });

    it("renders correct number of legend items", () => {
        render(<LineGraphWithLegendCard {...defaultProps} />);
        mockData.forEach((item) => {
            expect(screen.getByText(item.label)).toBeInTheDocument();
        });
    });

    it("renders with empty data array", () => {
        render(
            <LineGraphWithLegendCard
                data={[]}
                bigNumber={0}
                heading="Empty Test"
            />
        );
        expect(screen.getByText("Empty Test")).toBeInTheDocument();
    });

    it("displays the correct big number", () => {
        render(<LineGraphWithLegendCard {...defaultProps} />);
        // Note: You might need to adjust this based on how your CurrencyCard formats the number
        expect(screen.getByText("$ 3,000")).toBeInTheDocument();
    });

    it("renders LineGraph component", () => {
        render(<LineGraphWithLegendCard {...defaultProps} />);
        expect(screen.getByTestId("mock-line-graph")).toBeInTheDocument();
    });
});

describe("LineGraphWithLegendCard Snapshot", () => {
    it("matches snapshot", () => {
        const { container } = render(<LineGraphWithLegendCard {...defaultProps} />);
        expect(container).toMatchSnapshot();
    });
});

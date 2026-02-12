import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HorizontalStackedBar from "./HorizontalStackedBar";

describe("HorizontalStackedBar", () => {
    const mockData = [
        {
            id: 1,
            label: "Child Care",
            abbreviation: "CC",
            value: 7500000,
            color: "var(--portfolio-budget-1)",
            percent: 45
        },
        {
            id: 2,
            label: "Child Welfare",
            abbreviation: "CW",
            value: 5000000,
            color: "var(--portfolio-budget-2)",
            percent: 30
        },
        {
            id: 3,
            label: "Office Director",
            abbreviation: "OD",
            value: 4125000,
            color: "var(--portfolio-budget-9)",
            percent: 25
        }
    ];

    const defaultProps = {
        data: mockData,
        setActiveId: vi.fn()
    };

    it("renders with all required props", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        // Container renders, check for segments instead
        const segments = screen.getAllByRole("button");
        expect(segments.length).toBeGreaterThan(0);
    });

    it("renders correct number of segments", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        const segments = screen.getAllByRole("button");
        expect(segments).toHaveLength(3);
    });

    it("applies correct styles to segments", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        const segments = screen.getAllByRole("button");

        // Check first segment
        expect(segments[0]).toHaveStyle({ flexBasis: "45%", backgroundColor: "var(--portfolio-budget-1)" });

        // Check second segment
        expect(segments[1]).toHaveStyle({ flexBasis: "30%", backgroundColor: "var(--portfolio-budget-2)" });

        // Check third segment
        expect(segments[2]).toHaveStyle({ flexBasis: "25%", backgroundColor: "var(--portfolio-budget-9)" });
    });

    it("calls setActiveId on mouse enter", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.mouseEnter(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(1);
    });

    it("calls setActiveId with 0 on mouse leave", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.mouseLeave(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(0);
    });

    it("calls setActiveId on focus", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.focus(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(1);
    });

    it("calls setActiveId with 0 on blur", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.blur(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(0);
    });

    it("calls setActiveId on Enter key", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.keyDown(segments[0], { key: "Enter" });

        expect(setActiveId).toHaveBeenCalledWith(1);
    });

    it("calls setActiveId on Space key", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );

        const segments = screen.getAllByRole("button");
        fireEvent.keyDown(segments[0], { key: " " });

        expect(setActiveId).toHaveBeenCalledWith(1);
    });

    it("renders with correct aria-labels", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        expect(screen.getByRole("button", { name: /CC: 45% of budget/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /CW: 30% of budget/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /OD: 25% of budget/i })).toBeInTheDocument();
    });

    it("renders with correct data-cy attributes", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        expect(screen.getByTestId("portfolio-bar-segment-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-bar-segment-CW")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-bar-segment-OD")).toBeInTheDocument();
    });

    it("handles segments with tiny percentages (< 1%)", () => {
        const tinyData = [
            {
                id: 1,
                label: "Large Portfolio",
                abbreviation: "LARGE",
                value: 99000000,
                color: "var(--portfolio-budget-1)",
                percent: 99
            },
            {
                id: 2,
                label: "Tiny Portfolio",
                abbreviation: "TINY",
                value: 100000,
                color: "var(--portfolio-budget-2)",
                percent: 0.1
            }
        ];

        render(
            <HorizontalStackedBar
                data={tinyData}
                setActiveId={vi.fn()}
            />
        );

        const segments = screen.getAllByRole("button");
        // Tiny segment should have minimum width of 1%
        expect(segments[1]).toHaveStyle({ flexBasis: "1%" });
    });

    it("filters out placeholder items from data", () => {
        const dataWithPlaceholders = [
            ...mockData,
            {
                id: "placeholder-col0-0",
                label: "",
                abbreviation: "",
                value: 0,
                color: "",
                percent: 0,
                isPlaceholder: true
            },
            {
                id: "placeholder-col0-1",
                label: "",
                abbreviation: "",
                value: 0,
                color: "",
                percent: 0,
                isPlaceholder: true
            }
        ];

        render(
            <HorizontalStackedBar
                data={dataWithPlaceholders}
                setActiveId={vi.fn()}
            />
        );

        const segments = screen.getAllByRole("button");
        expect(segments).toHaveLength(3);
    });

    it("renders null when data contains only placeholders", () => {
        const onlyPlaceholders = [
            {
                id: "placeholder-0",
                label: "",
                abbreviation: "",
                value: 0,
                color: "",
                percent: 0,
                isPlaceholder: true
            }
        ];

        render(
            <HorizontalStackedBar
                data={onlyPlaceholders}
                setActiveId={vi.fn()}
            />
        );

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders null for empty data array", () => {
        render(
            <HorizontalStackedBar
                data={[]}
                setActiveId={vi.fn()}
            />
        );

        // Component returns null, so no buttons should be rendered
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders null for null data", () => {
        render(
            <HorizontalStackedBar
                data={null}
                setActiveId={vi.fn()}
            />
        );

        // Component returns null, so no buttons should be rendered
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("uses default setActiveId if not provided", () => {
        const dataWithoutSetActiveId = {
            data: mockData
        };

        // Should not throw error
        expect(() => render(<HorizontalStackedBar {...dataWithoutSetActiveId} />)).not.toThrow();
    });

    it("segments are keyboard accessible", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        const segments = screen.getAllByRole("button");
        segments.forEach((segment) => {
            expect(segment).toHaveAttribute("tabIndex", "0");
        });
    });

    it("includes screen reader text with currency formatting", () => {
        render(<HorizontalStackedBar {...defaultProps} />);

        // Check for screen reader text (usa-sr-only class)
        expect(screen.getByText(/Child Care:/)).toBeInTheDocument();
        expect(screen.getByText(/\$7,500,000\.00/)).toBeInTheDocument();
    });
});

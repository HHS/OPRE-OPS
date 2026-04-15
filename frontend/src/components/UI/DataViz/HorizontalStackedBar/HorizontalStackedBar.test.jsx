import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HorizontalStackedBar from "./HorizontalStackedBar";

describe("HorizontalStackedBar", () => {
    // 7.5M + 5M + 4.125M = 16.625M total
    // Proportional widths: 45.11...%, 30.07...%, 24.81...%
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
        const segments = screen.getAllByRole("button");
        expect(segments.length).toBeGreaterThan(0);
    });

    it("renders correct number of segments", () => {
        render(<HorizontalStackedBar {...defaultProps} />);
        const segments = screen.getAllByRole("button");
        expect(segments).toHaveLength(3);
    });

    it("applies proportional flexBasis widths derived from value, not from percent string", () => {
        // Use clean values so widths are exact integers
        const cleanData = [
            { id: 1, label: "A", abbreviation: "A", value: 500, color: "var(--color-a)", percent: 50 },
            { id: 2, label: "B", abbreviation: "B", value: 300, color: "var(--color-b)", percent: 30 },
            { id: 3, label: "C", abbreviation: "C", value: 200, color: "var(--color-c)", percent: 20 }
        ];
        render(
            <HorizontalStackedBar
                data={cleanData}
                setActiveId={vi.fn()}
            />
        );
        const segments = screen.getAllByRole("button");
        expect(segments[0]).toHaveStyle({ flexBasis: "50%" });
        expect(segments[1]).toHaveStyle({ flexBasis: "30%" });
        expect(segments[2]).toHaveStyle({ flexBasis: "20%" });
    });

    it("applies correct background colors", () => {
        render(<HorizontalStackedBar {...defaultProps} />);
        const segments = screen.getAllByRole("button");
        expect(segments[0]).toHaveStyle({ backgroundColor: "var(--portfolio-budget-1)" });
        expect(segments[1]).toHaveStyle({ backgroundColor: "var(--portfolio-budget-2)" });
        expect(segments[2]).toHaveStyle({ backgroundColor: "var(--portfolio-budget-9)" });
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

    it("calls setActiveId with null on mouse leave", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );
        const segments = screen.getAllByRole("button");
        fireEvent.mouseLeave(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(null);
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

    it("calls setActiveId with null on blur", () => {
        const setActiveId = vi.fn();
        render(
            <HorizontalStackedBar
                data={mockData}
                setActiveId={setActiveId}
            />
        );
        const segments = screen.getAllByRole("button");
        fireEvent.blur(segments[0]);

        expect(setActiveId).toHaveBeenCalledWith(null);
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

    it("renders aria-labels using the display percent string", () => {
        render(<HorizontalStackedBar {...defaultProps} />);
        expect(screen.getByRole("button", { name: /CC: 45% of budget/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /CW: 30% of budget/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /OD: 25% of budget/i })).toBeInTheDocument();
    });

    it("renders aria-label with '>99%' string percent for dominant segment", () => {
        const dominantData = [
            { id: 1, label: "Contracts (New)", abbreviation: "CONTRACT", value: 996, color: "blue", percent: ">99" },
            { id: 2, label: "Grants (New)", abbreviation: "GRANT", value: 4, color: "green", percent: "<1" }
        ];
        render(
            <HorizontalStackedBar
                data={dominantData}
                setActiveId={vi.fn()}
            />
        );
        expect(screen.getByRole("button", { name: /CONTRACT: >99% of budget/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /GRANT: <1% of budget/i })).toBeInTheDocument();
    });

    it("renders both segments when percent is a string ('>99' / '<1') — not filtered out", () => {
        const dominantData = [
            { id: 1, label: "Contracts (New)", abbreviation: "CONTRACT", value: 996, color: "blue", percent: ">99" },
            { id: 2, label: "Grants (New)", abbreviation: "GRANT", value: 4, color: "green", percent: "<1" }
        ];
        render(
            <HorizontalStackedBar
                data={dominantData}
                setActiveId={vi.fn()}
            />
        );
        const segments = screen.getAllByRole("button");
        expect(segments).toHaveLength(2);
    });

    it("tiny segment (value < 1% of total) gets minimum flexBasis of 1%", () => {
        const tinyData = [
            { id: 1, label: "Large", abbreviation: "LARGE", value: 990, color: "blue", percent: ">99" },
            { id: 2, label: "Tiny", abbreviation: "TINY", value: 1, color: "green", percent: "<1" }
        ];
        render(
            <HorizontalStackedBar
                data={tinyData}
                setActiveId={vi.fn()}
            />
        );
        const segments = screen.getAllByRole("button");
        // Tiny segment: 1/991 = ~0.1% — floored to 1%
        expect(segments[1]).toHaveStyle({ flexBasis: "1%" });
    });

    it("renders correct data-cy attributes", () => {
        render(<HorizontalStackedBar {...defaultProps} />);
        expect(screen.getByTestId("portfolio-bar-segment-CC")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-bar-segment-CW")).toBeInTheDocument();
        expect(screen.getByTestId("portfolio-bar-segment-OD")).toBeInTheDocument();
    });

    it("filters out placeholder items", () => {
        const dataWithPlaceholders = [
            ...mockData,
            { id: "placeholder-0", label: "", abbreviation: "", value: 0, color: "", percent: 0, isPlaceholder: true },
            { id: "placeholder-1", label: "", abbreviation: "", value: 0, color: "", percent: 0, isPlaceholder: true }
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

    it("filters out zero-value segments", () => {
        const dataWithZeroValue = [
            { id: 1, label: "Child Care", abbreviation: "CC", value: 7500000, color: "var(--c1)", percent: 45 },
            { id: 2, label: "Child Welfare", abbreviation: "CW", value: 0, color: "var(--c2)", percent: 0 },
            { id: 3, label: "Office Director", abbreviation: "OD", value: 0, color: "var(--c3)", percent: 0 }
        ];
        render(
            <HorizontalStackedBar
                data={dataWithZeroValue}
                setActiveId={vi.fn()}
            />
        );
        const segments = screen.getAllByRole("button");
        expect(segments).toHaveLength(1);
    });

    it("renders null when data contains only placeholders", () => {
        const onlyPlaceholders = [
            { id: "placeholder-0", label: "", abbreviation: "", value: 0, color: "", percent: 0, isPlaceholder: true }
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
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders null for null data", () => {
        render(
            <HorizontalStackedBar
                data={null}
                setActiveId={vi.fn()}
            />
        );
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("uses default setActiveId if not provided", () => {
        expect(() => render(<HorizontalStackedBar data={mockData} />)).not.toThrow();
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
        expect(screen.getByText(/Child Care:/)).toBeInTheDocument();
        expect(screen.getByText(/\$7,500,000\.00/)).toBeInTheDocument();
    });
});

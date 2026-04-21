import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReverseLineGraph from "./ReverseLineGraph";

// Minimal two-item data sets used across tests.
const makeData = (overrides = {}) => [
    {
        id: 1,
        value: 200,
        percent: 20,
        color: "var(--color-left)",
        ...overrides.left
    },
    {
        id: 2,
        value: 800,
        percent: 80,
        color: "var(--color-right)",
        ...overrides.right
    }
];

describe("ReverseLineGraph", () => {
    describe("conditional left bar rendering", () => {
        it("renders the left bar when leftValue > 0", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toBeInTheDocument();
        });

        it("does NOT render the left bar when leftValue is 0", () => {
            const data = makeData({ left: { value: 0, percent: 0 } });
            render(<ReverseLineGraph data={data} />);
            expect(screen.queryByTestId("line-graph-left-bar")).not.toBeInTheDocument();
        });

        it("always renders the right bar regardless of leftValue", () => {
            const data = makeData({ left: { value: 0, percent: 0 } });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar")).toBeInTheDocument();
        });

        it("renders both bars when both values are non-zero", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toBeInTheDocument();
            expect(screen.getByTestId("line-graph-right-bar")).toBeInTheDocument();
        });
    });

    describe("flex width", () => {
        it("applies correct flex width on left bar from numeric percent", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ flex: "0 1 20%" });
        });

        it("applies value-proportional flex width when leftPercent is a string ('<1')", () => {
            // leftValue=10, rightValue=990 → 10/1000 = 1%, below MIN_WIDTH → floored to 2%
            const data = makeData({
                left: { value: 10, percent: "<1" },
                right: { value: 990, percent: 99 }
            });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ flex: "0 1 2%" });
        });
    });

    describe("colors", () => {
        it("applies correct background color on the left bar", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ backgroundColor: "var(--color-left)" });
        });

        it("applies correct background color on the right bar", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-right-bar")).toHaveStyle({ backgroundColor: "var(--color-right)" });
        });
    });

    describe("right bar always has stripe pattern", () => {
        it("right bar background-image is always a repeating-linear-gradient", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-right-bar").style.backgroundImage).toContain(
                "repeating-linear-gradient"
            );
        });

        it("right bar stripe is present even when left bar is hidden", () => {
            const data = makeData({ left: { value: 0, percent: 0 } });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar").style.backgroundImage).toContain(
                "repeating-linear-gradient"
            );
        });
    });

    describe("leftIsFull / rightIsFull CSS class", () => {
        it("applies leftBarFull class when leftPercent >= 100 (numeric)", () => {
            const data = makeData({
                left: { value: 1000, percent: 100 },
                right: { value: 0, percent: 0 }
            });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar").className).toMatch(/leftBarFull/);
        });

        it("does NOT apply leftBarFull when leftPercent < 100", () => {
            render(<ReverseLineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar").className).not.toMatch(/leftBarFull/);
        });

        it("applies leftBarFull via fallback when rightValue is 0 and leftPercent is a string", () => {
            const data = makeData({
                left: { value: 1000, percent: "<1" },
                right: { value: 0, percent: 0 }
            });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar").className).toMatch(/leftBarFull/);
        });

        it("applies rightBarFull class when rightPercent >= 100 (numeric)", () => {
            const data = makeData({
                left: { value: 0, percent: 0 },
                right: { value: 1000, percent: 100 }
            });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar").className).toMatch(/rightBarFull/);
        });

        it("applies rightBarFull via fallback when leftValue is 0 and rightPercent is a string", () => {
            const data = makeData({
                left: { value: 0, percent: 0 },
                right: { value: 1000, percent: "<1" }
            });
            render(<ReverseLineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar").className).toMatch(/rightBarFull/);
        });
    });

    describe("setActiveId interactions", () => {
        it("calls setActiveId with left id on mouseEnter of left bar", () => {
            const setActiveId = vi.fn();
            render(
                <ReverseLineGraph
                    data={makeData()}
                    setActiveId={setActiveId}
                />
            );
            fireEvent.mouseEnter(screen.getByTestId("line-graph-left-bar"));
            expect(setActiveId).toHaveBeenCalledWith(1);
        });

        it("calls setActiveId with 0 on mouseLeave of left bar", () => {
            const setActiveId = vi.fn();
            render(
                <ReverseLineGraph
                    data={makeData()}
                    setActiveId={setActiveId}
                />
            );
            fireEvent.mouseLeave(screen.getByTestId("line-graph-left-bar"));
            expect(setActiveId).toHaveBeenCalledWith(0);
        });

        it("calls setActiveId with right id on mouseEnter of right bar", () => {
            const setActiveId = vi.fn();
            render(
                <ReverseLineGraph
                    data={makeData()}
                    setActiveId={setActiveId}
                />
            );
            fireEvent.mouseEnter(screen.getByTestId("line-graph-right-bar"));
            expect(setActiveId).toHaveBeenCalledWith(2);
        });

        it("calls setActiveId with 0 on mouseLeave of right bar", () => {
            const setActiveId = vi.fn();
            render(
                <ReverseLineGraph
                    data={makeData()}
                    setActiveId={setActiveId}
                />
            );
            fireEvent.mouseLeave(screen.getByTestId("line-graph-right-bar"));
            expect(setActiveId).toHaveBeenCalledWith(0);
        });

        it("does not throw when setActiveId is not provided (default no-op)", () => {
            expect(() => {
                render(<ReverseLineGraph data={makeData()} />);
                fireEvent.mouseEnter(screen.getByTestId("line-graph-left-bar"));
                fireEvent.mouseLeave(screen.getByTestId("line-graph-left-bar"));
            }).not.toThrow();
        });
    });
});

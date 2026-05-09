import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LineGraph from "./LineGraph";

// Minimal two-item data sets used across tests.
const makeData = (overrides = {}) => [
    {
        id: 1,
        value: 600,
        percent: 60,
        color: "var(--color-left)",
        ...overrides.left
    },
    {
        id: 2,
        value: 400,
        percent: 40,
        color: "var(--color-right)",
        ...overrides.right
    }
];

describe("LineGraph", () => {
    describe("rendering", () => {
        it("renders both bars", () => {
            render(<LineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toBeInTheDocument();
            expect(screen.getByTestId("line-graph-right-bar")).toBeInTheDocument();
        });

        it("applies correct background colors", () => {
            render(<LineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ backgroundColor: "var(--color-left)" });
            expect(screen.getByTestId("line-graph-right-bar")).toHaveStyle({ backgroundColor: "var(--color-right)" });
        });

        it("applies correct flex width on the left bar from numeric percent", () => {
            render(<LineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ flex: "0 1 60%" });
        });

        it("applies value-proportional flex width when leftPercent is a string ('<1')", () => {
            // leftValue=10, rightValue=990 → 10/1000 = 1%, below MIN_WIDTH → floored to 2%
            const data = makeData({
                left: { value: 10, percent: "<1" },
                right: { value: 990, percent: 99 }
            });
            render(<LineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar")).toHaveStyle({ flex: "0 1 2%" });
        });
    });

    describe("leftIsFull / rightIsFull CSS class", () => {
        it("applies leftBarFull class when leftPercent >= 100 (numeric)", () => {
            const data = makeData({
                left: { value: 1000, percent: 100 },
                right: { value: 0, percent: 0 }
            });
            render(<LineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar").className).toMatch(/leftBarFull/);
        });

        it("does NOT apply leftBarFull when leftPercent < 100", () => {
            render(<LineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-left-bar").className).not.toMatch(/leftBarFull/);
        });

        it("applies leftBarFull via fallback when rightValue is 0 and leftPercent is a string", () => {
            const data = makeData({
                left: { value: 1000, percent: "<1" },
                right: { value: 0, percent: 0 }
            });
            render(<LineGraph data={data} />);
            expect(screen.getByTestId("line-graph-left-bar").className).toMatch(/leftBarFull/);
        });

        it("applies rightBarFull class when rightPercent >= 100 (numeric)", () => {
            const data = makeData({
                left: { value: 0, percent: 0 },
                right: { value: 1000, percent: 100 }
            });
            render(<LineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar").className).toMatch(/rightBarFull/);
        });

        it("applies rightBarFull via fallback when leftValue is 0 and rightPercent is a string", () => {
            const data = makeData({
                left: { value: 0, percent: 0 },
                right: { value: 1000, percent: "<1" }
            });
            render(<LineGraph data={data} />);
            expect(screen.getByTestId("line-graph-right-bar").className).toMatch(/rightBarFull/);
        });

        it("does NOT apply rightBarFull when rightPercent < 100", () => {
            render(<LineGraph data={makeData()} />);
            expect(screen.getByTestId("line-graph-right-bar").className).not.toMatch(/rightBarFull/);
        });
    });

    describe("isStriped / overBudget", () => {
        it("applies stripe background-image on both bars when isStriped=true, overBudget=false", () => {
            render(
                <LineGraph
                    data={makeData()}
                    isStriped={true}
                    overBudget={false}
                />
            );
            expect(screen.getByTestId("line-graph-left-bar").style.backgroundImage).toContain(
                "repeating-linear-gradient"
            );
            expect(screen.getByTestId("line-graph-right-bar").style.backgroundImage).toContain(
                "repeating-linear-gradient"
            );
        });

        it("does NOT apply stripe when isStriped=false", () => {
            render(
                <LineGraph
                    data={makeData()}
                    isStriped={false}
                />
            );
            expect(screen.getByTestId("line-graph-left-bar").style.backgroundImage).toBe("none");
            expect(screen.getByTestId("line-graph-right-bar").style.backgroundImage).toBe("none");
        });

        it("does NOT apply stripe when overBudget=true even if isStriped=true", () => {
            render(
                <LineGraph
                    data={makeData()}
                    isStriped={true}
                    overBudget={true}
                />
            );
            expect(screen.getByTestId("line-graph-left-bar").style.backgroundImage).toBe("none");
            expect(screen.getByTestId("line-graph-right-bar").style.backgroundImage).toBe("none");
        });
    });

    describe("setActiveId interactions", () => {
        it("calls setActiveId with left id on mouseEnter of left bar", () => {
            const setActiveId = vi.fn();
            render(
                <LineGraph
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
                <LineGraph
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
                <LineGraph
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
                <LineGraph
                    data={makeData()}
                    setActiveId={setActiveId}
                />
            );
            fireEvent.mouseLeave(screen.getByTestId("line-graph-right-bar"));
            expect(setActiveId).toHaveBeenCalledWith(0);
        });

        it("does not throw when setActiveId is not provided (default no-op)", () => {
            expect(() => {
                render(<LineGraph data={makeData()} />);
                fireEvent.mouseEnter(screen.getByTestId("line-graph-left-bar"));
                fireEvent.mouseLeave(screen.getByTestId("line-graph-left-bar"));
            }).not.toThrow();
        });
    });
});

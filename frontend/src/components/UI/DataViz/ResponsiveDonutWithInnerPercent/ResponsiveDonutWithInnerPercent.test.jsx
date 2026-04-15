import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResponsiveDonutWithInnerPercent from "./ResponsiveDonutWithInnerPercent";

// Mock nivo's ResponsivePie — it requires canvas/SVG layout APIs unavailable in
// jsdom. Capture the data prop so tests can assert on what gets passed to nivo.
let capturedData = null;

vi.mock("@nivo/pie", () => ({
    ResponsivePie: ({ data }) => {
        capturedData = data;
        return (
            <div data-testid="responsive-pie">
                {data.map((d) => (
                    <span
                        key={d.id}
                        data-testid={`slice-${d.id}`}
                        data-value={d.value}
                    />
                ))}
            </div>
        );
    }
}));

const makeData = (overrides = []) =>
    overrides.map(({ id, value, color = "red", percent = 50 }) => ({
        id,
        label: `Item ${id}`,
        value,
        color,
        percent
    }));

describe("ResponsiveDonutWithInnerPercent", () => {
    beforeEach(() => {
        capturedData = null;
    });

    it("renders without crashing", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 500 },
                    { id: 2, value: 500 }
                ])}
                container_id="test-chart"
            />
        );
        expect(screen.getByTestId("responsive-pie")).toBeInTheDocument();
    });

    it("passes balanced data to nivo unchanged (no floor needed)", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 500 },
                    { id: 2, value: 500 }
                ])}
                container_id="test-chart"
            />
        );
        expect(capturedData[0].value).toBe(500);
        expect(capturedData[1].value).toBe(500);
    });

    it("floors a tiny non-zero slice to ≥1% of total so it is visible", () => {
        // Slice 2 is 0.1% of total — below the 1% visibility floor
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 999 },
                    { id: 2, value: 1 }
                ])}
                container_id="test-chart"
            />
        );
        const total = 1000;
        const minValue = total * 0.01; // 10
        expect(capturedData[1].value).toBeGreaterThanOrEqual(minValue);
    });

    it("preserves the total after flooring a tiny slice (sum unchanged)", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 999 },
                    { id: 2, value: 1 }
                ])}
                container_id="test-chart"
            />
        );
        const chartTotal = capturedData.reduce((sum, d) => sum + d.value, 0);
        expect(chartTotal).toBeCloseTo(1000, 5);
    });

    it("does not raise a zero-value slice", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 1000 },
                    { id: 2, value: 0 }
                ])}
                container_id="test-chart"
            />
        );
        expect(capturedData[1].value).toBe(0);
    });

    it("handles all-zero data without crashing", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 0 },
                    { id: 2, value: 0 }
                ])}
                container_id="test-chart"
            />
        );
        expect(capturedData[0].value).toBe(0);
        expect(capturedData[1].value).toBe(0);
    });

    it("passes all non-value fields through to nivo unchanged", () => {
        const input = makeData([
            { id: 1, value: 500, color: "var(--blue)", percent: 50 },
            { id: 2, value: 500, color: "var(--green)", percent: 50 }
        ]);
        render(
            <ResponsiveDonutWithInnerPercent
                data={input}
                container_id="test-chart"
            />
        );
        expect(capturedData[0].color).toBe("var(--blue)");
        expect(capturedData[0].percent).toBe(50);
        expect(capturedData[0].label).toBe("Item 1");
    });

    it("renders the correct number of slices", () => {
        render(
            <ResponsiveDonutWithInnerPercent
                data={makeData([
                    { id: 1, value: 400 },
                    { id: 2, value: 300 },
                    { id: 3, value: 300 }
                ])}
                container_id="test-chart"
            />
        );
        expect(screen.getAllByTestId(/^slice-/)).toHaveLength(3);
    });
});

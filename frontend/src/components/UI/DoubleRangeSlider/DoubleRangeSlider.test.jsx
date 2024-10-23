import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DoubleRangeSlider from "./DoubleRangeSlider";

// Mock ResizeObserver
class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe("DoubleRangeSlider", () => {
    it("renders with default values", () => {
        const handleChange = vi.fn();
        render(
            <DoubleRangeSlider
                handleChange={handleChange}
                value={[25, 75]}
            />
        );

        const thumbs = screen.getAllByRole("slider");
        expect(thumbs).toHaveLength(2);
        expect(thumbs[0]).toHaveAttribute("aria-valuenow", "25");
        expect(thumbs[1]).toHaveAttribute("aria-valuenow", "75");
    });
    it("calls handleChange when values are changed", async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();
        render(
            <DoubleRangeSlider
                handleChange={handleChange}
                value={[25, 75]}
            />
        );

        const thumbs = screen.getAllByRole("slider");
        await user.type(thumbs[0], "{arrowright}");

        expect(handleChange).toHaveBeenCalled();
    });
    it("respects min and max values", () => {
        const handleChange = vi.fn();
        render(
            <DoubleRangeSlider
                handleChange={handleChange}
                value={[0, 100]}
            />
        );

        const thumbs = screen.getAllByRole("slider");
        expect(thumbs[0]).toHaveAttribute("aria-valuemin", "0");
        expect(thumbs[1]).toHaveAttribute("aria-valuemax", "100");
    });
    it("renders with custom default values", () => {
        const handleChange = vi.fn();
        render(
            <DoubleRangeSlider
                handleChange={handleChange}
                value={[10, 90]}
                defaultValue={[10, 90]}
            />
        );

        const thumbs = screen.getAllByRole("slider");
        expect(thumbs[0]).toHaveAttribute("aria-valuenow", "10");
        expect(thumbs[1]).toHaveAttribute("aria-valuenow", "90");
    });
});

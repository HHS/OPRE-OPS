import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import PeriodOfPerformanceFields from "./PeriodOfPerformanceFields";

describe("PeriodOfPerformanceFields", () => {
    const defaultProps = {
        formKey: "test-key",
        formData: { popStartDate: "01/01/2024", popEndDate: "12/31/2024" },
        setFormData: vi.fn()
    };

    test("renders the start and end date pickers", () => {
        render(<PeriodOfPerformanceFields {...defaultProps} />);

        // The USWDS DatePicker clones its input at mount, so both the label's own text input
        // and the clone match the label — mirrors the pattern used by ServicesComponentForm/
        // GrantNumberForm's own tests for this same component.
        expect(screen.getAllByLabelText("Period of Performance-Start").length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText("Period of Performance-End").length).toBeGreaterThan(0);
    });

    test("uses unprefixed ids by default", () => {
        render(<PeriodOfPerformanceFields {...defaultProps} />);

        // USWDS clones the rendered input at mount; only the clone carries the real id, so find
        // it by id rather than assuming array order.
        const startInput = screen.getAllByLabelText("Period of Performance-Start").find((el) => el.id);
        const endInput = screen.getAllByLabelText("Period of Performance-End").find((el) => el.id);
        expect(startInput).toHaveAttribute("id", "pop-start-date");
        expect(endInput).toHaveAttribute("id", "pop-end-date");
    });

    test("prefixes ids with idPrefix so the two forms don't collide", () => {
        render(
            <PeriodOfPerformanceFields
                {...defaultProps}
                idPrefix="grant-number-"
            />
        );

        const startInput = screen.getAllByLabelText("Period of Performance-Start").find((el) => el.id);
        const endInput = screen.getAllByLabelText("Period of Performance-End").find((el) => el.id);
        expect(startInput).toHaveAttribute("id", "grant-number-pop-start-date");
        expect(endInput).toHaveAttribute("id", "grant-number-pop-end-date");
    });
});

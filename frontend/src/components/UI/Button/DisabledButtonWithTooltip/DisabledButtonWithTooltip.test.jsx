import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DisabledButtonWithTooltip from "./DisabledButtonWithTooltip";

// Tooltip renders its label in a span and its children; mock to keep tests simple.
// NOTE: the mock renders children directly, which means both the wrapper div[role=button]
// and the inner <button> share the accessible name from the button text.
vi.mock("../../USWDS/Tooltip", () => ({
    __esModule: true,
    default: ({ label, children }) => (
        <div data-testid="tooltip-wrapper">
            <span data-testid="tooltip-label">{label}</span>
            {children}
        </div>
    )
}));

describe("DisabledButtonWithTooltip", () => {
    it("renders the tooltip label", () => {
        render(
            <DisabledButtonWithTooltip label="Fix required fields to continue">
                Send to Approval
            </DisabledButtonWithTooltip>
        );
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent("Fix required fields to continue");
    });

    it("renders the inner native button as disabled", () => {
        render(<DisabledButtonWithTooltip label="Fix required fields">Send to Approval</DisabledButtonWithTooltip>);
        // Both wrapper div[role=button] and inner <button> share the same accessible name via mock.
        // Filter to the native <button> element which carries the disabled attribute.
        const buttons = screen.getAllByRole("button", { name: "Send to Approval" });
        const nativeBtn = buttons.find((el) => el.tagName === "BUTTON");
        expect(nativeBtn).toBeDisabled();
    });

    it("applies data-cy to the inner button", () => {
        render(
            <DisabledButtonWithTooltip
                label="tooltip"
                dataCy="send-to-approval-btn"
            >
                Send to Approval
            </DisabledButtonWithTooltip>
        );
        const buttons = screen.getAllByRole("button", { name: "Send to Approval" });
        const nativeBtn = buttons.find((el) => el.tagName === "BUTTON");
        expect(nativeBtn).toHaveAttribute("data-cy", "send-to-approval-btn");
    });

    it("renders the focusable wrapper with aria-disabled and tabIndex", () => {
        render(<DisabledButtonWithTooltip label="tooltip">Click me</DisabledButtonWithTooltip>);
        // The wrapper is a div with role="button" and aria-disabled — distinct from
        // the inner <button> by tag name.
        const buttons = screen.getAllByRole("button", { name: "Click me" });
        const wrapper = buttons.find((el) => el.tagName === "DIV");
        expect(wrapper).toHaveAttribute("aria-disabled", "true");
        expect(wrapper).toHaveAttribute("tabindex", "0");
    });
});

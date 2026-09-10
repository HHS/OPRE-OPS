import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AgreementDetailHeader from "./AgreementDetailHeader";
import { EDIT_DISABLED_TOOLTIPS } from "../../helpers/agreement.helpers";

// Expose the tooltip label in a testable element without the USWDS tooltip DOM mutation.
vi.mock("../UI/USWDS/Tooltip", () => ({
    __esModule: true,
    default: ({ label, children }) => (
        <span>
            <span data-testid="tooltip-label">{label}</span>
            {children}
        </span>
    )
}));

const baseProps = {
    heading: "Agreement Details",
    details: "",
    isEditMode: false,
    setIsEditMode: vi.fn(),
    isEditable: true,
    canUserEdit: true,
    isAgreementNotDeveloped: false,
    hasUnsavedChanges: false,
    isPreAwardInReview: false,
    isAwardInReview: false,
    isPostPreAwardLocked: false
};

const renderHeader = (props = {}) =>
    render(
        <AgreementDetailHeader
            {...baseProps}
            {...props}
        />
    );

describe("AgreementDetailHeader", () => {
    it("renders an enabled Edit button when editable and not in edit mode", async () => {
        const setIsEditMode = vi.fn();
        renderHeader({ isEditable: true, setIsEditMode });

        const editButton = screen.getByRole("button", { name: /Edit/i });
        expect(editButton).toHaveAttribute("id", "edit");
        expect(editButton).not.toHaveAttribute("aria-disabled");
        expect(screen.queryByTestId("tooltip-label")).not.toBeInTheDocument();

        await userEvent.click(editButton);
        expect(setIsEditMode).toHaveBeenCalledWith(true);
    });

    it("renders no Edit button while in edit mode", () => {
        renderHeader({ isEditMode: true });
        expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    });

    it("shows a disabled Edit button with the team-member tooltip for a non-team-member", () => {
        renderHeader({ isEditable: false, canUserEdit: false });

        const editButton = screen.getByRole("button", { name: /Edit/i });
        expect(editButton).toHaveAttribute("aria-disabled", "true");
        expect(editButton).toHaveAttribute("data-cy", "edit-disabled");
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent(EDIT_DISABLED_TOOLTIPS.notTeamMember);
    });

    it("shows the pre-award tooltip when a team member views a pre-award agreement", () => {
        renderHeader({ isEditable: false, canUserEdit: true, isPreAwardInReview: true });
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent(EDIT_DISABLED_TOOLTIPS.preAwardInReview);
    });

    it("shows the award tooltip when a team member views an award-review agreement", () => {
        renderHeader({ isEditable: false, canUserEdit: true, isAwardInReview: true });
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent(EDIT_DISABLED_TOOLTIPS.awardInReview);
    });

    it("shows the locked tooltip when the agreement is post-pre-award locked", () => {
        renderHeader({ isEditable: false, canUserEdit: true, isPostPreAwardLocked: true });
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent(EDIT_DISABLED_TOOLTIPS.postPreAwardLocked);
    });

    it("shows the 'coming soon' tooltip for an undeveloped agreement", () => {
        renderHeader({ isEditable: false, canUserEdit: true, isAgreementNotDeveloped: true });
        // textContent preserves the embedded newline, so compare exactly (toHaveTextContent normalizes it away).
        expect(screen.getByTestId("tooltip-label").textContent).toBe(EDIT_DISABLED_TOOLTIPS.notDeveloped);
    });

    it("prioritizes the team-member tooltip over review-state tooltips", () => {
        renderHeader({ isEditable: false, canUserEdit: false, isPreAwardInReview: true });
        expect(screen.getByTestId("tooltip-label")).toHaveTextContent(EDIT_DISABLED_TOOLTIPS.notTeamMember);
    });
});

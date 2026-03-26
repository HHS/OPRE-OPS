import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CHANGE_REQUESTS_TOOLTIP_LOADING } from "../../../hooks/useChangeRequests.hooks";
import ChangeIcons from "./ChangeIcons";
import { DISABLED_ICON_CLASSES } from "./DisabledChangeIcons.constants";

vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ label, children }) => (
        <div
            data-testid="tooltip"
            data-label={label}
        >
            {children}
        </div>
    )
}));

describe("ChangeIcons", () => {
    const mockItem = {
        agreement_id: 1,
        amount: 1000,
        can_id: 1,
        id: 123,
        in_review: false,
        portfolio_id: 1,
        proc_shop_fee_percentage: 5,
        status: "draft",
        team_members: [],
        created_on: "2024-01-01",
        updated_on: "2024-01-01",
        created_by: 1,
        updated_by: 1,
        created_by_user: null,
        updated_by_user: null,
        display_name: "Test Item"
    };

    const defaultProps = {
        item: mockItem,
        isItemEditable: true,
        handleSetItemForEditing: vi.fn(),
        handleDeleteItem: vi.fn(),
        handleDuplicateItem: vi.fn(),
        handleSubmitItemForApproval: vi.fn()
    };

    const getEditTooltip = () =>
        screen.getAllByTestId("tooltip").find((tooltip) => within(tooltip).queryByTestId("edit-row"));

    it("renders edit, delete, and duplicate icons when item is editable", () => {
        render(<ChangeIcons {...defaultProps} />);

        expect(screen.getByTestId("edit-row")).toBeInTheDocument();
        expect(screen.getByTestId("delete-row")).toBeInTheDocument();
        expect(screen.getByTestId("duplicate-row")).toBeInTheDocument();
    });

    it("renders disabled icons when item is not editable", () => {
        render(
            <ChangeIcons
                {...defaultProps}
                isItemEditable={false}
            />
        );

        const editButton = screen.getByTestId("edit-row");
        const deleteButton = screen.getByTestId("delete-row");

        expect(editButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();
    });

    it("falls back to the static tooltip while locked message data is loading", () => {
        render(
            <ChangeIcons
                {...defaultProps}
                isItemEditable={false}
                item={{ ...mockItem, status: "IN_EXECUTION" }}
                lockedMessage={CHANGE_REQUESTS_TOOLTIP_LOADING}
            />
        );

        expect(getEditTooltip()).toHaveAttribute(
            "data-label",
            "If you need to edit a budget line in Executing Status, please contact the budget team"
        );
    });

    it("keeps the loading tooltip when no static fallback exists", () => {
        render(
            <ChangeIcons
                {...defaultProps}
                isItemEditable={false}
                lockedMessage={CHANGE_REQUESTS_TOOLTIP_LOADING}
            />
        );

        expect(getEditTooltip()).toHaveAttribute("data-label", CHANGE_REQUESTS_TOOLTIP_LOADING);
    });

    it("calls handleSetItemForEditing when edit button is clicked", async () => {
        const user = userEvent.setup();
        render(<ChangeIcons {...defaultProps} />);

        await user.click(screen.getByTestId("edit-row"));
        expect(defaultProps.handleSetItemForEditing).toHaveBeenCalledWith(123);
    });

    it("calls handleDeleteItem when delete button is clicked and item is deletable", async () => {
        const user = userEvent.setup();
        render(<ChangeIcons {...defaultProps} />);

        await user.click(screen.getByTestId("delete-row"));
        expect(defaultProps.handleDeleteItem).toHaveBeenCalledWith(123, "Test Item");
    });

    it("renders delete button as disabled when item is not deletable", () => {
        render(
            <ChangeIcons
                {...defaultProps}
                isItemDeletable={false}
            />
        );

        const deleteButton = screen.getByTestId("delete-row");
        expect(deleteButton).toBeDisabled();
        expect(within(deleteButton).getByRole("img", { hidden: true })).toHaveClass(DISABLED_ICON_CLASSES);
    });

    it("calls handleDuplicateItem when duplicate button is clicked", async () => {
        const user = userEvent.setup();
        render(<ChangeIcons {...defaultProps} />);

        await user.click(screen.getByTestId("duplicate-row"));
        expect(defaultProps.handleDuplicateItem).toHaveBeenCalledWith(123);
    });

    it("renders send to review icon when sendToReviewIcon prop is true", () => {
        render(
            <ChangeIcons
                {...defaultProps}
                sendToReviewIcon={true}
            />
        );

        expect(screen.getByTestId("submit-row")).toBeInTheDocument();
    });

    it("calls handleSubmitItemForApproval when send to review button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <ChangeIcons
                {...defaultProps}
                sendToReviewIcon={true}
            />
        );

        await user.click(screen.getByTestId("submit-row"));
        expect(defaultProps.handleSubmitItemForApproval).toHaveBeenCalledWith(123);
    });
});

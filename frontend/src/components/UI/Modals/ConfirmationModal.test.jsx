import { render, screen } from "@testing-library/react";
import { expect, it, describe, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./ConfirmationModal";

describe("ConfirmationModal", () => {
    const defaultProps = {
        heading: "Test Heading",
        description: "Test Description",
        setShowModal: vi.fn(),
        actionButtonText: "Confirm",
        secondaryButtonText: "Cancel",
        handleConfirm: vi.fn()
    };
    it("renders the modal with correct content", () => {
        render(<ConfirmationModal {...defaultProps} />);

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
    it("calls setShowModal(false) when cancel button is clicked", async () => {
        render(<ConfirmationModal {...defaultProps} />);

        await userEvent.click(screen.getByText("Cancel"));

        expect(defaultProps.setShowModal).toHaveBeenCalledWith(false);
    });
    it("calls handleConfirm and setShowModal(false) when confirm button is clicked", async () => {
        render(<ConfirmationModal {...defaultProps} />);

        await userEvent.click(screen.getByText("Confirm"));

        expect(defaultProps.handleConfirm).toHaveBeenCalled();
        expect(defaultProps.setShowModal).toHaveBeenCalledWith(false);
    });
    it("handles cancelling out via the Escape key", async () => {
        render(<ConfirmationModal {...defaultProps} />);

        await userEvent.keyboard("{Escape}");

        expect(defaultProps.setShowModal).toHaveBeenCalledWith(false);
    });
    it("handles cancelling out by clicking outside the modal", async () => {
        render(<ConfirmationModal {...defaultProps} />);

        // eslint-disable-next-line testing-library/no-node-access
        const overlay = screen.getByRole("dialog").closest(".usa-modal-wrapper");
        await userEvent.click(overlay);
        expect(defaultProps.setShowModal).toHaveBeenCalledWith(false);
    });
    it("does not render a third button when tertiaryButtonText is not provided", () => {
        render(<ConfirmationModal {...defaultProps} />);

        expect(screen.getAllByRole("button")).toHaveLength(2);
    });
    it("renders and wires up a third button when tertiaryButtonText is provided (OPS-3268)", async () => {
        const handleTertiary = vi.fn();
        render(
            <ConfirmationModal
                {...defaultProps}
                tertiaryButtonText="Keep budget lines"
                handleTertiary={handleTertiary}
            />
        );

        expect(screen.getAllByRole("button")).toHaveLength(3);
        await userEvent.click(screen.getByText("Keep budget lines"));

        expect(handleTertiary).toHaveBeenCalled();
        expect(defaultProps.setShowModal).toHaveBeenCalledWith(false);
    });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import SaveChangesAndExitModal from "./SaveChangesAndExitModal";

vi.mock("../LogItem", () => ({
    default: ({ title }) => <div>{title}</div>
}));

describe("SaveChangesAndExitModal", () => {
    const mockSetShowModal = vi.fn();
    const mockHandleConfirm = vi.fn();
    const mockHandleSecondary = vi.fn();
    const mockCloseModal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the modal with heading", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Save Changes?")).toBeInTheDocument();
    });

    it("should render with string description", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                description="You have unsaved changes"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
    });

    it("should render with array description using LogItems", () => {
        const description = [
            { id: 1, title: "Change 1", created_on: "2024-01-01", message: "Message 1" },
            { id: 2, title: "Change 2", created_on: "2024-01-02", message: "Message 2" }
        ];

        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                description={description}
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Change 1")).toBeInTheDocument();
        expect(screen.getByText("Change 2")).toBeInTheDocument();
    });

    it("should render action button with correct text", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save and Exit"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Save and Exit")).toBeInTheDocument();
    });

    it("should render secondary button with default text", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render secondary button with custom text", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                secondaryButtonText="Discard"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Discard")).toBeInTheDocument();
    });

    it("should call setShowModal and handleConfirm when action button is clicked", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
                handleConfirm={mockHandleConfirm}
            />
        );

        const saveButton = screen.getByText("Save");
        fireEvent.click(saveButton);

        expect(mockSetShowModal).toHaveBeenCalledWith(false);
        expect(mockHandleConfirm).toHaveBeenCalled();
    });

    it("should call handleSecondary when secondary button is clicked", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
                handleSecondary={mockHandleSecondary}
            />
        );

        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        expect(mockHandleSecondary).toHaveBeenCalled();
    });

    it("should call closeModal and setShowModal when Escape key is pressed", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
                closeModal={mockCloseModal}
            />
        );

        fireEvent.keyDown(document, { key: "Escape" });

        expect(mockCloseModal).toHaveBeenCalled();
        expect(mockSetShowModal).toHaveBeenCalledWith(false);
    });

    it("should have dialog role", () => {
        render(
            <SaveChangesAndExitModal
                heading="Save Changes?"
                actionButtonText="Save"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ContainerModal from "./ContainerModal";

describe("ContainerModal", () => {
    const mockSetShowModal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the modal with heading", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Test Heading")).toBeInTheDocument();
    });

    it("should render the modal with description", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                description="Test description"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("should render children", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            >
                <div>Child content</div>
            </ContainerModal>
        );

        expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should render default cancel button text", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render custom cancel button text", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
                cancelButtonText="Close"
            />
        );

        expect(screen.getByText("Close")).toBeInTheDocument();
    });

    it("should call setShowModal when cancel button is clicked", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            />
        );

        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        expect(mockSetShowModal).toHaveBeenCalledWith(false);
    });

    it("should call setShowModal when Escape key is pressed", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            />
        );

        fireEvent.keyDown(document, { key: "Escape" });

        expect(mockSetShowModal).toHaveBeenCalledWith(false);
    });

    it("should have dialog role", () => {
        render(
            <ContainerModal
                heading="Test Heading"
                setShowModal={mockSetShowModal}
            />
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

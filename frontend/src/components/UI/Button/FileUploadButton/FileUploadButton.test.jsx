import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FileUploadButton from "./FileUploadButton";

describe("FileUploadButton component", () => {
    const mockOnFileChange = vi.fn();

    describe("Rendering", () => {
        it("renders with required props", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            expect(screen.getByText("Upload File")).toBeInTheDocument();
            expect(screen.getByLabelText("Upload File")).toBeInTheDocument();
        });

        it("renders with default buttonText 'Upload File'", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            expect(screen.getByText("Upload File")).toBeInTheDocument();
        });

        it("renders with custom buttonText", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    buttonText="Choose Document"
                />
            );

            expect(screen.getByText("Choose Document")).toBeInTheDocument();
        });

        it("applies custom className", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    className="custom-class"
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveClass("custom-class");
        });

        it("merges custom style with default styles", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    style={{ marginTop: "1rem" }}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveStyle({ marginTop: "1rem" });
            // Default styles should still be present
            expect(label).toHaveStyle({ display: "flex", alignItems: "center" });
        });
    });

    describe("Disabled State", () => {
        it("renders with disabled=true", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toBeDisabled();
        });

        it("shows correct cursor class when disabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveClass("cursor-not-allowed");
        });

        it("shows correct cursor class when enabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveClass("cursor-pointer");
        });

        it("applies disabled color (#c9c9c9) when disabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveStyle({ color: "#c9c9c9" });
        });

        it("applies enabled color (#757575) when enabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label).toHaveStyle({ color: "#757575" });
        });

        it("wraps in Tooltip when disabled AND disabledTooltip provided", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                    disabledTooltip="Cannot upload right now"
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            expect(label.parentElement.tagName).toBe("SPAN");
        });

        it("does NOT wrap in Tooltip when disabled but no disabledTooltip", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            // The parent should be a fragment or the root container, not a span from Tooltip
            expect(label.parentElement.tagName).not.toBe("SPAN");
        });

        it("does NOT wrap in Tooltip when enabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                    disabledTooltip="This should not show"
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            // When enabled, Tooltip should not wrap the label even if disabledTooltip is provided
            expect(label.parentElement.tagName).not.toBe("SPAN");
        });
    });

    describe("File Input", () => {
        it("file input has correct id attribute", () => {
            render(
                <FileUploadButton
                    id="my-file-input"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveAttribute("id", "my-file-input");
        });

        it("file input has correct name attribute when provided", () => {
            render(
                <FileUploadButton
                    id="my-file-input"
                    name="custom-name"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveAttribute("name", "custom-name");
        });

        it("file input name defaults to id when not provided", () => {
            render(
                <FileUploadButton
                    id="my-file-input"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveAttribute("name", "my-file-input");
        });

        it("file input has correct accept attribute", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    acceptedFileTypes=".pdf,.doc,.docx"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveAttribute("accept", ".pdf,.doc,.docx");
        });

        it("file input has type='file' attribute", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveAttribute("type", "file");
        });

        it("file input is hidden", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            const input = screen.getByLabelText("Upload File");
            expect(input).toHaveStyle({ display: "none" });
        });

        it("file input disabled attribute matches disabled prop", () => {
            const { rerender } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            let input = screen.getByLabelText("Upload File");
            expect(input).toBeDisabled();

            rerender(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            input = screen.getByLabelText("Upload File");
            expect(input).not.toBeDisabled();
        });
    });

    describe("Event Handling", () => {
        it("calls onFileChange when file selected", async () => {
            const mockOnChange = vi.fn();

            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            const file = new File(["test"], "test.pdf", { type: "application/pdf" });

            // Manually create and dispatch a change event
            Object.defineProperty(input, "files", {
                value: [file],
                writable: false
            });

            const changeEvent = new Event("change", { bubbles: true });
            input.dispatchEvent(changeEvent);

            expect(mockOnChange).toHaveBeenCalledTimes(1);
        });
    });

    describe("Accessibility", () => {
        it("label htmlFor matches input id", () => {
            const { container } = render(
                <FileUploadButton
                    id="accessible-input"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const label = container.querySelector("label");
            const input = screen.getByLabelText("Upload File");

            expect(label).toHaveAttribute("for", "accessible-input");
            expect(input).toHaveAttribute("id", "accessible-input");
        });

        it("SVG has aria-hidden and focusable attributes", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const svg = container.querySelector("svg");
            expect(svg).toHaveAttribute("aria-hidden", "true");
            expect(svg).toHaveAttribute("focusable", "false");
        });
    });
});

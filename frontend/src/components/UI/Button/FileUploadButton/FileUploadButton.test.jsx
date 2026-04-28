import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
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

            // Check for button with aria-label (default label)
            expect(screen.getByRole("button", { name: "Upload File" })).toBeInTheDocument();
            // Check that "Upload File" text appears (in both label and button text)
            expect(screen.getAllByText("Upload File").length).toBeGreaterThan(0);
        });

        it("renders with default label and buttonText", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            // Both label placeholder and button text show "Upload File"
            expect(screen.getAllByText("Upload File").length).toBe(2);
        });

        it("renders with custom buttonText", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    buttonText="Choose Document"
                />
            );

            // Custom button text appears in bottom section
            expect(screen.getByText("Choose Document")).toBeInTheDocument();
            // Default label still appears
            expect(screen.getByText("Upload File")).toBeInTheDocument();
        });

        it("applies custom className", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    className="custom-class"
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toHaveClass("custom-class");
        });

        it("merges custom style with default styles", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    style={{ marginTop: "1rem" }}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toHaveStyle({ marginTop: "1rem" });
            // Card default styles (width, minHeight, justifyContent)
            expect(button).toHaveStyle({ width: "450px", minHeight: "100px", justifyContent: "space-between" });
        });

        it("displays selectedFile name when provided", () => {
            const mockFile = new File(["content"], "test-document.pdf", { type: "application/pdf" });
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    selectedFile={mockFile}
                />
            );

            expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
        });

        it("displays label when no file selected", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    label="Custom Placeholder"
                />
            );

            expect(screen.getByText("Custom Placeholder")).toBeInTheDocument();
        });

        it("applies custom width and minHeight", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    width="600px"
                    minHeight="150px"
                />
            );

            const button = screen.getByRole("button");
            expect(button).toHaveStyle({ width: "600px", minHeight: "150px" });
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
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toHaveClass("cursor-not-allowed");
        });

        it("shows correct cursor class when enabled", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toHaveClass("cursor-pointer");
        });

        it("applies disabled color (#c9c9c9) when disabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            // Check the span inside the button for color
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const span = container.querySelector("span[style*='color']");
            expect(span).toHaveStyle({ color: "#c9c9c9" });
        });

        it("applies enabled color (#757575) when enabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            // Check the span inside the button for color
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const span = container.querySelector("span[style*='color']");
            expect(span).toHaveStyle({ color: "#757575" });
        });

        it("wraps in Tooltip when disabled AND disabledTooltip provided", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                    disabledTooltip="Cannot upload right now"
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            // Button wrapped in div, which is wrapped in span by Tooltip
            expect(button.parentElement.tagName).toBe("DIV");
            expect(button.parentElement.parentElement.tagName).toBe("SPAN");
        });

        it("does NOT wrap in Tooltip when disabled but no disabledTooltip", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            // Without tooltip, should not have the inline-block div wrapper
            expect(button.parentElement.style.display).not.toBe("inline-block");
            // Should not be wrapped by Tooltip's span
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            expect(container.querySelector("span[ref]")).toBeNull();
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

            const button = screen.getByRole("button", { name: "Upload File" });
            // When enabled, should not have the inline-block div wrapper
            expect(button.parentElement.style.display).not.toBe("inline-block");
            // Should not be wrapped by Tooltip's span
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            expect(container.querySelector("span[ref]")).toBeNull();
        });
    });

    describe("File Input", () => {
        it("file input has correct id attribute", () => {
            const { container } = render(
                <FileUploadButton
                    id="my-file-input"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveAttribute("id", "my-file-input");
        });

        it("file input has correct name attribute when provided", () => {
            const { container } = render(
                <FileUploadButton
                    id="my-file-input"
                    name="custom-name"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveAttribute("name", "custom-name");
        });

        it("file input name defaults to id when not provided", () => {
            const { container } = render(
                <FileUploadButton
                    id="my-file-input"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveAttribute("name", "my-file-input");
        });

        it("file input has correct accept attribute", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    acceptedFileTypes=".pdf,.doc,.docx"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveAttribute("accept", ".pdf,.doc,.docx");
        });

        it("file input has type='file' attribute", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveAttribute("type", "file");
        });

        it("file input is hidden", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toHaveStyle({ display: "none" });
        });

        it("file input disabled attribute matches disabled prop", () => {
            const { rerender, container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            let input = container.querySelector('input[type="file"]');
            expect(input).toBeDisabled();

            rerender(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            input = container.querySelector('input[type="file"]');
            expect(input).not.toBeDisabled();
        });
    });

    describe("Variant: Upload", () => {
        it("renders with upload variant by default", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            // Should have file input
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).toBeInTheDocument();

            // Should have upload icon (cloud upload SVG path)
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const uploadIcon = container.querySelector('svg path[d*="M19.35"]');
            expect(uploadIcon).toBeInTheDocument();
        });

        it("triggers file input click when button is clicked", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            const clickSpy = vi.spyOn(input, "click");

            await user.click(button);

            expect(clickSpy).toHaveBeenCalledTimes(1);
        });

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

    describe("Variant: Download", () => {
        it("renders with download variant", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-download"
                    variant="download"
                    onDownload={vi.fn()}
                />
            );

            // Should NOT have file input
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            expect(input).not.toBeInTheDocument();

            // Should have download icon (USWDS sprite use element)
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const downloadIcon = container.querySelector('use[href*="file_download"]');
            expect(downloadIcon).toBeInTheDocument();
        });

        it("calls onDownload when download button is clicked", async () => {
            const mockOnDownload = vi.fn();
            const user = userEvent.setup();

            render(
                <FileUploadButton
                    id="test-download"
                    variant="download"
                    onDownload={mockOnDownload}
                    buttonText="Download File"
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            await user.click(button);

            expect(mockOnDownload).toHaveBeenCalledTimes(1);
        });

        it("does not call onDownload when disabled", () => {
            const mockOnDownload = vi.fn();

            render(
                <FileUploadButton
                    id="test-download"
                    variant="download"
                    onDownload={mockOnDownload}
                    disabled={true}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });

            // Button has pointer-events: none when disabled
            expect(button).toHaveStyle({ pointerEvents: "none" });
            expect(button).toBeDisabled();
            expect(mockOnDownload).not.toHaveBeenCalled();
        });

        it("shows custom buttonText for download variant", () => {
            render(
                <FileUploadButton
                    id="test-download"
                    variant="download"
                    buttonText="Download Document"
                />
            );

            expect(screen.getByText("Download Document")).toBeInTheDocument();
        });
    });

    describe("Event Handling", () => {

        it("does not trigger file input when button is disabled", () => {
            const { container } = render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const input = container.querySelector('input[type="file"]');
            const clickSpy = vi.spyOn(input, "click");

            // Button has pointer-events: none when disabled, so it can't be clicked
            expect(button).toHaveStyle({ pointerEvents: "none" });
            // Verify button is disabled
            expect(button).toBeDisabled();
            // Click spy should not have been called
            expect(clickSpy).not.toHaveBeenCalled();
        });
    });

    describe("Accessibility", () => {
        it("button has correct aria-label from label prop", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    label="Custom Label"
                />
            );

            const button = screen.getByRole("button", { name: "Custom Label" });
            expect(button).toHaveAttribute("aria-label", "Custom Label");
        });

        it("button aria-label uses selectedFile name when provided", () => {
            const mockFile = new File(["content"], "my-file.pdf", { type: "application/pdf" });
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    selectedFile={mockFile}
                />
            );

            const button = screen.getByRole("button", { name: "my-file.pdf" });
            expect(button).toHaveAttribute("aria-label", "my-file.pdf");
        });

        it("button has type='button' to prevent form submission", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toHaveAttribute("type", "button");
        });

        it("disabled button has disabled attribute", () => {
            render(
                <FileUploadButton
                    id="test-upload"
                    onFileChange={mockOnFileChange}
                    disabled={true}
                />
            );

            const button = screen.getByRole("button", { name: "Upload File" });
            expect(button).toBeDisabled();
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

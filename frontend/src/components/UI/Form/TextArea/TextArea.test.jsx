import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TextArea from "./TextArea";

describe("TextArea Component", () => {
    const defaultProps = {
        name: "testTextArea",
        label: "Test TextArea",
        value: "",
        onChange: vi.fn(),
        maxLength: 750
    };

    it("renders with default props", () => {
        render(<TextArea {...defaultProps} />);

        expect(screen.getByText("Test TextArea")).toBeInTheDocument();
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        expect(screen.getByText("Maximum 750 characters")).toBeInTheDocument();
    });

    it("renders with custom hint message", () => {
        render(
            <TextArea
                {...defaultProps}
                hintMsg="Enter your description here"
            />
        );

        expect(screen.getByText("Enter your description here")).toBeInTheDocument();
        expect(screen.queryByText("Maximum 750 characters")).not.toBeInTheDocument();
    });

    it("renders with custom label", () => {
        render(
            <TextArea
                {...defaultProps}
                label="Custom Label"
            />
        );

        expect(screen.getByText("Custom Label")).toBeInTheDocument();
    });

    it("uses name as label when label is not provided", () => {
        // eslint-disable-next-line no-unused-vars
        const { label, ...propsWithoutLabel } = defaultProps;
        render(
            <TextArea
                {...propsWithoutLabel}
                name="myField"
            />
        );

        expect(screen.getByText("myField")).toBeInTheDocument();
    });

    it("calls onChange handler when text is entered", () => {
        const onChangeMock = vi.fn();
        render(
            <TextArea
                {...defaultProps}
                onChange={onChangeMock}
            />
        );

        const textarea = screen.getByRole("textbox");
        fireEvent.change(textarea, { target: { value: "Test input" } });

        expect(onChangeMock).toHaveBeenCalledWith("testTextArea", "Test input");
    });

    it("displays the provided value", () => {
        render(
            <TextArea
                {...defaultProps}
                value="Existing text"
            />
        );

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveValue("Existing text");
    });

    it("applies custom className", () => {
        const { container } = render(
            <TextArea
                {...defaultProps}
                className="custom-class"
            />
        );

        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        const formGroup = container.querySelector(".usa-form-group.custom-class");
        expect(formGroup).toBeInTheDocument();
    });

    it("applies pending class when pending is true", () => {
        const { container } = render(
            <TextArea
                {...defaultProps}
                pending={true}
            />
        );

        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        const formGroup = container.querySelector(".usa-form-group.pending");
        expect(formGroup).toBeInTheDocument();
    });

    it("applies custom textAreaStyle", () => {
        render(
            <TextArea
                {...defaultProps}
                textAreaStyle={{ height: "10rem" }}
            />
        );

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveStyle({ height: "10rem" });
    });

    it("applies default textAreaStyle when not provided", () => {
        render(<TextArea {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveStyle({ height: "8.5rem" });
    });

    it("disables fieldset when isDisabled is true", () => {
        const { container } = render(
            <TextArea
                {...defaultProps}
                isDisabled={true}
            />
        );

        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        const fieldset = container.querySelector("fieldset");
        expect(fieldset).toHaveAttribute("disabled");
    });

    it("does not disable fieldset when isDisabled is false", () => {
        const { container } = render(
            <TextArea
                {...defaultProps}
                isDisabled={false}
            />
        );

        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        const fieldset = container.querySelector("fieldset");
        expect(fieldset).not.toHaveAttribute("disabled");
    });

    it("displays error messages when provided", () => {
        render(
            <TextArea
                {...defaultProps}
                messages={["This field is required"]}
            />
        );

        expect(screen.getByText("This field is required")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("applies error styling when messages are present", () => {
        render(
            <TextArea
                {...defaultProps}
                messages={["This field is required"]}
            />
        );

        const textarea = screen.getByRole("textbox");
        const label = screen.getByText("Test TextArea");

        expect(textarea).toHaveClass("usa-input--error");
        expect(label).toHaveClass("usa-label--error");
    });

    it("displays only the first error message", () => {
        render(
            <TextArea
                {...defaultProps}
                messages={["First error", "Second error", "Third error"]}
            />
        );

        expect(screen.getByText("First error")).toBeInTheDocument();
        expect(screen.queryByText("Second error")).not.toBeInTheDocument();
        expect(screen.queryByText("Third error")).not.toBeInTheDocument();
    });

    it("shows hint message when no errors are present", () => {
        render(
            <TextArea
                {...defaultProps}
                hintMsg="Enter text here"
                messages={[]}
            />
        );

        expect(screen.getByText("Enter text here")).toBeInTheDocument();
    });

    it("hides hint message when errors are present", () => {
        render(
            <TextArea
                {...defaultProps}
                hintMsg="Enter text here"
                messages={["Error message"]}
            />
        );

        expect(screen.queryByText("Enter text here")).not.toBeInTheDocument();
        expect(screen.getByText("Error message")).toBeInTheDocument();
    });

    it("sets maxLength attribute on textarea", () => {
        render(
            <TextArea
                {...defaultProps}
                maxLength={500}
            />
        );

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveAttribute("maxLength", "500");
    });

    it("displays character count message with maxLength", () => {
        render(
            <TextArea
                {...defaultProps}
                maxLength={500}
            />
        );

        expect(screen.getByText("You can enter up to 500 characters")).toBeInTheDocument();
    });

    it("has correct aria-describedby attributes", () => {
        render(<TextArea {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveAttribute(
            "aria-describedby",
            "testTextArea-with-hint-textarea-info testTextArea-with-hint-textarea-hint"
        );
    });

    it("sets correct id and name attributes", () => {
        render(<TextArea {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveAttribute("id", "testTextArea");
        expect(textarea).toHaveAttribute("name", "testTextArea");
    });

    it("sets rows attribute to 5", () => {
        render(<TextArea {...defaultProps} />);

        const textarea = screen.getByRole("textbox");
        expect(textarea).toHaveAttribute("rows", "5");
    });

    it("has usa-character-count class on fieldset", () => {
        const { container } = render(<TextArea {...defaultProps} />);

        // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
        const fieldset = container.querySelector("fieldset");
        expect(fieldset).toHaveClass("usa-character-count");
        expect(fieldset).toHaveClass("usa-fieldset");
    });

    it("has usa-sr-only class on character count message", () => {
        render(<TextArea {...defaultProps} />);

        const srOnlyMessage = screen.getByText(/You can enter up to \d+ characters/);
        expect(srOnlyMessage).toHaveClass("usa-sr-only");
        expect(srOnlyMessage).toHaveClass("usa-character-count__message");
    });
});

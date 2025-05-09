import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Select from "./Select";

describe("Select Component", () => {
    const defaultProps = {
        name: "testSelect",
        label: "Test Select",
        value: "",
        onChange: vi.fn(),
        options: [
            { label: "Option A", value: "OPTION_A" },
            { label: "Option B", value: "OPTION_B" },
            { label: "Option C", value: "OPTION_C", disabled: true }
        ]
    };

    it("renders with default props", () => {
        render(<Select {...defaultProps} />);

        // Check if label is rendered
        expect(screen.getByText("Test Select")).toBeInTheDocument();

        // Check if default option is rendered
        expect(screen.getByText("-Select an option-")).toBeInTheDocument();

        // Check if all options are rendered
        expect(screen.getByText("Option A")).toBeInTheDocument();
        expect(screen.getByText("Option B")).toBeInTheDocument();
        expect(screen.getByText("Option C")).toBeInTheDocument();
    });

    it("calls onChange handler when an option is selected", () => {
        render(<Select {...defaultProps} />);

        const selectElement = screen.getByRole("combobox");
        fireEvent.change(selectElement, { target: { value: "OPTION_A" } });

        expect(defaultProps.onChange).toHaveBeenCalledWith("testSelect", "OPTION_A");
    });

    it("displays error messages when provided", () => {
        const propsWithError = {
            ...defaultProps,
            messages: ["This field is required"]
        };

        render(<Select {...propsWithError} />);

        expect(screen.getByText("This field is required")).toBeInTheDocument();

        // Use hasClass helper for testing classes
        expect(screen.getByRole("combobox")).toHaveClass("usa-input--error");
        expect(screen.getByText("Test Select")).toHaveClass("usa-label--error");
    });

    it("applies pending class when pending is true", () => {
        render(
            <Select
                {...defaultProps}
                pending={true}
            />
        );

        // Get the fieldset by its class instead of using closest()
        expect(screen.getByTestId("select-fieldset")).toHaveClass("pending");
    });

    it("applies custom className when provided", () => {
        render(
            <Select
                {...defaultProps}
                className="custom-class"
            />
        );

        expect(screen.getByTestId("select-fieldset")).toHaveClass("custom-class");
    });

    it("shows 'Required' helper text when isRequired is true", () => {
        render(
            <Select
                {...defaultProps}
                isRequired={true}
            />
        );

        expect(screen.getByText("Required Information*")).toBeInTheDocument();
    });

    it("does not show 'Required' helper text when isRequiredNoShow is true", () => {
        render(
            <Select
                {...defaultProps}
                isRequired={true}
                isRequiredNoShow={true}
            />
        );

        expect(screen.queryByText("Required")).not.toBeInTheDocument();
    });

    it("marks the select as required when isRequired is true", () => {
        render(
            <Select
                {...defaultProps}
                isRequired={true}
            />
        );

        expect(screen.getByRole("combobox")).toHaveAttribute("required");
    });

    it("renders disabled options correctly", () => {
        render(<Select {...defaultProps} />);

        const selectElement = screen.getByRole("combobox");
        const options = within(selectElement).getAllByRole("option");

        // Option C is at index 3 (after default option)
        expect(options[3]).toHaveAttribute("disabled");
    });

    it("renders with custom default option text", () => {
        render(
            <Select
                {...defaultProps}
                defaultOption="-- Choose an option --"
            />
        );

        expect(screen.getByText("-- Choose an option --")).toBeInTheDocument();
    });
});

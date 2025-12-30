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

    describe("Disabled Select with Tooltip", () => {
        it("disables the fieldset when isDisabled is true", () => {
            render(
                <Select
                    {...defaultProps}
                    isDisabled={true}
                />
            );

            const fieldset = screen.getByTestId("select-fieldset");
            expect(fieldset).toHaveAttribute("disabled");
        });

        it("disables the select element when isDisabled is true", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                />
            );

            const selectElement = screen.getByRole("combobox");
            expect(selectElement).toBeDisabled();
        });

        it("sets tooltip position to right when isDisabled is true", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="Tooltip message"
                />
            );

            const selectElement = screen.getByRole("combobox");
            expect(selectElement).toHaveAttribute("data-position", "right");
        });

        it("shows only the current value when disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="This field cannot be edited"
                />
            );

            const selectElement = screen.getByRole("combobox");
            const options = within(selectElement).getAllByRole("option");

            // When disabled, only one option is rendered (the current value)
            expect(options).toHaveLength(1);
            expect(options[0]).toHaveValue("OPTION_A");
            expect(options[0]).toHaveTextContent("OPTION_A");
        });

        it("does not render all options when disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="This field cannot be edited"
                />
            );

            // Option B and Option C should not be present when disabled
            expect(screen.queryByText("Option B")).not.toBeInTheDocument();
            expect(screen.queryByText("Option C")).not.toBeInTheDocument();
        });

        it("does not call onChange when disabled select is clicked", () => {
            const onChangeMock = vi.fn();
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="This field cannot be edited"
                    onChange={onChangeMock}
                />
            );

            const selectElement = screen.getByRole("combobox");
            fireEvent.change(selectElement, { target: { value: "OPTION_B" } });

            // onChange should not be called because the select is disabled
            expect(onChangeMock).not.toHaveBeenCalled();
        });

        it("applies width-mobile-lg class when disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="This field cannot be edited"
                />
            );

            const selectElement = screen.getByRole("combobox");
            expect(selectElement).toHaveClass("width-mobile-lg");
        });

        it("applies error styling even when disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    value="OPTION_A"
                    isDisabled={true}
                    tooltipMsg="This field cannot be edited"
                    messages={["This field has an error"]}
                />
            );

            const selectElement = screen.getByRole("combobox");
            expect(selectElement).toHaveClass("usa-input--error");
            expect(screen.getByText("This field has an error")).toBeInTheDocument();
        });
    });

    describe("Enabled Select (not disabled)", () => {
        it("does not have width-mobile-lg class when not disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    isDisabled={false}
                />
            );

            const selectElement = screen.getByRole("combobox");
            expect(selectElement).not.toHaveClass("width-mobile-lg");
        });

        it("does not wrap select in tooltip when not disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    isDisabled={false}
                />
            );

            const selectElement = screen.getByRole("combobox");
            // When not disabled, select should not have usa-tooltip class
            expect(selectElement).not.toHaveClass("usa-tooltip");
            expect(selectElement).not.toHaveAttribute("title");
        });

        it("renders all options when not disabled", () => {
            render(
                <Select
                    {...defaultProps}
                    isDisabled={false}
                />
            );

            const selectElement = screen.getByRole("combobox");
            const options = within(selectElement).getAllByRole("option");

            // Should have default option + 3 provided options = 4 total
            expect(options).toHaveLength(4);
            expect(screen.getByText("-Select an option-")).toBeInTheDocument();
            expect(screen.getByText("Option A")).toBeInTheDocument();
            expect(screen.getByText("Option B")).toBeInTheDocument();
            expect(screen.getByText("Option C")).toBeInTheDocument();
        });
    });
});

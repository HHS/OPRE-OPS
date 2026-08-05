import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import GrantNumberForm from "./GrantNumberForm";

const mockFn = vi.fn();

describe("GrantNumberForm", () => {
    const defaultProps = {
        formData: { number: 0, mode: "add" },
        setFormData: mockFn,
        handleSubmit: mockFn,
        handleCancel: mockFn,
        grantNumbersNumbers: [],
        isEditMode: false,
        formKey: "test-key"
    };

    test("renders the Grant Number select and period of performance fields", () => {
        render(<GrantNumberForm {...defaultProps} />);

        expect(screen.getByLabelText("Grant Number")).toBeInTheDocument();
        expect(screen.getAllByLabelText("Period of Performance-Start").length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText("Period of Performance-End").length).toBeGreaterThan(0);
        expect(screen.getByText("Placeholder grant # until award")).toBeInTheDocument();
    });

    test("renders the description field with a 150 character maximum", () => {
        render(<GrantNumberForm {...defaultProps} />);

        const description = screen.getByLabelText("Description");
        expect(description).toHaveAttribute("maxLength", "150");
    });

    test("shows the Add Grant Number button when in add mode", () => {
        render(<GrantNumberForm {...defaultProps} />);

        expect(screen.getByText("Create Grant Numbers")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add Grant Number/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Update Grant Number/i })).not.toBeInTheDocument();
    });

    test("shows the Update Grant Number button when the form data is in edit mode", () => {
        render(
            <GrantNumberForm
                {...defaultProps}
                formData={{ number: 1, mode: "edit" }}
            />
        );

        expect(screen.getByRole("button", { name: /Update Grant Number/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Add Grant Number/i })).not.toBeInTheDocument();
    });

    test("shows the Edit Grant Numbers heading when isEditMode is true", () => {
        render(
            <GrantNumberForm
                {...defaultProps}
                isEditMode={true}
            />
        );

        expect(screen.getByText("Edit Grant Numbers")).toBeInTheDocument();
    });

    test("disables already-used grant numbers in the select options", () => {
        render(
            <GrantNumberForm
                {...defaultProps}
                grantNumbersNumbers={[1, 2]}
            />
        );

        expect(screen.getByRole("option", { name: "Grant 1" })).toBeDisabled();
        expect(screen.getByRole("option", { name: "Grant 2" })).toBeDisabled();
        expect(screen.getByRole("option", { name: "Grant 3" })).not.toBeDisabled();
    });

    test("shows unsaved changes indicator when hasUnsavedChanges is true and not in agreement workflow", () => {
        render(
            <GrantNumberForm
                {...defaultProps}
                hasUnsavedChanges={true}
                workflow="none"
            />
        );

        expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    });

    test("does not show unsaved changes indicator during the agreement wizard workflow", () => {
        render(
            <GrantNumberForm
                {...defaultProps}
                hasUnsavedChanges={true}
                workflow="agreement"
            />
        );

        expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
    });
});

import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import ServicesComponentForm from "./ServicesComponentForm";

// Mock the SERVICE_REQ_TYPES and options
const mockFn = vi.fn();
const LOCKED_MESSAGE = "Services components cannot be edited on awarded agreements";

describe("ServicesComponentForm", () => {
    const defaultProps = {
        serviceTypeReq: "SEVERABLE",
        formData: {},
        setFormData: mockFn,
        handleSubmit: mockFn,
        handleCancel: mockFn,
        servicesComponentsNumbers: [],
        isEditMode: false,
        formKey: "test-key"
    };

    test("renders error message when serviceTypeReq is null", () => {
        render(
            <ServicesComponentForm
                {...defaultProps}
                serviceTypeReq={null}
            />
        );

        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toBeInTheDocument();
        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toHaveClass("text-error");
    });

    test("renders error message when serviceTypeReq is undefined", () => {
        render(
            <ServicesComponentForm
                {...defaultProps}
                serviceTypeReq={undefined}
            />
        );

        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toBeInTheDocument();
        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toHaveClass("text-error");
    });

    test("renders error message when serviceTypeReq is empty string", () => {
        render(
            <ServicesComponentForm
                {...defaultProps}
                serviceTypeReq=""
            />
        );

        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toBeInTheDocument();
        expect(screen.getByText("Please add a Service Requirement Type to the Agreement.")).toHaveClass("text-error");
    });

    test("renders form when serviceTypeReq is provided", () => {
        render(
            <ServicesComponentForm
                {...defaultProps}
                serviceTypeReq="SEVERABLE"
            />
        );

        // Should not show error message
        expect(screen.queryByText("Please add a Service Requirement Type to the Agreement.")).not.toBeInTheDocument();
    });

    test("renders form when serviceTypeReq is NON_SEVERABLE", () => {
        render(
            <ServicesComponentForm
                {...defaultProps}
                serviceTypeReq="NON_SEVERABLE"
            />
        );

        // Should not show error message
        expect(screen.queryByText("Please add a Service Requirement Type to the Agreement.")).not.toBeInTheDocument();
    });

    describe("moving focus into the form when an SC is loaded for editing (OPS-3268)", () => {
        const savedSc = { id: 7, number: 2, optional: false, mode: "edit", created_on: "2043-01-01T00:00:00Z" };

        test("focuses the first field that can be changed", () => {
            render(
                <ServicesComponentForm
                    {...defaultProps}
                    isEditMode={true}
                    formData={savedSc}
                />
            );

            expect(screen.getByRole("combobox", { name: "Services Component" })).toHaveFocus();
        });

        test("skips a locked number and focuses the period of performance instead", () => {
            render(
                <ServicesComponentForm
                    {...defaultProps}
                    serviceTypeReq="NON_SEVERABLE"
                    isEditMode={true}
                    formData={savedSc}
                    locksServicesComponentNumbers={true}
                />
            );

            // The visible date input (USWDS also keeps a hidden one with the same label).
            expect(screen.getByRole("textbox", { name: /Period of Performance-Start/ })).toHaveFocus();
        });

        test("leaves focus alone when the form is empty (adding an SC)", () => {
            render(<ServicesComponentForm {...defaultProps} />);

            expect(document.body).toHaveFocus();
        });
    });

    describe("SC number lock on an Awarded agreement (OPS-3268)", () => {
        const savedSc = { id: 7, number: 2, optional: false, mode: "edit", created_on: "2043-01-01T00:00:00Z" };
        const renderForm = (props) =>
            render(
                <ServicesComponentForm
                    {...defaultProps}
                    serviceTypeReq="NON_SEVERABLE"
                    isEditMode={true}
                    {...props}
                />
            );

        test("disables the number and Optional controls for a saved SC, and says why", () => {
            renderForm({ formData: savedSc, locksServicesComponentNumbers: true });

            expect(screen.getByRole("combobox", { name: "Services Component" })).toBeDisabled();
            expect(screen.getByRole("combobox", { name: "Services Component" })).toHaveDisplayValue("SC2");
            // As wide as the enabled select, not the shared disabled Select's fixed width.
            expect(screen.getByRole("combobox", { name: "Services Component" })).not.toHaveClass("width-mobile-lg");
            expect(screen.getByRole("checkbox", { name: "Optional Services Component" })).toBeDisabled();
            // Like the app's other locked fields: a tooltip (no hint), capped so it wraps, and
            // read as the select's description.
            const select = screen.getByRole("combobox", { name: "Services Component" });
            expect(select).toHaveAccessibleDescription(LOCKED_MESSAGE);
            expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass("width-mobile-lg", "text-wrap");
            // Only the tooltip carries the message: no visible hint repeats it.
            expect(screen.getAllByText(LOCKED_MESSAGE)).toEqual([screen.getByRole("tooltip", { hidden: true })]);
        });

        test("keeps the period of performance editable", () => {
            renderForm({ formData: savedSc, locksServicesComponentNumbers: true });

            for (const input of [
                ...screen.getAllByLabelText(/Period of Performance-Start/),
                ...screen.getAllByLabelText(/Period of Performance-End/)
            ]) {
                expect(input).toBeEnabled();
            }
        });

        test("leaves the number editable when not locked (pre-award or superuser)", () => {
            renderForm({ formData: savedSc, locksServicesComponentNumbers: false });

            expect(screen.getByRole("combobox", { name: "Services Component" })).toBeEnabled();
            expect(screen.getByRole("checkbox", { name: "Optional Services Component" })).toBeEnabled();
        });

        test("leaves the number editable for an SC added in this session (not saved yet)", () => {
            const { created_on, ...unsavedSc } = savedSc; // eslint-disable-line no-unused-vars
            renderForm({ formData: unsavedSc, locksServicesComponentNumbers: true });

            expect(screen.getByRole("combobox", { name: "Services Component" })).toBeEnabled();
        });
    });
});

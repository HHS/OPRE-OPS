import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import ServicesComponentForm from "./ServicesComponentForm";

// Mock the SERVICE_REQ_TYPES and options
const mockFn = vi.fn();

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
            expect(screen.getByRole("checkbox", { name: "Optional Services Component" })).toBeDisabled();
            expect(screen.getByRole("checkbox", { name: "Optional Services Component" })).toHaveAccessibleDescription(
                "The Services Component number and Optional setting can't be changed after the agreement is awarded."
            );
            // Shown as the field's hint (and its tooltip).
            expect(
                screen.getAllByText(
                    "The Services Component number and Optional setting can't be changed after the agreement is awarded."
                ).length
            ).toBeGreaterThan(0);
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

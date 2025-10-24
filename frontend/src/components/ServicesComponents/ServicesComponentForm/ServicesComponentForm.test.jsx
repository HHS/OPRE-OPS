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
});

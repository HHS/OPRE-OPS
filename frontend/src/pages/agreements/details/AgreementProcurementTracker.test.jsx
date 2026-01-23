import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import AgreementProcurementTracker from "./AgreementProcurementTracker";

// Mock the API hook
vi.mock("../../../api/opsAPI", () => ({
    useGetProcurementTrackersByAgreementIdQuery: vi.fn()
}));

// Mock DebugCode component
vi.mock("../../../components/DebugCode", () => ({
    default: () => <div data-testid="debug-code">Debug Code</div>
}));

// Mock StepIndicator component
vi.mock("../../../components/UI/StepIndicator", () => ({
    default: ({ steps, currentStep }) => (
        <div data-testid="step-indicator">
            Step {currentStep} of {steps.length}
        </div>
    )
}));

// Mock constants module
vi.mock("../../../constants", () => ({
    IS_PROCUREMENT_TRACKER_READY: true
}));

import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";

describe("AgreementProcurementTracker", () => {
    const mockAgreement = {
        id: 13,
        name: "Test Agreement"
    };

    const mockTrackerData = {
        data: [
            {
                id: 4,
                agreement_id: 13,
                display_name: "ProcurementTracker#4",
                status: "ACTIVE",
                tracker_type: "DEFAULT",
                active_step_number: 4,
                created_on: "2024-01-18T08:00:00.000Z",
                updated_on: "2024-01-23T10:30:00.000Z"
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset console.log mock
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    it("renders loading state", () => {
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("Loading procurement tracker...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("Error loading procurement tracker data")).toBeInTheDocument();
    });

    // Note: The feature flag test (IS_PROCUREMENT_TRACKER_READY) is tested via E2E tests
    // since it's a module-level constant that's difficult to mock properly in unit tests

    it("renders no active tracker message when no active tracker found", () => {
        const inactiveTrackerData = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "INACTIVE",
                    active_step_number: 1
                }
            ]
        };

        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: inactiveTrackerData,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("No active Procurement Tracker found.")).toBeInTheDocument();
    });

    it("renders procurement tracker with step indicator when data is available", () => {
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: mockTrackerData,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("Procurement Tracker")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Follow the steps below to complete the procurement process for Budget Lines in Executing Status."
            )
        ).toBeInTheDocument();
        expect(screen.getByTestId("step-indicator")).toBeInTheDocument();
        expect(screen.getByText("Step 4 of 6")).toBeInTheDocument();
    });

    it("defaults to step 0 when active_step_number is not provided", () => {
        const trackerWithoutStep = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "ACTIVE",
                    active_step_number: null
                }
            ]
        };

        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: trackerWithoutStep,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("Step 0 of 6")).toBeInTheDocument();
    });

    it("skips API query when agreement ID is not provided", () => {
        const mockQueryFn = vi.fn().mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false
        });
        useGetProcurementTrackersByAgreementIdQuery.mockImplementation(mockQueryFn);

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={{ id: null }} />
            </Provider>
        );

        expect(mockQueryFn).toHaveBeenCalledWith(null, {
            skip: true,
            refetchOnMountOrArgChange: true
        });
    });

    it("renders empty tracker array message", () => {
        const emptyTrackerData = {
            data: []
        };

        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: emptyTrackerData,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByText("No active Procurement Tracker found.")).toBeInTheDocument();
    });

    it("renders debug code component when active tracker exists", () => {
        useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
            data: mockTrackerData,
            isLoading: false,
            isError: false
        });

        render(
            <Provider store={setupStore()}>
                <AgreementProcurementTracker agreement={mockAgreement} />
            </Provider>
        );

        expect(screen.getByTestId("debug-code")).toBeInTheDocument();
    });
});

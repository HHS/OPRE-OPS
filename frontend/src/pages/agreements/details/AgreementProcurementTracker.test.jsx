import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import AgreementProcurementTracker from "./AgreementProcurementTracker";

// Mock the API hooks
vi.mock("../../../api/opsAPI", () => ({
    useGetProcurementTrackersByAgreementIdQuery: vi.fn(),
    useUpdateProcurementTrackerStepMutation: vi.fn(),
    useGetUsersQuery: vi.fn()
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

// Mock Accordion component
vi.mock("../../../components/UI/Accordion", () => ({
    default: ({ heading, children, isClosed }) => (
        <div data-testid="accordion">
            <div data-testid="accordion-heading">{heading}</div>
            {!isClosed && <div data-testid="accordion-content">{children}</div>}
        </div>
    )
}));

// Mock UsersComboBox component
vi.mock("../../../components/Agreements/UsersComboBox", () => ({
    default: ({ label, setSelectedUser, isDisabled }) => (
        <div data-testid="users-combobox">
            <label>{label}</label>
            <button
                disabled={isDisabled}
                onClick={() => setSelectedUser({ id: 1, full_name: "Test User" })}
            >
                Select User
            </button>
        </div>
    )
}));

// Mock TextArea component
vi.mock("../../../components/UI/Form/TextArea", () => ({
    default: ({ name, label, value, onChange, isDisabled }) => (
        <div data-testid="textarea">
            <label>{label}</label>
            <textarea
                data-testid="textarea-input"
                name={name}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={isDisabled}
            />
        </div>
    )
}));

// Mock DatePicker component
vi.mock("../../../components/UI/USWDS/DatePicker", () => ({
    default: ({ label, value, onChange, isDisabled }) => (
        <div data-testid="datepicker">
            <label>{label}</label>
            <input
                data-testid="datepicker-input"
                type="text"
                value={value}
                onChange={onChange}
                disabled={isDisabled}
            />
        </div>
    )
}));

// Mock constants module
vi.mock("../../../constants", () => ({
    IS_PROCUREMENT_TRACKER_READY: true
}));

// Mock user hooks
vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

// Mock formatDateToMonthDayYear helper
vi.mock("../../../helpers/utils", () => ({
    formatDateToMonthDayYear: vi.fn((date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }),
    formatDateForApi: vi.fn((date) => date)
}));

// Mock Tag component
vi.mock("../../../components/UI/Tag", () => ({
    default: ({ text, tagStyle }) => (
        <span
            data-testid="tag"
            data-tag-style={tagStyle}
        >
            {text}
        </span>
    )
}));

import {
    useGetProcurementTrackersByAgreementIdQuery,
    useUpdateProcurementTrackerStepMutation,
    useGetUsersQuery
} from "../../../api/opsAPI";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";

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
                updated_on: "2024-01-23T10:30:00.000Z",
                steps: []
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset console.log mock
        vi.spyOn(console, "log").mockImplementation(() => {});
        // Mock the mutation hook with default implementation
        useUpdateProcurementTrackerStepMutation.mockReturnValue([
            vi.fn().mockReturnValue({
                unwrap: vi.fn().mockResolvedValue({ data: {} })
            }),
            { isLoading: false }
        ]);
        // Mock the users query with default implementation
        useGetUsersQuery.mockReturnValue({
            data: [{ id: 1, full_name: "Test User", email: "test@example.com" }],
            isLoading: false,
            error: undefined
        });
        // Mock useGetUserFullNameFromId
        useGetUserFullNameFromId.mockReturnValue("Test User");
    });

    afterEach(() => {
        if (console.log.mockRestore) {
            console.log.mockRestore();
        }
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
                    active_step_number: null,
                    steps: []
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

    describe("Accordion and Step 1 Functionality", () => {
        const mockTrackerWithSteps = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    display_name: "ProcurementTracker#4",
                    status: "ACTIVE",
                    tracker_type: "DEFAULT",
                    active_step_number: 1,
                    steps: [
                        {
                            id: 101,
                            step_number: 1,
                            step_type: "Pre-Solicitation",
                            status: "PENDING"
                        },
                        {
                            id: 102,
                            step_number: 2,
                            step_type: "Solicitation",
                            status: "PENDING"
                        }
                    ]
                }
            ]
        };

        let consoleLogSpy;

        beforeEach(() => {
            // Mock the mutation hook
            useUpdateProcurementTrackerStepMutation.mockReturnValue([
                vi.fn().mockResolvedValue({ data: {} }),
                { isLoading: false }
            ]);
            // Mock the users query for UsersComboBox
            useGetUsersQuery.mockReturnValue({
                data: [{ id: 1, full_name: "Test User", email: "test@example.com" }],
                isLoading: false,
                error: undefined
            });
            // Mock console.log
            consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        });

        afterEach(() => {
            if (consoleLogSpy) {
                consoleLogSpy.mockRestore();
            }
        });

        it("renders accordions for each step", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const accordions = screen.getAllByTestId("accordion");
            expect(accordions).toHaveLength(2);
        });

        it("renders accordion with correct heading for step 1", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const heading = screen.getByText(/Step 1 of 2 Pre-Solicitation/);
            expect(heading).toBeInTheDocument();
        });

        it("renders step 1 content when accordion is open", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(
                screen.getByText(/Once the pre-solicitation package is sufficiently drafted and signed by all parties/)
            ).toBeInTheDocument();
            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("datepicker")).toBeInTheDocument();
            expect(screen.getByTestId("textarea")).toBeInTheDocument();
        });

        it("renders step 1 checkbox with correct label", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toHaveAttribute("id", "step-1-checkbox");
            expect(
                screen.getByText(/The pre-solicitation package has been sent to the Procurement Shop/)
            ).toBeInTheDocument();
        });

        it("disables UsersComboBox when checkbox is not checked", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();

            const userSelectButton = screen.getByText("Select User");
            expect(userSelectButton).toBeDisabled();
        });

        it("enables UsersComboBox when checkbox is checked", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(checkbox).toBeChecked();

            const userSelectButton = screen.getByText("Select User");
            expect(userSelectButton).not.toBeDisabled();
        });

        it("enables DatePicker when checkbox is checked", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            const { rerender } = render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            const dateInput = screen.getByTestId("datepicker-input");

            expect(dateInput).toBeDisabled();

            fireEvent.click(checkbox);

            // Force a re-render to pick up state changes
            rerender(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            // After clicking checkbox, date picker should be enabled
            const dateInputAfter = screen.getByTestId("datepicker-input");
            expect(dateInputAfter).not.toBeDisabled();
        });

        it("enables TextArea when checkbox is checked", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            const { rerender } = render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            const textarea = screen.getByTestId("textarea-input");

            expect(textarea).toBeDisabled();

            fireEvent.click(checkbox);

            // Force a re-render to pick up state changes
            rerender(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            // After clicking checkbox, textarea should be enabled
            const textareaAfter = screen.getByTestId("textarea-input");
            expect(textareaAfter).not.toBeDisabled();
        });

        it("renders Cancel and Complete Step 1 buttons", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Cancel")).toBeInTheDocument();
            expect(screen.getByText("Complete Step 1")).toBeInTheDocument();
        });

        it("calls handleStep1Complete when Complete Step 1 button is clicked", async () => {
            const mockPatchStepOne = vi.fn().mockReturnValue({
                unwrap: vi.fn().mockResolvedValue({ data: {} })
            });

            useUpdateProcurementTrackerStepMutation.mockReturnValue([mockPatchStepOne, { isLoading: false }]);

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            // Enable the form by checking the checkbox first
            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            // Select a user
            const userSelectButton = screen.getByText("Select User");
            fireEvent.click(userSelectButton);

            // Set date
            const dateInput = screen.getByTestId("datepicker-input");
            fireEvent.change(dateInput, { target: { value: "2024-01-15" } });

            // Now click complete button
            const completeButton = screen.getByText("Complete Step 1");
            fireEvent.click(completeButton);

            await waitFor(() => {
                expect(mockPatchStepOne).toHaveBeenCalledWith({
                    stepId: 101,
                    data: expect.objectContaining({
                        status: "COMPLETED"
                    })
                });
            });
        });

        it("only renders step 1 content inside step 1 accordion", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            // Step 1 content should be present (accordion is open for active step)
            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();

            // Step 2 accordion heading should exist but content should be closed
            expect(screen.getByText(/Step 2 of 2 Solicitation/)).toBeInTheDocument();
        });

        it("renders UsersComboBox with correct label", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
        });

        it("renders DatePicker with correct label and hint", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
        });

        it("renders TextArea with correct label", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
        });

        it("calls cancelStep1 when Cancel button is clicked", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            // Select a user
            const userSelectButton = screen.getByText("Select User");
            fireEvent.click(userSelectButton);

            // Set date
            const dateInput = screen.getByTestId("datepicker-input");
            fireEvent.change(dateInput, { target: { value: "2024-01-15" } });

            // Set notes
            const textarea = screen.getByTestId("textarea-input");
            fireEvent.change(textarea, { target: { value: "Test notes" } });

            // Click cancel
            const cancelButton = screen.getByText("Cancel");
            fireEvent.click(cancelButton);

            // Verify form is reset
            expect(checkbox).not.toBeChecked();
        });

        it("disables Complete Step 1 button when required fields are missing", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const completeButton = screen.getByText("Complete Step 1");
            expect(completeButton).toBeDisabled();
        });
    });

    describe("Step 1 Completed State", () => {
        const mockTrackerWithCompletedStep = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    display_name: "ProcurementTracker#4",
                    status: "ACTIVE",
                    tracker_type: "DEFAULT",
                    active_step_number: 1,
                    steps: [
                        {
                            id: 101,
                            step_number: 1,
                            step_type: "Pre-Solicitation",
                            status: "COMPLETED",
                            task_completed_by: 5,
                            date_completed: "2024-01-15T00:00:00.000Z",
                            notes: "Pre-solicitation package sent successfully"
                        },
                        {
                            id: 102,
                            step_number: 2,
                            step_type: "Solicitation",
                            status: "PENDING"
                        }
                    ]
                }
            ]
        };

        beforeEach(() => {
            useGetUserFullNameFromId.mockReturnValue("John Doe");
        });

        it("renders completed state for step 1", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(
                screen.getByText(/When the pre-solicitation package has been sufficiently drafted and signed/)
            ).toBeInTheDocument();
            expect(
                screen.getByText("The pre-solicitation package has been sent to the Procurement Shop for review")
            ).toBeInTheDocument();
        });

        it("renders Completed By tag with user name", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Completed By")).toBeInTheDocument();
            const tags = screen.getAllByTestId("tag");
            expect(tags.some((tag) => tag.textContent === "John Doe")).toBe(true);
        });

        it("renders Date Completed tag with formatted date", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            const tags = screen.getAllByTestId("tag");
            // The date should be formatted by formatDateToMonthDayYear
            expect(
                tags.some((tag) => tag.textContent.includes("January") || tag.textContent.includes("2024"))
            ).toBe(true);
        });

        it("renders Notes in completed state", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Notes")).toBeInTheDocument();
            expect(screen.getByText("Pre-solicitation package sent successfully")).toBeInTheDocument();
        });

        it("does not render form elements in completed state", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("datepicker")).not.toBeInTheDocument();
            expect(screen.queryByTestId("textarea")).not.toBeInTheDocument();
            expect(screen.queryByText("Complete Step 1")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
        });

        it("renders tags with correct styling", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithCompletedStep,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const tags = screen.getAllByTestId("tag");
            tags.forEach((tag) => {
                expect(tag).toHaveAttribute("data-tag-style", "primaryDarkTextLightBackground");
            });
        });
    });
});

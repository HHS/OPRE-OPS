import React from "react";
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
    default: function MockAccordion({ heading, children, isClosed }) {
        const [isOpen, setIsOpen] = React.useState(!isClosed);

        return (
            <div data-testid="accordion">
                <button
                    type="button"
                    data-testid="accordion-heading"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((previous) => !previous)}
                >
                    {heading}
                </button>
                {isOpen && <div data-testid="accordion-content">{children}</div>}
            </div>
        );
    }
}));

// Mock UsersComboBox component
vi.mock("../../../components/Agreements/UsersComboBox", () => ({
    default: ({ label, setSelectedUser, isDisabled, users }) => (
        <div
            data-testid="users-combobox"
            data-users-count={users?.length || 0}
        >
            <label>{label}</label>
            <button
                disabled={isDisabled}
                onClick={() => setSelectedUser({ id: 1, full_name: "Test User" })}
            >
                Select User
            </button>
            {users?.map((user) => (
                <div
                    key={user.id}
                    data-testid={`user-option-${user.id}`}
                >
                    {user.full_name}
                </div>
            ))}
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

vi.mock("../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepTwo", () => ({
    default: ({ stepStatus, stepTwoData }) => (
        <div
            data-testid="procurement-step-two"
            data-step-status={stepStatus}
            data-step-data-id={stepTwoData?.id}
        >
            {stepStatus === "COMPLETED" ? "Step Two Completed" : "Step Two Form"}
        </div>
    )
}));

// Mock constants module
vi.mock("../../../constants", () => ({
    IS_PROCUREMENT_TRACKER_READY_MAP: {
        STEP_1: true,
        STEP_2: true,
        STEP_3: false,
        STEP_4: false,
        STEP_5: false,
        STEP_6: false
    }
}));

// Mock user hooks
vi.mock("../../../hooks/user.hooks", () => ({
    default: vi.fn()
}));

// Mock formatDateToMonthDayYear helper
vi.mock("../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        formatDateToMonthDayYear: vi.fn((date) => {
            if (!date) return "";
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        }),
        formatDateForApi: vi.fn((date) => date),
        getLocalISODate: vi.fn(() => "2024-01-30")
    };
});

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
        name: "Test Agreement",
        authorized_user_ids: [1, 2, 3]
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

    // Note: step availability flags are validated in E2E tests.
    // since it's a module-level constant that's difficult to mock properly in unit tests

    it("renders procurement tracker with default steps when no active tracker found", () => {
        const inactiveTrackerData = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "INACTIVE",
                    active_step_number: 1,
                    steps: []
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

        // Should render the tracker UI
        expect(screen.getByText("Procurement Tracker")).toBeInTheDocument();
        expect(screen.getByTestId("step-indicator")).toBeInTheDocument();

        // Should render accordions with default steps
        const accordions = screen.getAllByTestId("accordion");
        expect(accordions).toHaveLength(6); // All 6 wizard steps

        // Should render step 1 heading
        const stepOneHeading = screen.getByTestId("step-builder-heading-default-step-1");
        expect(stepOneHeading).toHaveTextContent(/1\s+of\s+6\s+Acquisition Planning/);
        expect(stepOneHeading).toHaveClass("step-builder-accordion__heading--read-only");
    });

    it("disables step 1 form controls for inactive tracker after expanding accordion", () => {
        const inactiveTrackerData = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "INACTIVE",
                    active_step_number: 1,
                    steps: []
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

        const firstAccordionHeading = screen.getAllByTestId("accordion-heading")[0];
        if (firstAccordionHeading.getAttribute("aria-expanded") === "false") {
            fireEvent.click(firstAccordionHeading);
        }

        expect(screen.getByRole("checkbox")).toBeDisabled();
        expect(screen.getByText("Select User")).toBeDisabled();
        expect(screen.getByTestId("datepicker-input")).toBeDisabled();
        expect(screen.getByTestId("textarea-input")).toBeDisabled();
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

    it("defaults to step 1 when active_step_number is not provided", () => {
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

        expect(screen.getByText("Step 1 of 6")).toBeInTheDocument();
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

    it("renders procurement tracker with default steps when tracker array is empty", () => {
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

        // Should render the tracker UI
        expect(screen.getByText("Procurement Tracker")).toBeInTheDocument();
        expect(screen.getByTestId("step-indicator")).toBeInTheDocument();

        // Should render accordions with default steps
        const accordions = screen.getAllByTestId("accordion");
        expect(accordions).toHaveLength(6); // All 6 wizard steps
    });

    it("renders with default step 0 in indicator when there is no active tracker", () => {
        const inactiveTrackerData = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "INACTIVE",
                    active_step_number: 1,
                    steps: []
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

        // StepIndicator should not show an active/current step for read-only no-active-tracker mode
        expect(screen.getByText("Step 0 of 6")).toBeInTheDocument();

        // All accordions should render with default steps
        const accordions = screen.getAllByTestId("accordion");
        expect(accordions).toHaveLength(6);
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

            const heading = screen.getByTestId("step-builder-heading-101");
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent(/1\s+of\s+6\s+Pre-Solicitation/);
        });

        it("renders steps sorted ascending by step_number", () => {
            const outOfOrderSteps = {
                data: [
                    {
                        id: 4,
                        agreement_id: 13,
                        status: "ACTIVE",
                        active_step_number: 2,
                        steps: [
                            {
                                id: 102,
                                step_number: 2,
                                step_type: "SOLICITATION",
                                status: "ACTIVE"
                            },
                            {
                                id: 101,
                                step_number: 1,
                                step_type: "PRE_SOLICITATION",
                                status: "COMPLETED"
                            }
                        ]
                    }
                ]
            };

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: outOfOrderSteps,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            const headings = screen.getAllByTestId("accordion-heading");
            expect(headings[0]).toHaveTextContent(/1\s+of\s+6\s+Pre Solicitation/);
            expect(headings[1]).toHaveTextContent(/2\s+of\s+6\s+Solicitation/);
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

            // Set date (MM/DD/YYYY format expected by validation)
            const dateInput = screen.getByTestId("datepicker-input");
            fireEvent.change(dateInput, { target: { value: "01/15/2024" } });

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
            expect(screen.getByTestId("step-builder-heading-102")).toBeInTheDocument();
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

        it("renders step 2 content when step 2 is active", () => {
            const mockTrackerWithActiveStepTwo = {
                data: [
                    {
                        id: 4,
                        agreement_id: 13,
                        display_name: "ProcurementTracker#4",
                        status: "ACTIVE",
                        tracker_type: "DEFAULT",
                        active_step_number: 2,
                        steps: [
                            {
                                id: 101,
                                step_number: 1,
                                step_type: "ACQUISITION_PLANNING",
                                status: "COMPLETED"
                            },
                            {
                                id: 102,
                                step_number: 2,
                                step_type: "PRE_SOLICITATION",
                                status: "ACTIVE"
                            }
                        ]
                    }
                ]
            };

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithActiveStepTwo,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByTestId("procurement-step-two")).toHaveTextContent("Step Two Form");
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        });

        it.each([
            [3, "SOLICITATION", /Once the Procurement Shop has posted the Solicitation and it’s “on the street”/],
            [4, "EVALUATION", /Complete the technical evaluations and any potential negotiations/],
            [5, "PRE_AWARD", /All agreements need Pre-Award Approval before the Final Consensus Memo/],
            [6, "AWARD", /Once you receive the signed award, click Request Award Approval below/]
        ])(
            "renders step %i instructional content when that step is active",
            (activeStepNumber, activeStepType, expectedInstructionalText) => {
                const mockTrackerWithActiveInstructionalStep = {
                    data: [
                        {
                            id: 4,
                            agreement_id: 13,
                            display_name: "ProcurementTracker#4",
                            status: "ACTIVE",
                            tracker_type: "DEFAULT",
                            active_step_number: activeStepNumber,
                            steps: [
                                {
                                    id: 101,
                                    step_number: 1,
                                    step_type: "ACQUISITION_PLANNING",
                                    status: "COMPLETED"
                                },
                                {
                                    id: 100 + activeStepNumber,
                                    step_number: activeStepNumber,
                                    step_type: activeStepType,
                                    status: "ACTIVE"
                                }
                            ]
                        }
                    ]
                };

                useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                    data: mockTrackerWithActiveInstructionalStep,
                    isLoading: false,
                    isError: false
                });

                render(
                    <Provider store={setupStore()}>
                        <AgreementProcurementTracker agreement={mockAgreement} />
                    </Provider>
                );

                expect(screen.getByText(expectedInstructionalText)).toBeInTheDocument();
                expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            }
        );
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
            expect(tags.some((tag) => tag.textContent.includes("January") || tag.textContent.includes("2024"))).toBe(
                true
            );
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

    describe("Step 2 Wiring", () => {
        it("renders step 2 content when active step is 2", () => {
            const trackerWithActiveStepTwo = {
                data: [
                    {
                        id: 4,
                        agreement_id: 13,
                        status: "ACTIVE",
                        active_step_number: 2,
                        steps: [
                            {
                                id: 101,
                                step_number: 1,
                                step_type: "PRE_SOLICITATION",
                                status: "COMPLETED"
                            },
                            {
                                id: 102,
                                step_number: 2,
                                step_type: "SOLICITATION",
                                status: "ACTIVE"
                            }
                        ]
                    }
                ]
            };

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: trackerWithActiveStepTwo,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByText("Step 2 of 6")).toBeInTheDocument();
            expect(screen.getByTestId("procurement-step-two")).toHaveTextContent("Step Two Form");
        });

        it("passes step 2 data into ProcurementTrackerStepTwo", () => {
            const trackerWithStepTwoData = {
                data: [
                    {
                        id: 4,
                        agreement_id: 13,
                        status: "ACTIVE",
                        active_step_number: 2,
                        steps: [
                            {
                                id: 101,
                                step_number: 1,
                                step_type: "PRE_SOLICITATION",
                                status: "COMPLETED"
                            },
                            {
                                id: 102,
                                step_number: 2,
                                step_type: "SOLICITATION",
                                status: "PENDING",
                                target_completion_date: "01/30/2024"
                            }
                        ]
                    }
                ]
            };

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: trackerWithStepTwoData,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByTestId("procurement-step-two")).toHaveAttribute("data-step-data-id", "102");
            expect(screen.getByTestId("procurement-step-two")).toHaveAttribute("data-step-status", "PENDING");
        });

        it("renders completed state for step 2 when status is COMPLETED", () => {
            const trackerWithCompletedStepTwo = {
                data: [
                    {
                        id: 4,
                        agreement_id: 13,
                        status: "ACTIVE",
                        active_step_number: 2,
                        steps: [
                            {
                                id: 101,
                                step_number: 1,
                                step_type: "PRE_SOLICITATION",
                                status: "COMPLETED"
                            },
                            {
                                id: 102,
                                step_number: 2,
                                step_type: "SOLICITATION",
                                status: "COMPLETED"
                            }
                        ]
                    }
                ]
            };

            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: trackerWithCompletedStepTwo,
                isLoading: false,
                isError: false
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreement} />
                </Provider>
            );

            expect(screen.getByTestId("procurement-step-two")).toHaveTextContent("Step Two Completed");
            expect(screen.getByTestId("procurement-step-two")).toHaveAttribute("data-step-status", "COMPLETED");
        });
    });

    describe("Authorized Users Filtering", () => {
        const mockTrackerWithSteps = {
            data: [
                {
                    id: 4,
                    agreement_id: 13,
                    status: "ACTIVE",
                    active_step_number: 1,
                    steps: [
                        {
                            id: 101,
                            step_number: 1,
                            step_type: "Pre-Solicitation",
                            status: "PENDING"
                        }
                    ]
                }
            ]
        };

        const mockAllUsers = [
            { id: 1, full_name: "Amy Madigan", email: "amy@example.com" },
            { id: 2, full_name: "John Doe", email: "john@example.com" },
            { id: 3, full_name: "Jane Smith", email: "jane@example.com" },
            { id: 4, full_name: "Bob Wilson", email: "bob@example.com" },
            { id: 5, full_name: "Alice Brown", email: "alice@example.com" }
        ];

        it("filters users by agreement.authorized_user_ids and passes filtered list to step components", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            useGetUsersQuery.mockReturnValue({
                data: mockAllUsers,
                isLoading: false,
                error: undefined
            });

            const mockAgreementWithAuthorizedUsers = {
                id: 13,
                authorized_user_ids: [1, 3, 5] // Only Amy, Jane, and Alice are authorized
            };

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreementWithAuthorizedUsers} />
                </Provider>
            );

            // Verify that UsersComboBox is rendered (which receives the filtered users)
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByText("Task Completed By")).toBeInTheDocument();

            // Verify that only the 3 authorized users are passed to the component
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveAttribute("data-users-count", "3");

            // Verify the specific authorized users are present
            expect(screen.getByTestId("user-option-1")).toHaveTextContent("Amy Madigan");
            expect(screen.getByTestId("user-option-3")).toHaveTextContent("Jane Smith");
            expect(screen.getByTestId("user-option-5")).toHaveTextContent("Alice Brown");

            // Verify unauthorized users are NOT present
            expect(screen.queryByTestId("user-option-2")).not.toBeInTheDocument();
            expect(screen.queryByTestId("user-option-4")).not.toBeInTheDocument();
        });

        it("passes empty array when agreement.authorized_user_ids is null", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            useGetUsersQuery.mockReturnValue({
                data: mockAllUsers,
                isLoading: false,
                error: undefined
            });

            const mockAgreementNullAuthorizedUsers = {
                id: 13,
                authorized_user_ids: null
            };

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreementNullAuthorizedUsers} />
                </Provider>
            );

            // UsersComboBox should still render (but will receive empty array)
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();

            // Verify that 0 users are passed to the component
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveAttribute("data-users-count", "0");
        });

        it("passes empty array when agreement.authorized_user_ids is undefined", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            useGetUsersQuery.mockReturnValue({
                data: mockAllUsers,
                isLoading: false,
                error: undefined
            });

            const mockAgreementUndefinedAuthorizedUsers = {
                id: 13
                // authorized_user_ids is undefined
            };

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreementUndefinedAuthorizedUsers} />
                </Provider>
            );

            // UsersComboBox should still render (but will receive empty array)
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();

            // Verify that 0 users are passed to the component
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveAttribute("data-users-count", "0");
        });

        it("passes empty array when agreement is not provided", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            useGetUsersQuery.mockReturnValue({
                data: mockAllUsers,
                isLoading: false,
                error: undefined
            });

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={null} />
                </Provider>
            );

            // Component should handle null agreement gracefully
            expect(screen.getByText("Error loading procurement tracker data")).toBeInTheDocument();
        });

        it("passes empty array when allUsers is not yet loaded", () => {
            useGetProcurementTrackersByAgreementIdQuery.mockReturnValue({
                data: mockTrackerWithSteps,
                isLoading: false,
                isError: false
            });

            useGetUsersQuery.mockReturnValue({
                data: undefined, // Users not yet loaded
                isLoading: true,
                error: undefined
            });

            const mockAgreementWithAuthorizedUsers = {
                id: 13,
                authorized_user_ids: [1, 3, 5]
            };

            render(
                <Provider store={setupStore()}>
                    <AgreementProcurementTracker agreement={mockAgreementWithAuthorizedUsers} />
                </Provider>
            );

            // UsersComboBox should still render (but will receive empty array until users load)
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();

            // Verify that 0 users are passed to the component
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveAttribute("data-users-count", "0");
        });
    });
});

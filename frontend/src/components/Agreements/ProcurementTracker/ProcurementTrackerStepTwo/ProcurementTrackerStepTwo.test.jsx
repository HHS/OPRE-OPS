import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";

vi.mock("./ProcurementTrackerStepTwo.hooks");
vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "2024-01-30")
    };
});
vi.mock("../../../UI/Term/TermTag", () => ({
    default: ({ term, description }) => (
        <div data-testid="term-tag">
            <dt>{term}</dt>
            <dd>{description}</dd>
        </div>
    )
}));
vi.mock("../../UsersComboBox", () => ({
    default: ({ label, selectedUser, setSelectedUser, users, className }) => (
        <div
            data-testid="users-combobox"
            className={className}
        >
            <label>{label}</label>
            <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                    setSelectedUser({ id: parseInt(e.target.value) });
                }}
                data-user-count={users?.length || 0}
            >
                <option value="">Select user</option>
                {users?.map((user) => (
                    <option
                        key={user.id}
                        value={user.id}
                    >
                        {user.full_name}
                    </option>
                ))}
            </select>
        </div>
    )
}));
vi.mock("../../../UI/USWDS/DatePicker", () => ({
    default: ({ label, hint, value, onChange, maxDate, minDate, id, name, messages, className }) => (
        <div
            data-testid="date-picker"
            data-picker-id={id}
            className={className}
        >
            <label htmlFor={id}>{label}</label>
            {hint && <div className="hint">{hint}</div>}
            <input
                type="text"
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                data-max-date={maxDate}
                data-min-date={minDate}
            />
            {messages && messages.length > 0 && (
                <div className="error-messages">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className="error-message"
                        >
                            {msg}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}));

describe("ProcurementTrackerStepTwo", () => {
    const mockSetSelectedUser = vi.fn();
    const mockSetTargetCompletionDate = vi.fn();
    const mockSetStep2DateCompleted = vi.fn();
    const mockRunValidate = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => [])
    };

    const defaultHookReturn = {
        selectedUser: {},
        setSelectedUser: mockSetSelectedUser,
        targetCompletionDate: "",
        setTargetCompletionDate: mockSetTargetCompletionDate,
        step2CompletedByUserName: "John Doe",
        step2DateCompleted: "",
        setStep2DateCompleted: mockSetStep2DateCompleted,
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes,
        step2DateCompletedLabel: "January 15, 2024"
    };

    const mockStepData = { id: 1 };

    const mockAllUsers = [
        { id: 123, full_name: "John Doe", email: "john@example.com" },
        { id: 456, full_name: "Jane Smith", email: "jane@example.com" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepTwo.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State Rendering", () => {
        it("renders all form fields: Target Completion Date, Task Completed By, Date Completed", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
        });

        it("renders instructional paragraph", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(
                screen.getByText(/Edit the pre-solicitation package in collaboration with the Procurement Shop/i)
            ).toBeInTheDocument();
        });

        it("Target Completion Date has correct props", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );

            expect(targetDatePicker).toBeInTheDocument();
            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
        });

        it("Date Completed has correct props (label, hint, maxDate)", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-2-date-completed"
            );

            expect(dateCompletedPicker).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getAllByText("mm/dd/yyyy").length).toBeGreaterThan(0);

            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = dateCompletedPicker.querySelector("input");
            expect(dateInput).toHaveAttribute("data-max-date");
        });

        it("UsersComboBox has correct props", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveClass("width-card-lg", "margin-top-5");
        });
    });

    describe("PENDING State User Interactions", () => {
        it("Target Completion Date calls setTargetCompletionDate on change", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = targetDatePicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "2024-03-20" } });

            expect(mockSetTargetCompletionDate).toHaveBeenCalledWith("2024-03-20");
        });

        it("Date Completed calls runValidate and setStep2DateCompleted on change", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-2-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = dateCompletedPicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "2024-03-20" } });

            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "2024-03-20");
            expect(mockSetStep2DateCompleted).toHaveBeenCalledWith("2024-03-20");
        });

        it("UsersComboBox calls setSelectedUser when user selected", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            fireEvent.change(select, { target: { value: "123" } });

            expect(mockSetSelectedUser).toHaveBeenCalledWith({ id: 123 });
        });
    });

    describe("ACTIVE State Rendering", () => {
        it("renders all form fields in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="ACTIVE"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
        });

        it("form fields are interactive in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="ACTIVE"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            expect(datePickers.length).toBeGreaterThan(0);

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            expect(select).not.toBeDisabled();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders read-only display with instructional paragraph", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(
                screen.getByText(/Edit the pre-solicitation package in collaboration with the Procurement Shop/i)
            ).toBeInTheDocument();
        });

        it("shows TermTag components (Completed By, Date Completed)", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags).toHaveLength(2);
        });

        it("displays formatted user name from step2CompletedByUserName", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Completed By")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
        });

        it("displays formatted date from step2DateCompletedLabel", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
        });
    });

    describe("COMPLETED State Validation", () => {
        it("does not render form controls (date pickers, combobox, buttons)", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("date-picker")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
        });
    });

    describe("Validation Display", () => {
        it("displays validation errors for Date Completed", () => {
            const mockValidatorResWithErrors = {
                getErrors: vi.fn((field) => {
                    if (field === "dateCompleted") {
                        return ["Date must be MM/DD/YYYY"];
                    }
                    return [];
                })
            };

            useProcurementTrackerStepTwo.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Date must be MM/DD/YYYY")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined stepData gracefully", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={undefined}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
        });

        it("renders correctly when stepStatus is neither PENDING, ACTIVE, nor COMPLETED", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="SKIPPED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.queryByText("Target Completion Date")).not.toBeInTheDocument();
            expect(screen.queryByTestId("term-tag")).not.toBeInTheDocument();
        });

        it("handles empty authorizedUsers array", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={[]}
                    hasActiveTracker={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            expect(select).toHaveAttribute("data-user-count", "0");
        });
    });

    describe("Accessibility", () => {
        it("fieldset wraps PENDING state form elements", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const fieldset = screen.getByRole("group");
            expect(fieldset).toBeInTheDocument();
            expect(fieldset.tagName).toBe("FIELDSET");
        });

        it("definition list structure correct in COMPLETED state", () => {
            const { container } = render(
                <ProcurementTrackerStepTwo
                    stepStatus="COMPLETED"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const dl = container.querySelector("dl");
            expect(dl).toBeInTheDocument();
            expect(dl.tagName).toBe("DL");
        });
    });
});

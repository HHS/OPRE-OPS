import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";
import DatePicker from "../../../UI/USWDS/DatePicker";

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
    default: ({ label, selectedUser, setSelectedUser, users, className, isDisabled, messages, onChange }) => (
        <div
            data-testid="users-combobox"
            className={className}
        >
            <label>{label}</label>
            <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    setSelectedUser({ id: selectedId });
                    onChange?.("users", selectedId);
                }}
                data-user-count={users?.length || 0}
                disabled={isDisabled}
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
            {messages?.map((msg) => (
                <div key={msg}>{msg}</div>
            ))}
        </div>
    )
}));
vi.mock("../../../UI/USWDS/DatePicker", () => ({
    default: ({ label, hint, value, onChange, maxDate, minDate, id, name, messages, className, isDisabled }) => (
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
                disabled={isDisabled}
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

vi.mock("../../../UI/Form/TextArea", () => ({
    default: ({ label, value, onChange, isDisabled, maxLength, name, className }) => (
        <div data-testid="text-area">
            <label htmlFor={name}>{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e, e.target.value)}
                disabled={isDisabled}
                maxLength={maxLength}
                className={className}
            />
        </div>
    )
}));

describe("ProcurementTrackerStepTwo", () => {
    const mockCancelStepTwo = vi.fn();
    const mockSetIsPreSolicitationPackageFinalized = vi.fn();
    const mockSetSelectedUser = vi.fn();
    const mockSetTargetCompletionDate = vi.fn();
    const mockSetStep2DateCompleted = vi.fn();
    const mockSetDraftSolicitationDate = vi.fn();
    const mockRunValidate = vi.fn();
    const mockHandleTargetCompletionDateSubmit = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false)
    };

    const mockSetStep2Notes = vi.fn();

    const defaultHookReturn = {
        cancelStepTwo: mockCancelStepTwo,
        isPreSolicitationPackageFinalized: false,
        setIsPreSolicitationPackageFinalized: mockSetIsPreSolicitationPackageFinalized,
        selectedUser: {},
        setSelectedUser: mockSetSelectedUser,
        targetCompletionDate: "",
        setTargetCompletionDate: mockSetTargetCompletionDate,
        draftSolicitationDate: "",
        setDraftSolicitationDate: mockSetDraftSolicitationDate,
        step2CompletedByUserName: "John Doe",
        step2DateCompleted: "",
        setStep2DateCompleted: mockSetStep2DateCompleted,
        step2Notes: "",
        setStep2Notes: mockSetStep2Notes,
        step2NotesLabel: "Test notes",
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes,
        step2DateCompletedLabel: "January 15, 2024",
        MemoizedDatePicker: DatePicker,
        handleTargetCompletionDateSubmit: mockHandleTargetCompletionDateSubmit
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

        it("UsersComboBox calls runValidate when user selected", () => {
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
            fireEvent.change(select, { target: { value: "456" } });

            expect(mockRunValidate).toHaveBeenCalledWith("users", 456);
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

        it("form fields are disabled until package is finalized in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="ACTIVE"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-2-date-completed"
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const targetInput = targetDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");
            const checkbox = screen.getByRole("checkbox");
            const saveButton = screen.getByRole("button", { name: /save/i });
            const cancelButton = screen.getByRole("button", { name: /cancel/i });

            expect(checkbox).not.toBeDisabled();
            expect(select).toBeDisabled();
            expect(targetInput).not.toBeDisabled();
            expect(completedInput).toBeDisabled();
            expect(notesInput).toBeDisabled();
            expect(saveButton).not.toBeDisabled();
            expect(cancelButton).toBeDisabled();
        });

        it("form fields are interactive when package is finalized in ACTIVE state", () => {
            useProcurementTrackerStepTwo.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageFinalized: true
            });

            render(
                <ProcurementTrackerStepTwo
                    stepStatus="ACTIVE"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-2-date-completed"
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const targetInput = targetDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");
            const checkbox = screen.getByRole("checkbox");
            const saveButton = screen.getByRole("button", { name: /save/i });
            const cancelButton = screen.getByRole("button", { name: /cancel/i });

            expect(checkbox).not.toBeDisabled();
            expect(select).not.toBeDisabled();
            expect(targetInput).not.toBeDisabled();
            expect(completedInput).not.toBeDisabled();
            expect(notesInput).not.toBeDisabled();
            expect(saveButton).not.toBeDisabled();
            expect(cancelButton).not.toBeDisabled();
        });

        it("calls cancelStepTwo when cancel button is clicked", () => {
            useProcurementTrackerStepTwo.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageFinalized: true
            });

            render(
                <ProcurementTrackerStepTwo
                    stepStatus="ACTIVE"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
            expect(mockCancelStepTwo).toHaveBeenCalledTimes(1);
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
                }),
                hasErrors: vi.fn(() => false)
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

        it("displays validation errors for users", () => {
            const mockValidatorResWithErrors = {
                getErrors: vi.fn((field) => {
                    if (field === "users") {
                        return ["This is required information"];
                    }
                    return [];
                }),
                hasErrors: vi.fn(() => false)
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

            expect(screen.getByText("This is required information")).toBeInTheDocument();
        });
    });

    describe("Inactive Tracker", () => {
        it("disables pending form controls when there is no active tracker", () => {
            render(
                <ProcurementTrackerStepTwo
                    stepStatus="PENDING"
                    stepTwoData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-2-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const targetInput = targetDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");
            const checkbox = screen.getByRole("checkbox");
            const saveButton = screen.getByRole("button", { name: /save/i });

            expect(checkbox).toBeDisabled();
            expect(usersSelect).toBeDisabled();
            expect(targetInput).not.toBeDisabled();
            expect(completedInput).toBeDisabled();
            expect(notesInput).toBeDisabled();
            expect(saveButton).toBeDisabled();
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

    it("renders TextArea for notes in PENDING state", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepData}
                authorizedUsers={mockAllUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByTestId("text-area")).toBeInTheDocument();
        expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
    });

    it("TextArea has correct maxLength of 750", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepData}
                authorizedUsers={mockAllUsers}
                hasActiveTracker={true}
            />
        );

        // eslint-disable-next-line testing-library/no-node-access
        const textarea = screen.getByTestId("text-area").querySelector("textarea");
        expect(textarea).toHaveAttribute("maxLength", "750");
    });

    it("displays notes in COMPLETED state with correct styling", () => {
        const mockCompletedStepData = {
            ...mockStepData,
            notes: "Test notes for step two"
        };

        useProcurementTrackerStepTwo.mockReturnValue({
            ...defaultHookReturn,
            step2NotesLabel: "Test notes for step two"
        });

        render(
            <ProcurementTrackerStepTwo
                stepStatus="COMPLETED"
                stepTwoData={mockCompletedStepData}
                authorizedUsers={mockAllUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByText("Notes")).toBeInTheDocument();
        expect(screen.getByText("Test notes for step two")).toBeInTheDocument();

        const dt = screen.getByText("Notes");
        expect(dt.tagName).toBe("DT");
        expect(dt).toHaveClass("margin-0", "text-base-dark", "margin-top-3", "font-12px");

        const dd = screen.getByText("Test notes for step two");
        expect(dd.tagName).toBe("DD");
        expect(dd).toHaveClass("margin-0", "margin-top-1");
    });

    it("handles empty notes in COMPLETED state", () => {
        const mockCompletedStepData = {
            ...mockStepData,
            notes: ""
        };

        useProcurementTrackerStepTwo.mockReturnValue({
            ...defaultHookReturn,
            step2NotesLabel: ""
        });

        render(
            <ProcurementTrackerStepTwo
                stepStatus="COMPLETED"
                stepTwoData={mockCompletedStepData}
                authorizedUsers={mockAllUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByText("Notes")).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-node-access
        const dd = screen.getByText("Notes").nextElementSibling;
        expect(dd.textContent).toBe("");
    });
});

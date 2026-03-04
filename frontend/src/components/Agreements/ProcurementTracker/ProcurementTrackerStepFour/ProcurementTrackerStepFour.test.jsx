import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepFour from "./ProcurementTrackerStepFour";
import useProcurementTrackerStepFour from "./ProcurementTrackerStepFour.hooks";
import DatePicker from "../../../UI/USWDS/DatePicker";

vi.mock("./ProcurementTrackerStepFour.hooks");
vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "2024-03-15")
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

vi.mock("../../../UI/Modals/ConfirmationModal", () => ({
    default: ({ heading, actionButtonText, secondaryButtonText, handleConfirm, setShowModal }) => (
        <div data-testid="confirmation-modal">
            <h2>{heading}</h2>
            <button onClick={handleConfirm}>{actionButtonText}</button>
            <button onClick={() => setShowModal(false)}>{secondaryButtonText}</button>
        </div>
    )
}));

describe("ProcurementTrackerStepFour", () => {
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockHandleTargetCompletionDateSubmit = vi.fn();
    const mockHandleStepFourComplete = vi.fn();
    const mockSetIsEvaluationComplete = vi.fn();
    const mockSetSelectedUser = vi.fn();
    const mockSetTargetCompletionDate = vi.fn();
    const mockSetStep4DateCompleted = vi.fn();
    const mockSetStep4Notes = vi.fn();
    const mockRunValidate = vi.fn();
    const mockCancelModalStep4 = vi.fn();
    const mockSetShowModal = vi.fn();

    const defaultHookReturn = {
        isEvaluationComplete: false,
        setIsEvaluationComplete: mockSetIsEvaluationComplete,
        selectedUser: {},
        setSelectedUser: mockSetSelectedUser,
        targetCompletionDate: "",
        setTargetCompletionDate: mockSetTargetCompletionDate,
        step4CompletedByUserName: "John Doe",
        step4DateCompleted: "",
        setStep4DateCompleted: mockSetStep4DateCompleted,
        step4Notes: "",
        setStep4Notes: mockSetStep4Notes,
        step4NotesLabel: "",
        runValidate: mockRunValidate,
        validatorRes: {
            getErrors: vi.fn(() => []),
            hasErrors: vi.fn(() => false)
        },
        step4DateCompletedLabel: "March 15, 2024",
        step4TargetCompletionDateLabel: "March 10, 2024",
        MemoizedDatePicker: DatePicker,
        handleTargetCompletionDateSubmit: mockHandleTargetCompletionDateSubmit,
        handleStepFourComplete: mockHandleStepFourComplete,
        showModal: false,
        setShowModal: mockSetShowModal,
        modalProps: {
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: vi.fn()
        },
        cancelModalStep4: mockCancelModalStep4
    };

    const defaultProps = {
        stepStatus: "PENDING",
        isDisabled: false,
        stepFourData: { id: 1 },
        isActiveStep: true,
        authorizedUsers: [
            { id: 1, full_name: "John Doe" },
            { id: 2, full_name: "Jane Smith" }
        ],
        handleSetCompletedStepNumber: mockHandleSetCompletedStepNumber
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepFour.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State", () => {
        it("renders with description and form fields", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            expect(screen.getByText(/Complete the technical evaluations/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/Evaluations are complete/i)).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("text-area")).toBeInTheDocument();
        });

        it("renders target completion date input when not set", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            expect(screen.getByLabelText(/Target Completion Date/i)).toBeInTheDocument();
        });

        it("renders target completion date as TermTag when already set", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                stepFourData: { id: 1, target_completion_date: "2024-03-10" }
            });

            const propsWithTargetDate = {
                ...defaultProps,
                stepFourData: { id: 1, target_completion_date: "2024-03-10" }
            };

            render(<ProcurementTrackerStepFour {...propsWithTargetDate} />);

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags.some((tag) => tag.textContent.includes("Target Completion Date"))).toBe(true);
        });

        it("checkbox controls form field states", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();

            fireEvent.click(checkbox);
            expect(mockSetIsEvaluationComplete).toHaveBeenCalledWith(true);
        });

        it("disables complete button when validation fails", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: {
                    getErrors: vi.fn(() => ["Error"]),
                    hasErrors: vi.fn(() => true)
                }
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const completeButton = screen.getByRole("button", { name: /Complete Step 4/i });
            expect(completeButton).toBeDisabled();
        });

        it("disables complete button when checkbox not checked", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const completeButton = screen.getByRole("button", { name: /Complete Step 4/i });
            expect(completeButton).toBeDisabled();
        });

        it("enables complete button when all requirements met", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                isEvaluationComplete: true,
                selectedUser: { id: 1 },
                step4DateCompleted: "03/15/2024"
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const completeButton = screen.getByRole("button", { name: /Complete Step 4/i });
            expect(completeButton).not.toBeDisabled();
        });

        it("calls handleStepFourComplete when complete button clicked", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                isEvaluationComplete: true,
                selectedUser: { id: 1 },
                step4DateCompleted: "03/15/2024"
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const completeButton = screen.getByRole("button", { name: /Complete Step 4/i });
            fireEvent.click(completeButton);

            expect(mockHandleStepFourComplete).toHaveBeenCalledWith(1);
        });

        it("calls handleTargetCompletionDateSubmit when save button clicked", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: "03/20/2024"
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            fireEvent.click(saveButton);

            expect(mockHandleTargetCompletionDateSubmit).toHaveBeenCalledWith(1);
        });

        it("calls cancelModalStep4 when cancel button clicked", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                isEvaluationComplete: true
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const cancelButton = screen.getByRole("button", { name: /Cancel/i });
            fireEvent.click(cancelButton);

            expect(mockCancelModalStep4).toHaveBeenCalled();
        });

        it("renders confirmation modal when showModal is true", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                modalProps: {
                    heading: "Test Modal",
                    actionButtonText: "Confirm",
                    secondaryButtonText: "Cancel",
                    handleConfirm: vi.fn()
                }
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
            expect(screen.getByText("Test Modal")).toBeInTheDocument();
        });
    });

    describe("COMPLETED State", () => {
        const completedProps = {
            ...defaultProps,
            stepStatus: "COMPLETED",
            stepFourData: {
                id: 1,
                target_completion_date: "2024-03-10",
                task_completed_by: 1,
                date_completed: "2024-03-15",
                notes: "Vendor selected"
            }
        };

        it("renders completed description and checkmark", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                step4NotesLabel: "Vendor selected"
            });

            render(<ProcurementTrackerStepFour {...completedProps} />);

            expect(screen.getByText(/OPRE completes the technical evaluations/i)).toBeInTheDocument();
            expect(screen.getByText(/Evaluations are complete and OPRE has internally selected/i)).toBeInTheDocument();
        });

        it("renders all TermTags with saved data", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                step4CompletedByUserName: "John Doe",
                step4DateCompletedLabel: "March 15, 2024",
                step4TargetCompletionDateLabel: "March 10, 2024",
                step4NotesLabel: "Vendor selected"
            });

            render(<ProcurementTrackerStepFour {...completedProps} />);

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags.length).toBeGreaterThan(0);

            const tagTexts = termTags.map((tag) => tag.textContent);
            expect(tagTexts.some((text) => text.includes("Completed By"))).toBe(true);
            expect(tagTexts.some((text) => text.includes("Date Completed"))).toBe(true);
            expect(tagTexts.some((text) => text.includes("Target Completion Date"))).toBe(true);
        });

        it("renders notes when provided", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                step4NotesLabel: "Vendor selected after evaluation"
            });

            render(<ProcurementTrackerStepFour {...completedProps} />);

            expect(screen.getByText("Notes")).toBeInTheDocument();
            expect(screen.getByText("Vendor selected after evaluation")).toBeInTheDocument();
        });

        it("renders notes as None when notes are empty", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                step4NotesLabel: ""
            });

            const propsWithoutNotes = {
                ...completedProps,
                stepFourData: { ...completedProps.stepFourData, notes: "" }
            };

            render(<ProcurementTrackerStepFour {...propsWithoutNotes} />);

            expect(screen.getByText("Notes")).toBeInTheDocument();
            expect(screen.getByText("None")).toBeInTheDocument();
        });

        it("renders target completion date as None when not set", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                step4TargetCompletionDateLabel: ""
            });

            const propsWithoutTargetDate = {
                ...completedProps,
                stepFourData: { ...completedProps.stepFourData, target_completion_date: null }
            };

            render(<ProcurementTrackerStepFour {...propsWithoutTargetDate} />);

            const termTags = screen.getAllByTestId("term-tag");
            const tagTexts = termTags.map((tag) => tag.textContent);
            expect(tagTexts.some((text) => text.includes("Target Completion Date") && text.includes("None"))).toBe(true);
        });
    });

    describe("Form Interactions", () => {
        it("calls validation on date completed change", () => {
            useProcurementTrackerStepFour.mockReturnValue({
                ...defaultHookReturn,
                isEvaluationComplete: true
            });

            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const dateInput = screen.getByLabelText("Date Completed");
            fireEvent.change(dateInput, { target: { value: "03/15/2024" } });

            expect(mockSetStep4DateCompleted).toHaveBeenCalledWith("03/15/2024");
            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "03/15/2024");
        });

        it("calls validation on notes change", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const textarea = screen.getByRole("textbox", { name: /Notes/i });
            fireEvent.change(textarea, { target: { value: "Test notes" } });

            expect(mockSetStep4Notes).toHaveBeenCalledWith("Test notes");
        });

        it("disables form fields when checkbox not checked", () => {
            render(<ProcurementTrackerStepFour {...defaultProps} />);

            const usersComboBox = screen.getByTestId("users-combobox");
            const selectElement = within(usersComboBox).getByRole("combobox");
            expect(selectElement).toBeDisabled();
        });

        it("disables checkbox when step is not active", () => {
            const propsNotActive = {
                ...defaultProps,
                isActiveStep: false
            };

            render(<ProcurementTrackerStepFour {...propsNotActive} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });
    });
});

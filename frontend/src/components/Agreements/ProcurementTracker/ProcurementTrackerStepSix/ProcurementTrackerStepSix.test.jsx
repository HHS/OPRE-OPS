import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepSix from "./ProcurementTrackerStepSix";
import useProcurementTrackerStepSix from "./ProcurementTrackerStepSix.hooks";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate
}));
vi.mock("./ProcurementTrackerStepSix.hooks");
vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "2024-01-30")
    };
});
vi.mock("../../../UI/Term/TermTag", () => ({
    default: ({ term, description, label }) => (
        <div data-testid="term-tag">
            {label ? (
                <span>{label}</span>
            ) : (
                <>
                    <dt>{term}</dt>
                    <dd>{description}</dd>
                </>
            )}
        </div>
    )
}));
vi.mock("../../UsersComboBox", () => ({
    default: ({ label, selectedUser, setSelectedUser, users, className, isDisabled, messages, onChange }) => (
        <div
            data-testid="users-combobox"
            className={className}
            data-user-count={users?.length || 0}
        >
            <label>{label}</label>
            <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                    const selectedId = parseInt(e.target.value);
                    setSelectedUser({ id: selectedId });
                    onChange?.("users", selectedId);
                }}
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
        <div
            data-testid="text-area"
            className={className}
        >
            <label htmlFor={name}>{label}</label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={isDisabled}
                maxLength={maxLength}
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

describe("ProcurementTrackerStepSix", () => {
    const mockValidatorRes = {
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false),
        isValid: vi.fn(() => true)
    };

    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockSetIsAwardCheckboxChecked = vi.fn();
    const mockSetSelectedUser = vi.fn();
    const mockSetStepSixDateCompleted = vi.fn();
    const mockSetStepSixNotes = vi.fn();
    const mockSetTargetCompletionDate = vi.fn();
    const mockRunValidate = vi.fn();
    const mockHandleStepSixComplete = vi.fn();
    const mockCancelModalStepSix = vi.fn();
    const mockHandleTargetCompletionDateSubmit = vi.fn();

    const defaultHookReturn = {
        isAwardCheckboxChecked: false,
        setIsAwardCheckboxChecked: mockSetIsAwardCheckboxChecked,
        selectedUser: undefined,
        setSelectedUser: mockSetSelectedUser,
        targetCompletionDate: "",
        setTargetCompletionDate: mockSetTargetCompletionDate,
        stepSixCompletedByUserName: "",
        stepSixDateCompleted: "",
        setStepSixDateCompleted: mockSetStepSixDateCompleted,
        stepSixDateCompletedLabel: "",
        stepSixNotes: "",
        setStepSixNotes: mockSetStepSixNotes,
        stepSixNotesLabel: "",
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes,
        stepSixTargetCompletionDateLabel: "",
        MemoizedDatePicker: ({ label, hint, value, onChange, maxDate, minDate, id, name, messages, className, isDisabled }) => (
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
        ),
        handleTargetCompletionDateSubmit: mockHandleTargetCompletionDateSubmit,
        showModal: false,
        setShowModal: vi.fn(),
        modalProps: {},
        cancelModalStepSix: mockCancelModalStepSix,
        handleStepSixComplete: mockHandleStepSixComplete
    };

    const defaultProps = {
        stepStatus: "PENDING",
        isDisabled: false,
        stepSixData: {
            id: 6,
            approval_status: "APPROVED",
            approval_requested: false
        },
        isActiveStep: true,
        authorizedUsers: [
            { id: 1, full_name: "John Doe" },
            { id: 2, full_name: "Jane Smith" }
        ],
        agreementId: 123,
        budgetLineItems: [],
        handleSetCompletedStepNumber: mockHandleSetCompletedStepNumber,
        isReadOnly: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepSix.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State Rendering", () => {
        it("renders all form fields when step is pending", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            expect(screen.getByText(/Once you receive the signed award/i)).toBeInTheDocument();
            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("text-area")).toBeInTheDocument();
        });

        it("renders instructional paragraph", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const paragraph = screen.getByText(/Once you receive the signed award/i);
            expect(paragraph).toBeInTheDocument();
            expect(paragraph.textContent).toContain("Budget Team");
            expect(paragraph.textContent).toContain("CLINs");
            expect(paragraph.textContent).toContain("Vendor and Vendor Type");
        });

        it("renders award checkbox with correct label", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toHaveAttribute("id", "award-checkbox-step-6");

            const label = screen.getByLabelText(/I received the signed award/i);
            expect(label).toBeInTheDocument();
        });

        it("renders Request Award Approval button", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Request Award Approval/i });
            expect(button).toBeInTheDocument();
            expect(button).not.toBeDisabled();
        });

        it("renders Request Award Approval button as disabled when approval already requested", () => {
            const props = {
                ...defaultProps,
                stepSixData: {
                    ...defaultProps.stepSixData,
                    approval_requested: true,
                    approval_status: "PENDING"
                }
            };
            render(<ProcurementTrackerStepSix {...props} />);

            const button = screen.getByRole("button", { name: /Request Award Approval/i });
            expect(button).toBeDisabled();
        });

        it("renders Request Award Approval button as disabled when BLI is in review", () => {
            const props = {
                ...defaultProps,
                budgetLineItems: [{ id: 1, in_review: true }]
            };
            render(<ProcurementTrackerStepSix {...props} />);

            const button = screen.getByRole("button", { name: /Request Award Approval/i });
            expect(button).toBeDisabled();
        });

        it("renders Continue and Cancel buttons", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            expect(screen.getByRole("button", { name: /Complete Step 6/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
        });

        it("Target Completion Date field has correct props when not saved", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const datePicker = screen.getByLabelText(/Target Completion Date \(optional\)/i);
            expect(datePicker).toBeInTheDocument();
            expect(datePicker).toHaveAttribute("data-min-date", "2024-01-30");
        });

        it("Date Completed has correct props (label, hint, maxDate)", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const dateCompleted = screen.getByLabelText(/Date Completed/i);
            expect(dateCompleted).toBeInTheDocument();
            expect(dateCompleted).toHaveAttribute("data-max-date", "2024-01-30");

            // Find hint within the Date Completed picker by using the picker with that specific ID
            const dateCompletedPicker = screen.getAllByTestId("date-picker").find((el) => el.getAttribute("data-picker-id") === "date-completed-step-6");
            const hint = within(dateCompletedPicker).getByText("mm/dd/yyyy");
            expect(hint).toBeInTheDocument();
        });
    });

    describe("ACTIVE State Rendering", () => {
        it("renders editable form fields when step status is ACTIVE", () => {
            const props = { ...defaultProps, stepStatus: "ACTIVE" };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("text-area")).toBeInTheDocument();
        });

        it("form fields are interactive when award checkbox is checked in ACTIVE state", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true,
                selectedUser: { id: 1, full_name: "John Doe" }
            });

            const props = { ...defaultProps, stepStatus: "ACTIVE" };
            render(<ProcurementTrackerStepSix {...props} />);

            const usersComboBox = screen.getByTestId("users-combobox");
            const select = within(usersComboBox).getByRole("combobox");
            expect(select).not.toBeDisabled();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders completed view when step status is COMPLETED", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                stepSixCompletedByUserName: "John Doe",
                stepSixDateCompletedLabel: "January 15, 2024",
                stepSixNotesLabel: "Award received and uploaded"
            });

            const props = { ...defaultProps, stepStatus: "COMPLETED" };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.getByText(/Completed by John Doe/i)).toBeInTheDocument();
            expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
            expect(screen.getByText(/Award received and uploaded/i)).toBeInTheDocument();
        });

        it("displays completed status message with check icon", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                stepSixCompletedByUserName: "John Doe",
                stepSixDateCompletedLabel: "January 15, 2024"
            });

            const props = { ...defaultProps, stepStatus: "COMPLETED" };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.getByText(/Completed by John Doe/i)).toBeInTheDocument();
        });

        it("does not render form fields in completed view", () => {
            const props = { ...defaultProps, stepStatus: "COMPLETED" };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
        });

        it("does not render checkbox in completed view", () => {
            const props = { ...defaultProps, stepStatus: "COMPLETED" };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        });
    });

    describe("Checkbox Behavior", () => {
        it("checkbox is initially unchecked", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();
        });

        it("checkbox calls setIsAwardCheckboxChecked when clicked", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(mockSetIsAwardCheckboxChecked).toHaveBeenCalledWith(true);
        });

        it("checkbox is disabled when isActiveStep is false", () => {
            const props = { ...defaultProps, isActiveStep: false };
            render(<ProcurementTrackerStepSix {...props} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("checkbox is disabled when approval is not approved", () => {
            const props = {
                ...defaultProps,
                stepSixData: {
                    ...defaultProps.stepSixData,
                    approval_status: "PENDING"
                }
            };
            render(<ProcurementTrackerStepSix {...props} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("checkbox is disabled when isDisabled is true", () => {
            const props = { ...defaultProps, isDisabled: true };
            render(<ProcurementTrackerStepSix {...props} />);

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });
    });

    describe("Target Completion Date Field", () => {
        it("renders target completion date input when not yet saved", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const input = screen.getByLabelText(/Target Completion Date \(optional\)/i);
            expect(input).toBeInTheDocument();
        });

        it("target completion date onChange calls setTargetCompletionDate and runValidate", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const input = screen.getByLabelText(/Target Completion Date \(optional\)/i);
            fireEvent.change(input, { target: { value: "02/15/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("targetCompletionDate", "02/15/2024");
            expect(mockSetTargetCompletionDate).toHaveBeenCalledWith("02/15/2024");
        });

        it("target completion date has minDate of today", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const input = screen.getByLabelText(/Target Completion Date \(optional\)/i);
            expect(input).toHaveAttribute("data-min-date", "2024-01-30");
        });

        it("target completion date is disabled when isDisabled is true", () => {
            const props = { ...defaultProps, isDisabled: true };
            render(<ProcurementTrackerStepSix {...props} />);

            const input = screen.getByLabelText(/Target Completion Date \(optional\)/i);
            expect(input).toBeDisabled();
        });

        it("renders TermTag when target completion date is already saved", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                stepSixTargetCompletionDateLabel: "February 20, 2024"
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const termTag = screen.getByTestId("term-tag");
            expect(termTag).toBeInTheDocument();
            expect(within(termTag).getByText("Target Completion Date")).toBeInTheDocument();
            expect(within(termTag).getByText("February 20, 2024")).toBeInTheDocument();
        });
    });

    describe("Target Completion Date Save Button", () => {
        it("renders save button for target completion date", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).toHaveAttribute("data-cy", "save-target-completion-date-step-6");
        });

        it("save button is disabled when isDisabled is true", () => {
            const props = { ...defaultProps, isDisabled: true };
            render(<ProcurementTrackerStepSix {...props} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when target completion date is empty", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: ""
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when validation has errors", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: "02/15/2024",
                validatorRes: {
                    ...mockValidatorRes,
                    hasErrors: vi.fn((field) => field === "targetCompletionDate")
                }
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button calls handleTargetCompletionDateSubmit when clicked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: "02/15/2024"
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            fireEvent.click(saveButton);

            expect(mockHandleTargetCompletionDateSubmit).toHaveBeenCalledWith(6);
        });

        it("save button has unstyled button class", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const saveButton = screen.getByRole("button", { name: /Save/i });
            expect(saveButton).toHaveClass("usa-button--unstyled");
        });
    });

    describe("Users ComboBox Field - Disabled State Bug Fix", () => {
        it("UsersComboBox is disabled when checkbox is unchecked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: false
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const comboBox = screen.getByTestId("users-combobox");
            const select = within(comboBox).getByRole("combobox");
            expect(select).toBeDisabled();
        });

        it("UsersComboBox is enabled when checkbox is checked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const comboBox = screen.getByTestId("users-combobox");
            const select = within(comboBox).getByRole("combobox");
            expect(select).not.toBeDisabled();
        });

        it("UsersComboBox has correct className for side-by-side layout", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveClass("width-card-lg");
            expect(comboBox).toHaveClass("margin-top-5");
        });
    });

    describe("Date Completed Field - Disabled State Bug Fix", () => {
        it("Date Completed is disabled when checkbox is unchecked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: false
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const dateCompleted = screen.getByLabelText(/Date Completed/i);
            expect(dateCompleted).toBeDisabled();
        });

        it("Date Completed is enabled when checkbox is checked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const dateCompleted = screen.getByLabelText(/Date Completed/i);
            expect(dateCompleted).not.toBeDisabled();
        });

        it("Date Completed onChange calls setStepSixDateCompleted and runValidate", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const input = screen.getByLabelText(/Date Completed/i);
            fireEvent.change(input, { target: { value: "02/15/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "02/15/2024");
            expect(mockSetStepSixDateCompleted).toHaveBeenCalledWith("02/15/2024");
        });
    });

    describe("Notes Field - Disabled State Bug Fix", () => {
        it("Notes field is disabled when checkbox is unchecked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: false
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const notesField = screen.getByLabelText(/Notes \(optional\)/i);
            expect(notesField).toBeDisabled();
        });

        it("Notes field is enabled when checkbox is checked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const notesField = screen.getByLabelText(/Notes \(optional\)/i);
            expect(notesField).not.toBeDisabled();
        });

        it("Notes field onChange calls setStepSixNotes", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const notesField = screen.getByLabelText(/Notes \(optional\)/i);
            fireEvent.change(notesField, { target: { value: "Test notes" } });

            expect(mockSetStepSixNotes).toHaveBeenCalledWith("Test notes");
        });

        it("Notes field has margin-top-2 class", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const textArea = screen.getByTestId("text-area");
            expect(textArea).toHaveClass("margin-top-2");
        });
    });

    describe("Complete Step 6 Button", () => {
        it("Complete button is disabled when checkbox is not checked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: false
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Complete Step 6/i });
            expect(button).toBeDisabled();
        });

        it("Complete button is disabled when selectedUser is not set", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true,
                selectedUser: undefined,
                stepSixDateCompleted: "02/15/2024"
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Complete Step 6/i });
            expect(button).toBeDisabled();
        });

        it("Complete button is disabled when date completed is not set", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true,
                selectedUser: { id: 1 },
                stepSixDateCompleted: ""
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Complete Step 6/i });
            expect(button).toBeDisabled();
        });

        it("Complete button is enabled when all requirements are met", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true,
                selectedUser: { id: 1 },
                stepSixDateCompleted: "02/15/2024"
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Complete Step 6/i });
            expect(button).not.toBeDisabled();
        });

        it("Complete button calls handleStepSixComplete when clicked", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                isAwardCheckboxChecked: true,
                selectedUser: { id: 1 },
                stepSixDateCompleted: "02/15/2024"
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Complete Step 6/i });
            fireEvent.click(button);

            expect(mockHandleStepSixComplete).toHaveBeenCalledWith(6);
        });
    });

    describe("Cancel Button", () => {
        it("Cancel button calls cancelModalStepSix when clicked", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Cancel/i });
            fireEvent.click(button);

            expect(mockCancelModalStepSix).toHaveBeenCalled();
        });

        it("Cancel button is disabled when isDisabled is true", () => {
            const props = { ...defaultProps, isDisabled: true };
            render(<ProcurementTrackerStepSix {...props} />);

            const button = screen.getByRole("button", { name: /Cancel/i });
            expect(button).toBeDisabled();
        });

        it("Cancel button has correct styling classes", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Cancel/i });
            expect(button).toHaveClass("usa-button--unstyled");
            expect(button).toHaveClass("margin-right-2");
        });
    });

    describe("Button Layout", () => {
        it("buttons are right-aligned with proper spacing", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const cancelButton = screen.getByRole("button", { name: /Cancel/i });
            const completeButton = screen.getByRole("button", { name: /Complete Step 6/i });

            expect(cancelButton).toBeInTheDocument();
            expect(completeButton).toBeInTheDocument();
            expect(cancelButton).toHaveClass("margin-right-2");
        });
    });

    describe("Request Award Approval Button", () => {
        it("navigates to award approval page when clicked", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            const button = screen.getByRole("button", { name: /Request Award Approval/i });
            fireEvent.click(button);

            expect(mockNavigate).toHaveBeenCalledWith("/agreements/123/award-approval");
        });

        it("shows approval requested indicator when approval is requested", () => {
            const props = {
                ...defaultProps,
                stepSixData: {
                    ...defaultProps.stepSixData,
                    approval_requested: true
                }
            };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.getByText(/Award Approval Requested/i)).toBeInTheDocument();
        });
    });

    describe("Confirmation Modal", () => {
        it("renders confirmation modal when showModal is true", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                modalProps: {
                    heading: "Test Heading",
                    actionButtonText: "Confirm",
                    secondaryButtonText: "Cancel",
                    handleConfirm: vi.fn()
                }
            });

            render(<ProcurementTrackerStepSix {...defaultProps} />);

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
            expect(screen.getByText("Test Heading")).toBeInTheDocument();
        });

        it("does not render modal when showModal is false", () => {
            render(<ProcurementTrackerStepSix {...defaultProps} />);

            expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
        });
    });

    describe("Read-Only Mode", () => {
        it("renders read-only completed view when isReadOnly is true and status is COMPLETED", () => {
            useProcurementTrackerStepSix.mockReturnValue({
                ...defaultHookReturn,
                stepSixCompletedByUserName: "John Doe",
                stepSixDateCompletedLabel: "January 15, 2024",
                stepSixNotesLabel: "Award received"
            });

            const props = {
                ...defaultProps,
                stepStatus: "COMPLETED",
                isReadOnly: true
            };
            render(<ProcurementTrackerStepSix {...props} />);

            expect(screen.getByText(/Completed by John Doe/i)).toBeInTheDocument();
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        });
    });
});

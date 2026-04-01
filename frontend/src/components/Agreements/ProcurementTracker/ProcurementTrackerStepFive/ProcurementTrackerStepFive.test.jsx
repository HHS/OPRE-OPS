import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepFive from "./ProcurementTrackerStepFive";
import useProcurementTrackerStepFive from "./ProcurementTrackerStepFive.hooks";
import DatePicker from "../../../UI/USWDS/DatePicker";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate
}));
vi.mock("./ProcurementTrackerStepFive.hooks");
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
    default: ({ heading, setShowModal, actionButtonText, secondaryButtonText, handleConfirm }) => (
        <div data-testid="confirmation-modal">
            <h2>{heading}</h2>
            <button onClick={handleConfirm}>{actionButtonText}</button>
            <button onClick={() => setShowModal(false)}>{secondaryButtonText}</button>
        </div>
    )
}));

describe("ProcurementTrackerStepFive", () => {
    const mockCancelModalStep5 = vi.fn();
    const mockSetIsPreAwardComplete = vi.fn();
    const mockSetSelectedUser = vi.fn();
    const mockSetTargetCompletionDate = vi.fn();
    const mockSetStep5DateCompleted = vi.fn();
    const mockSetStep5Notes = vi.fn();
    const mockRunValidate = vi.fn();
    const mockHandleTargetCompletionDateSubmit = vi.fn();
    const mockHandleStepFiveComplete = vi.fn();
    const mockSetShowModal = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false)
    };

    const defaultHookReturn = {
        cancelModalStep5: mockCancelModalStep5,
        isPreAwardComplete: false,
        setIsPreAwardComplete: mockSetIsPreAwardComplete,
        selectedUser: undefined,
        setSelectedUser: mockSetSelectedUser,
        targetCompletionDate: "",
        setTargetCompletionDate: mockSetTargetCompletionDate,
        step5CompletedByUserName: "John Doe",
        step5DateCompleted: "",
        setStep5DateCompleted: mockSetStep5DateCompleted,
        step5Notes: "",
        setStep5Notes: mockSetStep5Notes,
        step5NotesLabel: "Test notes",
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes,
        step5DateCompletedLabel: "January 15, 2024",
        step5TargetCompletionDateLabel: "January 30, 2024",
        MemoizedDatePicker: DatePicker,
        handleTargetCompletionDateSubmit: mockHandleTargetCompletionDateSubmit,
        handleStepFiveComplete: mockHandleStepFiveComplete,
        showModal: false,
        setShowModal: mockSetShowModal,
        modalProps: {
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: vi.fn()
        }
    };

    const mockStepData = { id: 5 };

    const mockAllUsers = [
        { id: 123, full_name: "John Doe", email: "john@example.com" },
        { id: 456, full_name: "Jane Smith", email: "jane@example.com" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepFive.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State Rendering", () => {
        it("renders all form fields when step is pending", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Target Completion Date (optional)")).toBeInTheDocument();
            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
        });

        it("renders instructional paragraph", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(
                screen.getByText(
                    /Edit the Agreement to match the Vendor Price Sheet and ensure any final Budget Changes are approved/i
                )
            ).toBeInTheDocument();
        });

        it("renders pre-award checkbox with correct label", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(
                screen.getByText(
                    /The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes were approved/i
                )
            ).toBeInTheDocument();
        });

        it("renders Request Pre-Award Approval button as enabled when no approval requested and no BLIs in review", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                    budgetLineItems={[]}
                />
            );

            const requestButton = screen.getByText("Request Pre-Award Approval");
            expect(requestButton).toBeInTheDocument();
            expect(requestButton).not.toBeDisabled();
        });

        it("renders Request Pre-Award Approval button as disabled when approval already requested", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={{ ...mockStepData, approval_requested: true }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                    budgetLineItems={[]}
                />
            );

            const requestButton = screen.getByText("Request Pre-Award Approval");
            expect(requestButton).toBeInTheDocument();
            expect(requestButton).toBeDisabled();
        });

        it("renders Request Pre-Award Approval button as disabled when BLI is in review", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                    budgetLineItems={[{ id: 1, in_review: true }]}
                />
            );

            const requestButton = screen.getByText("Request Pre-Award Approval");
            expect(requestButton).toBeInTheDocument();
            expect(requestButton).toBeDisabled();
        });

        it("Target Completion Date has correct props", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );

            expect(targetDatePicker).toBeInTheDocument();
            expect(screen.getByText("Target Completion Date (optional)")).toBeInTheDocument();
        });

        it("Date Completed has correct props (label, hint, maxDate)", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );

            expect(dateCompletedPicker).toBeInTheDocument();
            const dateInput = within(dateCompletedPicker).getByRole("textbox");
            expect(dateInput).toHaveAttribute("data-max-date", "2024-01-30");
        });

        it("renders Continue and Cancel buttons", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Complete Step 5")).toBeInTheDocument();
            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("renders save button for target completion date", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Save")).toBeInTheDocument();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders completed view when step status is COMPLETED", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText(/OPRE edits the Agreement to match the Vendor Price Sheet/i)).toBeInTheDocument();
        });

        it("displays completed status message with check icon", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(
                screen.getByText(
                    /The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes were approved/i
                )
            ).toBeInTheDocument();
        });

        it("renders TermTag components for completed data", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags.length).toBeGreaterThan(0);

            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
            expect(screen.getByText("Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
        });

        it("displays Notes field in completed view", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Notes")).toBeInTheDocument();
        });

        it("does not render form fields in completed view", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
            expect(screen.queryByText("Complete Step 5")).not.toBeInTheDocument();
        });

        it("does not render checkbox in completed view", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const checkbox = screen.queryByRole("checkbox");
            expect(checkbox).not.toBeInTheDocument();
        });
    });

    describe("Checkbox Behavior", () => {
        it("checkbox is initially unchecked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();
        });

        it("checkbox calls setIsPreAwardComplete when clicked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(mockSetIsPreAwardComplete).toHaveBeenCalledWith(true);
        });

        it("checkbox is disabled when isActiveStep is false", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("checkbox is disabled when isDisabled is true", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });
    });

    describe("Target Completion Date Field", () => {
        it("renders target completion date input when not yet saved", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );

            expect(targetDatePicker).toBeInTheDocument();
        });

        it("target completion date onChange calls setTargetCompletionDate and runValidate", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            const input = within(targetDatePicker).getByRole("textbox");

            fireEvent.change(input, { target: { value: "03/20/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("targetCompletionDate", "03/20/2024");
            expect(mockSetTargetCompletionDate).toHaveBeenCalledWith("03/20/2024");
        });

        it("target completion date has minDate of today", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );

            const targetInput = within(targetDatePicker).getByRole("textbox");
            expect(targetInput).toHaveAttribute("data-min-date", "2024-01-30");
        });

        it("target completion date is disabled when isDisabled is true", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const targetDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "target-completion-date"
            );
            const input = within(targetDatePicker).getByRole("textbox");

            expect(input).toBeDisabled();
        });

        it("renders TermTag when target completion date is already saved", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                stepFiveData: { ...mockStepData, target_completion_date: "2024-03-20" },
                step5TargetCompletionDateLabel: "March 20, 2024"
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={{ ...mockStepData, target_completion_date: "2024-03-20" }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
            expect(screen.getByText("March 20, 2024")).toBeInTheDocument();
        });
    });

    describe("Target Completion Date Save Button", () => {
        it("renders save button for target completion date", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Save")).toBeInTheDocument();
        });

        it("save button is disabled when isDisabled is true", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const saveButton = screen.getByText("Save");
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when target completion date is empty", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: ""
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const saveButton = screen.getByText("Save");
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when validation has errors", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: "01/15/2024",
                validatorRes: {
                    getErrors: vi.fn(() => ["Date is in the past"]),
                    hasErrors: vi.fn((field) => field === "targetCompletionDate")
                }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const saveButton = screen.getByText("Save");
            expect(saveButton).toBeDisabled();
        });

        it("save button calls handleTargetCompletionDateSubmit when clicked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                targetCompletionDate: "03/20/2024"
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const saveButton = screen.getByText("Save");
            fireEvent.click(saveButton);

            expect(mockHandleTargetCompletionDateSubmit).toHaveBeenCalledWith(5);
        });

        it("does not render save button when target completion date is already saved", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                stepFiveData: { ...mockStepData, target_completion_date: "2024-03-20" }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={{ ...mockStepData, target_completion_date: "2024-03-20" }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.queryByText("Save")).not.toBeInTheDocument();
        });
    });

    describe("Users ComboBox", () => {
        it("renders users combobox with correct label", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
        });

        it("users combobox is disabled when checkbox is not checked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const combobox = screen.getByTestId("users-combobox");
            const select = within(combobox).getByRole("combobox");
            expect(select).toBeDisabled();
        });

        it("users combobox is enabled when checkbox is checked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const combobox = screen.getByTestId("users-combobox");
            const select = within(combobox).getByRole("combobox");
            expect(select).not.toBeDisabled();
        });

        it("users combobox is disabled when no authorized users", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={[]}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const combobox = screen.getByTestId("users-combobox");
            const select = within(combobox).getByRole("combobox");
            expect(select).toBeDisabled();
        });

        it("users combobox displays all authorized users", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const combobox = screen.getByTestId("users-combobox");
            expect(combobox).toHaveAttribute("data-user-count", "2");
        });
    });

    describe("Date Completed Field", () => {
        it("renders date completed input", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );

            expect(dateCompletedPicker).toBeInTheDocument();
        });

        it("date completed onChange calls setStep5DateCompleted and runValidate", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );
            const input = within(dateCompletedPicker).getByRole("textbox");

            fireEvent.change(input, { target: { value: "02/15/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "02/15/2024");
            expect(mockSetStep5DateCompleted).toHaveBeenCalledWith("02/15/2024");
        });

        it("date completed has maxDate of today", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );

            const dateInput = within(dateCompletedPicker).getByRole("textbox");
            expect(dateInput).toHaveAttribute("data-max-date", "2024-01-30");
        });

        it("date completed is disabled when checkbox is not checked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );
            const input = within(dateCompletedPicker).getByRole("textbox");

            expect(input).toBeDisabled();
        });

        it("date completed is enabled when checkbox is checked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-5-date-completed"
            );
            const input = within(dateCompletedPicker).getByRole("textbox");

            expect(input).not.toBeDisabled();
        });
    });

    describe("Notes Field", () => {
        it("renders notes textarea", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByTestId("text-area")).toBeInTheDocument();
            expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
        });

        it("notes textarea has max length of 750", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const textarea = within(screen.getByTestId("text-area")).getByRole("textbox");
            expect(textarea).toHaveAttribute("maxLength", "750");
        });

        it("notes onChange calls setStep5Notes", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const textarea = within(screen.getByTestId("text-area")).getByRole("textbox");
            fireEvent.change(textarea, { target: { value: "Test notes" } });

            expect(mockSetStep5Notes).toHaveBeenCalledWith("Test notes");
        });

        it("notes is disabled when checkbox is not checked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const textarea = within(screen.getByTestId("text-area")).getByRole("textbox");
            expect(textarea).toBeDisabled();
        });

        it("notes is enabled when checkbox is checked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const textarea = within(screen.getByTestId("text-area")).getByRole("textbox");
            expect(textarea).not.toBeDisabled();
        });
    });

    describe("Complete Step 5 Button", () => {
        it("renders Complete Step 5 button", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Complete Step 5")).toBeInTheDocument();
        });

        it("button is disabled when isDisabled is true", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).toBeDisabled();
        });

        it("button is disabled when checkbox is not checked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).toBeDisabled();
        });

        it("button is disabled when user is not selected", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true,
                selectedUser: undefined
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).toBeDisabled();
        });

        it("button is disabled when date completed is empty", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true,
                selectedUser: { id: 123 },
                step5DateCompleted: ""
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).toBeDisabled();
        });

        it("button is disabled when validation has errors", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true,
                selectedUser: { id: 123 },
                step5DateCompleted: "02/15/2024",
                validatorRes: {
                    getErrors: vi.fn(() => []),
                    hasErrors: vi.fn(() => true)
                }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).toBeDisabled();
        });

        it("button is enabled when all required fields are filled and valid", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true,
                selectedUser: { id: 123 },
                step5DateCompleted: "02/15/2024"
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={{ ...mockStepData, approval_status: "APPROVED" }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            expect(button).not.toBeDisabled();
        });

        it("button calls handleStepFiveComplete when clicked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true,
                selectedUser: { id: 123 },
                step5DateCompleted: "02/15/2024"
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={{ ...mockStepData, approval_status: "APPROVED" }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Complete Step 5");
            fireEvent.click(button);

            expect(mockHandleStepFiveComplete).toHaveBeenCalledWith(5);
        });
    });

    describe("Cancel Button", () => {
        it("renders Cancel button", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("Cancel button is disabled when checkbox is not checked", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Cancel");
            expect(button).toBeDisabled();
        });

        it("Cancel button is enabled when checkbox is checked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Cancel");
            expect(button).not.toBeDisabled();
        });

        it("Cancel button calls cancelModalStep5 when clicked", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                isPreAwardComplete: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const button = screen.getByText("Cancel");
            fireEvent.click(button);

            expect(mockCancelModalStep5).toHaveBeenCalled();
        });
    });

    describe("Confirmation Modal", () => {
        it("renders modal when showModal is true", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                showModal: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        });

        it("modal displays correct heading", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                showModal: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(
                screen.getByText("Are you sure you want to cancel this task? Your input will not be saved.")
            ).toBeInTheDocument();
        });

        it("modal displays correct button text", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                showModal: true
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Cancel Task")).toBeInTheDocument();
            expect(screen.getByText("Continue Editing")).toBeInTheDocument();
        });

        it("does not render modal when showModal is false", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
        });
    });

    describe("Validation Messages", () => {
        it("displays validation errors for target completion date", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: {
                    getErrors: vi.fn((field) =>
                        field === "targetCompletionDate" ? ["Date must be in the future"] : []
                    ),
                    hasErrors: vi.fn(() => false)
                }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Date must be in the future")).toBeInTheDocument();
        });

        it("displays validation errors for date completed", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: {
                    getErrors: vi.fn((field) => (field === "dateCompleted" ? ["Date cannot be in the future"] : [])),
                    hasErrors: vi.fn(() => false)
                }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Date cannot be in the future")).toBeInTheDocument();
        });

        it("displays validation errors for users field", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: {
                    getErrors: vi.fn((field) => (field === "users" ? ["User is required"] : [])),
                    hasErrors: vi.fn(() => false)
                }
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("User is required")).toBeInTheDocument();
        });
    });

    describe("Read-Only Mode", () => {
        it("renders TermTags and no form controls when isReadOnly is true and PENDING", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    isReadOnly={true}
                />
            );

            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /complete step 5/i })).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
        });

        it("shows TBD for empty fields in read-only PENDING mode", () => {
            useProcurementTrackerStepFive.mockReturnValue({
                ...defaultHookReturn,
                step5CompletedByUserName: "",
                step5DateCompletedLabel: "",
                step5TargetCompletionDateLabel: "",
                step5NotesLabel: ""
            });

            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    isReadOnly={true}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            const tagTexts = termTags.map((tag) => tag.textContent);
            expect(tagTexts.some((text) => text.includes("TBD"))).toBe(true);
            expect(screen.getByText("None")).toBeInTheDocument();
        });

        it("shows checkmark icon when COMPLETED and read-only", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="COMPLETED"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    isReadOnly={true}
                />
            );

            expect(
                screen.getByText(
                    /The Agreement was edited to match the Vendor Price Sheet and any final Budget Changes were approved/i
                )
            ).toBeInTheDocument();
            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
        });

        it("renders form controls when isReadOnly is false and PENDING", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    isReadOnly={false}
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByText("Complete Step 5")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined stepFiveData gracefully", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={undefined}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(screen.getByText("Target Completion Date (optional)")).toBeInTheDocument();
        });

        it("handles empty authorizedUsers array", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={[]}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            const combobox = screen.getByTestId("users-combobox");
            expect(combobox.getAttribute("data-user-count")).toBe("0");
        });

        it("handles missing handleSetCompletedStepNumber prop", () => {
            render(
                <ProcurementTrackerStepFive
                    stepStatus="PENDING"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                />
            );

            expect(screen.getByText("Complete Step 5")).toBeInTheDocument();
        });

        it("renders nothing for unknown step status", () => {
            const { container } = render(
                <ProcurementTrackerStepFive
                    stepStatus="UNKNOWN"
                    stepFiveData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    agreementId={13}
                />
            );

            expect(container).toBeEmptyDOMElement();
        });
    });
});

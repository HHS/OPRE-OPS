import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepOne from "./ProcurementTrackerStepOne";
import useProcurementTrackerStepOne from "./ProcurementTrackerStepOne.hooks";
vi.mock("./ProcurementTrackerStepOne.hooks");
vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "2024-01-30")
    };
});
vi.mock("../../../UI/Form/TextArea", () => ({
    default: ({ label, value, onChange, isDisabled, maxLength, name, className, messages }) => (
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
            {messages && messages.length > 0 && (
                <div data-testid="text-area-validation-messages">
                    {messages.map((msg, idx) => (
                        <span key={idx}>{msg}</span>
                    ))}
                </div>
            )}
        </div>
    )
}));
vi.mock("../../../UI/Term/TermTag", () => ({
    default: ({ term, description }) => (
        <div data-testid="term-tag">
            <dt>{term}</dt>
            <dd>{description}</dd>
        </div>
    )
}));
vi.mock("../../UsersComboBox", () => ({
    default: ({ label, selectedUser, setSelectedUser, isDisabled, messages, onChange, users }) => (
        <div data-testid="users-combobox">
            <label>{label}</label>
            <select
                disabled={isDisabled}
                value={selectedUser?.id || ""}
                onChange={(e) => {
                    setSelectedUser({ id: parseInt(e.target.value) });
                    if (onChange) onChange("users", parseInt(e.target.value));
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
            {messages && messages.length > 0 && (
                <div data-testid="validation-messages">
                    {messages.map((msg, idx) => (
                        <span key={idx}>{msg}</span>
                    ))}
                </div>
            )}
        </div>
    )
}));
vi.mock("../../../UI/Modals/ConfirmationModal", () => ({
    default: ({ heading, actionButtonText, secondaryButtonText }) =>
        heading ? (
            <div data-testid="confirmation-modal">
                <h2>{heading}</h2>
                <button>{actionButtonText}</button>
                <button>{secondaryButtonText}</button>
            </div>
        ) : null
}));

describe("ProcurementTrackerStepOne", () => {
    const mockSetIsPreSolicitationPackageSent = vi.fn();
    const mockSetSelectedUser = vi.fn();
    const mockSetStep1DateCompleted = vi.fn();
    const mockSetStep1Notes = vi.fn();
    const mockHandleStep1Complete = vi.fn();
    const mockCancelStep1 = vi.fn();
    const mockRunValidate = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => [])
    };

    const MockDatePicker = ({ label, hint, value, onChange, isDisabled, maxDate, id, name, messages }) => (
        <div data-testid="date-picker">
            <label htmlFor={id}>{label}</label>
            <span>{hint}</span>
            <input
                type="date"
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                disabled={isDisabled}
                max={typeof maxDate === "string" ? maxDate : maxDate?.toISOString().split("T")[0]}
            />
            {messages && messages.length > 0 && (
                <div data-testid="date-validation-messages">
                    {messages.map((msg, idx) => (
                        <span key={idx}>{msg}</span>
                    ))}
                </div>
            )}
        </div>
    );

    const defaultHookReturn = {
        isPreSolicitationPackageSent: false,
        setIsPreSolicitationPackageSent: mockSetIsPreSolicitationPackageSent,
        selectedUser: {},
        setSelectedUser: mockSetSelectedUser,
        step1DateCompleted: "",
        setStep1DateCompleted: mockSetStep1DateCompleted,
        MemoizedDatePicker: MockDatePicker,
        step1Notes: "",
        setStep1Notes: mockSetStep1Notes,
        handleStep1Complete: mockHandleStep1Complete,
        cancelStep1: mockCancelStep1,
        disableStep1Buttons: true,
        step1CompletedByUserName: "John Doe",
        step1DateCompletedLabel: "January 15, 2024",
        step1NotesLabel: "Test notes",
        showModal: false,
        setShowModal: vi.fn(),
        modalProps: {},
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes
    };

    const mockStepOneData = { id: 1 };

    const mockAllUsers = [
        { id: 123, full_name: "John Doe", email: "john@example.com" },
        { id: 456, full_name: "Jane Smith", email: "jane@example.com" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepOne.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State Rendering", () => {
        it("renders all form fields: checkbox, UsersComboBox, DatePicker, TextArea, buttons", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("date-picker")).toBeInTheDocument();
            expect(screen.getByTestId("text-area")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /complete step 1/i })).toBeInTheDocument();
        });

        it("checkbox label displays correct text", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(
                screen.getByText("The pre-solicitation package has been sent to the Procurement Shop for review")
            ).toBeInTheDocument();
        });

        it("instructional paragraph visible", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(
                screen.getByText(/Once the pre-solicitation package is sufficiently drafted and signed by all parties/i)
            ).toBeInTheDocument();
        });

        it("UsersComboBox has correct props (label, disabled state)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            expect(select).toBeDisabled();
        });

        it("DatePicker has correct props (label, hint, maxDate, disabled state)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("mm/dd/yyyy")).toBeInTheDocument();
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            expect(dateInput).toBeDisabled();
            expect(dateInput).toHaveAttribute("max");
        });

        it("TextArea has correct props (label, maxLength 750, disabled state)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");
            expect(textarea).toBeDisabled();
            expect(textarea).toHaveAttribute("maxLength", "750");
        });

        it("buttons have correct labels and data-cy attributes", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toHaveAttribute("data-cy", "cancel-button");

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            expect(completeButton).toHaveAttribute("data-cy", "continue-btn");
        });

        it("complete button disabled when disableStep1Buttons is true", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                disableStep1Buttons: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button enabled when disableStep1Buttons is false", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                disableStep1Buttons: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            expect(completeButton).not.toBeDisabled();
        });
    });

    describe("PENDING State User Interactions", () => {
        it("checkbox toggles on click (calls setIsPreSolicitationPackageSent)", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(mockSetIsPreSolicitationPackageSent).toHaveBeenCalledWith(true);
        });

        it("checkbox can be unchecked", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(mockSetIsPreSolicitationPackageSent).toHaveBeenCalledWith(false);
        });

        it("UsersComboBox calls setSelectedUser when user selected", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            fireEvent.change(select, { target: { value: "123" } });

            expect(mockSetSelectedUser).toHaveBeenCalledWith({ id: 123 });
        });

        it("DatePicker calls setStep1DateCompleted on date change", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            fireEvent.change(dateInput, { target: { value: "2024-03-20" } });

            expect(mockSetStep1DateCompleted).toHaveBeenCalledWith("2024-03-20");
        });

        it("TextArea calls setStep1Notes on input change", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");
            fireEvent.change(textarea, { target: { value: "New notes" } });

            expect(mockSetStep1Notes).toHaveBeenCalledWith("New notes");
        });

        it("complete button calls handleStep1Complete with stepOneData.id", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                disableStep1Buttons: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            fireEvent.click(completeButton);

            expect(mockHandleStep1Complete).toHaveBeenCalledWith(1);
        });

        it("form fields disabled when checkbox unchecked", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");

            expect(select).toBeDisabled();
            expect(dateInput).toBeDisabled();
            expect(textarea).toBeDisabled();
        });

        it("form fields enabled when checkbox checked", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");

            expect(select).not.toBeDisabled();
            expect(dateInput).not.toBeDisabled();
            expect(textarea).not.toBeDisabled();
        });

        it("updates multiple fields in sequence", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");

            fireEvent.change(select, { target: { value: "456" } });
            fireEvent.change(dateInput, { target: { value: "2024-03-25" } });
            fireEvent.change(textarea, { target: { value: "Some notes" } });

            expect(mockSetSelectedUser).toHaveBeenCalledWith({ id: 456 });
            expect(mockSetStep1DateCompleted).toHaveBeenCalledWith("2024-03-25");
            expect(mockSetStep1Notes).toHaveBeenCalledWith("Some notes");
        });
    });

    describe("ACTIVE State Rendering", () => {
        it("renders all form fields: checkbox, UsersComboBox, DatePicker, TextArea, buttons", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByTestId("users-combobox")).toBeInTheDocument();
            expect(screen.getByTestId("date-picker")).toBeInTheDocument();
            expect(screen.getByTestId("text-area")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /complete step 1/i })).toBeInTheDocument();
        });

        it("form fields are interactive in ACTIVE state", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                isPreSolicitationPackageSent: true
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    authorizedUsers={mockAllUsers}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = screen.getByTestId("date-picker").querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const textarea = screen.getByTestId("text-area").querySelector("textarea");

            expect(select).not.toBeDisabled();
            expect(dateInput).not.toBeDisabled();
            expect(textarea).not.toBeDisabled();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders read-only display with instructional paragraph", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(
                screen.getByText(
                    /When the pre-solicitation package has been sufficiently drafted and signed by all parties/i
                )
            ).toBeInTheDocument();
        });

        it("displays completion text", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(
                screen.getByText("The pre-solicitation package has been sent to the Procurement Shop for review")
            ).toBeInTheDocument();
        });

        it("shows TermTag components (Completed By, Date Completed)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags).toHaveLength(2);
        });

        it("displays formatted user name from step1CompletedByUserName", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Completed By")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
        });

        it("displays formatted date from step1DateCompletedLabel", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
        });

        it("displays notes from step1NotesLabel with correct styling", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Notes")).toBeInTheDocument();
            expect(screen.getByText("Test notes")).toBeInTheDocument();

            const dt = screen.getByText("Notes");
            expect(dt.tagName).toBe("DT");
            expect(dt).toHaveClass("margin-0", "text-base-dark", "margin-top-3", "font-12px");

            const dd = screen.getByText("Test notes");
            expect(dd.tagName).toBe("DD");
            expect(dd).toHaveClass("margin-0", "margin-top-1");
        });
    });

    describe("COMPLETED State Validation", () => {
        it("does not render form controls (checkbox, fields, buttons)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("date-picker")).not.toBeInTheDocument();
            expect(screen.queryByTestId("text-area")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /complete step 1/i })).not.toBeInTheDocument();
        });
    });

    describe("Modal Integration", () => {
        it("renders ConfirmationModal when showModal is true", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                showModal: true,
                modalProps: {
                    heading: "Are you sure you want to cancel this task? Your input will not be saved.",
                    actionButtonText: "Cancel Task",
                    secondaryButtonText: "Continue Editing",
                    handleConfirm: vi.fn()
                }
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        });

        it("does not render ConfirmationModal when showModal is false", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                showModal: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
        });
    });

    describe("Validation Display", () => {
        it("displays validation errors for users", () => {
            const mockValidatorResWithErrors = {
                getErrors: vi.fn((field) => {
                    if (field === "users") {
                        return ["This is required information"];
                    }
                    return [];
                })
            };

            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("This is required information")).toBeInTheDocument();
        });

        it("displays validation errors for date completed", () => {
            const mockValidatorResWithErrors = {
                getErrors: vi.fn((field) => {
                    if (field === "dateCompleted") {
                        return ["Date must be MM/DD/YYYY"];
                    }
                    return [];
                })
            };

            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Date must be MM/DD/YYYY")).toBeInTheDocument();
        });
    });

    describe("Inactive Tracker", () => {
        it("disables form controls when isActiveStep is false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("disables buttons when isActiveStep is false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            const completeButton = screen.getByRole("button", { name: /complete step 1/i });

            expect(cancelButton).toBeDisabled();
            expect(completeButton).toBeDisabled();
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined stepOneData gracefully", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={undefined}
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
        });

        it("handles missing stepOneData.id", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                disableStep1Buttons: false
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={{}}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            fireEvent.click(completeButton);

            expect(mockHandleStep1Complete).toHaveBeenCalledWith(undefined);
        });

        it("renders correctly when stepStatus is neither PENDING, ACTIVE, nor COMPLETED", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="SKIPPED"
                    stepOneData={mockStepOneData}
                />
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByTestId("term-tag")).not.toBeInTheDocument();
        });

        it("handles empty notes in COMPLETED state", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                step1NotesLabel: ""
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            expect(screen.getByText("Notes")).toBeInTheDocument();
            // eslint-disable-next-line testing-library/no-node-access
            const dd = screen.getByText("Notes").nextElementSibling;
            expect(dd.textContent).toBe("None");
        });
    });

    describe("Accessibility", () => {
        it("checkbox has correct id and htmlFor attributes", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toHaveAttribute("id", "step-1-checkbox");

            const label = screen.getByText(
                "The pre-solicitation package has been sent to the Procurement Shop for review"
            );
            expect(label).toHaveAttribute("for", "step-1-checkbox");
        });

        it("buttons have accessible labels", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toHaveAccessibleName();

            const completeButton = screen.getByRole("button", { name: /complete step 1/i });
            expect(completeButton).toHaveAccessibleName();
        });

        it("fieldset wraps PENDING state form elements", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            const fieldset = screen.getByRole("group");
            expect(fieldset).toBeInTheDocument();
            expect(fieldset.tagName).toBe("FIELDSET");
        });

        it("definition list structure correct in COMPLETED state", () => {
            const { container } = render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
            const dl = container.querySelector("dl");
            expect(dl).toBeInTheDocument();
            expect(dl.tagName).toBe("DL");
        });
    });

    describe("Authorization", () => {
        beforeEach(() => {
            // Use a factory function that can accept props to determine mock behavior
            useProcurementTrackerStepOne.mockImplementation(
                (stepOneData, handleSetCompletedStepNumber, isEditable = true) => ({
                    isPreSolicitationPackageSent: true,
                    setIsPreSolicitationPackageSent: mockSetIsPreSolicitationPackageSent,
                    selectedUser: mockAllUsers[0],
                    setSelectedUser: mockSetSelectedUser,
                    step1DateCompleted: "2024-01-15",
                    setStep1DateCompleted: mockSetStep1DateCompleted,
                    MemoizedDatePicker: ({ label, value, onChange, isDisabled }) => (
                        <div data-testid="datepicker">
                            <label>{label}</label>
                            <input
                                type="text"
                                value={value}
                                onChange={onChange}
                                disabled={isDisabled}
                            />
                        </div>
                    ),
                    step1Notes: "Test notes",
                    setStep1Notes: mockSetStep1Notes,
                    handleStep1Complete: mockHandleStep1Complete,
                    cancelModalStep1: mockCancelStep1,
                    // Hook properly calculates disable state based on isEditable
                    disableStep1Buttons: !isEditable || !true || !mockAllUsers[0]?.id || !"2024-01-15",
                    step1CompletedByUserName: "Jane Smith",
                    step1DateCompletedLabel: "January 15, 2024",
                    step1NotesLabel: "Completed notes",
                    modalProps: {
                        heading: "",
                        actionButtonText: "",
                        secondaryButtonText: "",
                        handleConfirm: vi.fn()
                    },
                    showModal: false,
                    setShowModal: vi.fn(),
                    runValidate: mockRunValidate,
                    validatorRes: mockValidatorRes
                })
            );
        });

        it("should disable checkbox when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });

        it("should disable UsersComboBox when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const select = screen.getByRole("combobox");
            expect(select).toBeDisabled();
        });

        it("should disable DatePicker when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const datepicker = screen.getByTestId("datepicker");
            // eslint-disable-next-line testing-library/no-node-access
            const input = datepicker.querySelector("input");
            expect(input).toBeDisabled();
        });

        it("should disable TextArea when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const textarea = screen.getByRole("textbox", { name: /notes/i });
            expect(textarea).toBeDisabled();
        });

        it("should disable Cancel button when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const cancelButton = screen.getByText("Cancel");
            expect(cancelButton).toBeDisabled();
        });

        it("should disable Complete button when isEditable=false", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const completeButton = screen.getByText("Complete Step 1");
            expect(completeButton).toBeDisabled();
        });

        it("should enable form elements when isEditable=true and conditions are met", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            const select = screen.getByRole("combobox");
            const textarea = screen.getByRole("textbox", { name: /notes/i });
            const cancelButton = screen.getByText("Cancel");

            expect(checkbox).not.toBeDisabled();
            expect(select).not.toBeDisabled();
            expect(textarea).not.toBeDisabled();
            expect(cancelButton).not.toBeDisabled();
        });

        it("should show completed state correctly regardless of isEditable", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    isActiveStep={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            // Completed state should show read-only view for all users
            expect(screen.getByText(/sent to the Procurement Shop for review/i)).toBeInTheDocument();
            expect(screen.getByText("Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
        });

        it("should default isEditable to true when not provided (backward compatibility)", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    isActiveStep={true}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    // isDisabled not provided - should default to undefined/false
                />
            );

            const checkbox = screen.getByRole("checkbox");
            // Checkbox should be enabled because isActiveStep=true and isDisabled defaults to false
            expect(checkbox).not.toBeDisabled();
        });
    });

    describe("Read-Only Mode", () => {
        it("renders TermTags and no form controls when isReadOnly is true and PENDING", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isReadOnly={true}
                />
            );

            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /complete step 1/i })).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
        });

        it("shows TBD for empty fields in read-only PENDING mode", () => {
            useProcurementTrackerStepOne.mockReturnValue({
                ...defaultHookReturn,
                step1CompletedByUserName: "",
                step1DateCompletedLabel: "",
                step1NotesLabel: ""
            });

            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isReadOnly={true}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            const tagTexts = termTags.map((tag) => tag.textContent);
            expect(tagTexts.some((text) => text.includes("TBD"))).toBe(true);
            expect(screen.getByText("None")).toBeInTheDocument();
        });

        it("does not show checkmark icon when PENDING and read-only", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="PENDING"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isReadOnly={true}
                />
            );

            expect(screen.queryByText(/pre-solicitation package has been sent/i)).not.toBeInTheDocument();
        });

        it("shows checkmark icon when COMPLETED and read-only", () => {
            render(
                <ProcurementTrackerStepOne
                    stepStatus="COMPLETED"
                    stepOneData={mockStepOneData}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    authorizedUsers={mockAllUsers}
                    isReadOnly={true}
                />
            );

            expect(
                screen.getByText(/pre-solicitation package has been sent to the Procurement Shop for review/i)
            ).toBeInTheDocument();
            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
        });
    });
});

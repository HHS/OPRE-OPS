// @ts-nocheck
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import ProcurementTrackerStepThree from "./ProcurementTrackerStepThree";
import useProcurementTrackerStepThree from "./ProcurementTrackerStepThree.hooks";
import DatePicker from "../../../UI/USWDS/DatePicker";

vi.mock("./ProcurementTrackerStepThree.hooks");
vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "01/30/2024")
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
            <button
                data-testid="modal-confirm-button"
                onClick={() => {
                    handleConfirm();
                    setShowModal(false);
                }}
            >
                {actionButtonText}
            </button>
            <button
                data-testid="modal-cancel-button"
                onClick={() => setShowModal(false)}
            >
                {secondaryButtonText}
            </button>
        </div>
    )
}));

describe("ProcurementTrackerStepThree", () => {
    const mockSetSelectedUser = vi.fn();
    const mockSetStep3DateCompleted = vi.fn();
    const mockSetSolicitationPeriodStartDate = vi.fn();
    const mockSetSolicitationPeriodEndDate = vi.fn();
    const mockRunValidate = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => []),
        hasErrors: vi.fn(() => false)
    };

    const mockSetStep3Notes = vi.fn();
    const mockSetIsSolicitationClosed = vi.fn();
    const mockSetShowModal = vi.fn();
    const mockCancelModalStep3 = vi.fn();
    const mockHandleStep3Complete = vi.fn();
    const mockHandleSetCompletedStepNumber = vi.fn();

    const defaultHookReturn = {
        selectedUser: {},
        setSelectedUser: mockSetSelectedUser,
        step3DateCompleted: "",
        setStep3DateCompleted: mockSetStep3DateCompleted,
        solicitationPeriodStartDate: "",
        setSolicitationPeriodStartDate: mockSetSolicitationPeriodStartDate,
        solicitationPeriodEndDate: "",
        setSolicitationPeriodEndDate: mockSetSolicitationPeriodEndDate,
        step3Notes: "",
        setStep3Notes: mockSetStep3Notes,
        step3CompletedByUserName: "John Doe",
        step3DateCompletedLabel: "January 15, 2024",
        solicitationStartDateLabel: "February 1, 2024",
        solicitationEndDateLabel: "February 28, 2024",
        step3NotesLabel: "Test notes",
        runValidate: mockRunValidate,
        validatorRes: mockValidatorRes,
        MemoizedDatePicker: DatePicker,
        isSolicitationClosed: false,
        setIsSolicitationClosed: mockSetIsSolicitationClosed,
        showModal: false,
        setShowModal: mockSetShowModal,
        modalProps: {},
        cancelModalStep3: mockCancelModalStep3,
        handleStep3Complete: mockHandleStep3Complete
    };

    const mockStepData = { id: 1 };

    const mockAllUsers = [
        { id: 123, full_name: "John Doe", email: "john@example.com" },
        { id: 456, full_name: "Jane Smith", email: "jane@example.com" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useProcurementTrackerStepThree.mockReturnValue(defaultHookReturn);
    });

    describe("PENDING State Rendering", () => {
        it("renders all form fields: Task Completed By, Date Completed, Solicitation Period dates", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - Start")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - End")).toBeInTheDocument();
        });

        it("renders instructional paragraph", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText(/Once the Procurement Shop has posted the Solicitation/i)).toBeInTheDocument();
        });

        it("Date Completed has correct props (label, hint, maxDate)", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );

            expect(dateCompletedPicker).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getAllByText("mm/dd/yyyy").length).toBeGreaterThan(0);

            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = dateCompletedPicker.querySelector("input");
            expect(dateInput).toHaveAttribute("data-max-date");
        });

        it("Solicitation Period - Start has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );

            expect(startDatePicker).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - Start")).toBeInTheDocument();
        });

        it("Solicitation Period - End has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );

            expect(endDatePicker).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - End")).toBeInTheDocument();
        });

        it("UsersComboBox has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            const comboBox = screen.getByTestId("users-combobox");
            expect(comboBox).toHaveClass("width-card-lg", "margin-top-5");
        });

        it("renders checkbox with correct label", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeInTheDocument();
            expect(
                screen.getByText(
                    "The Solicitation is closed to vendors, vendor questions have been answered, and evaluations can start"
                )
            ).toBeInTheDocument();
        });

        it("checkbox has correct id and htmlFor attributes", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toHaveAttribute("id", "step-3-checkbox");
            // eslint-disable-next-line testing-library/no-node-access
            const label = checkbox.parentElement.querySelector("label");
            expect(label).toHaveAttribute("for", "step-3-checkbox");
        });

        it("checkbox uses USWDS styling classes", () => {
            const { container } = render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toHaveClass("usa-checkbox__input");
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const checkboxContainer = container.querySelector(".usa-checkbox");
            expect(checkboxContainer).toBeInTheDocument();
            // eslint-disable-next-line testing-library/no-node-access
            const label = checkbox.parentElement.querySelector("label");
            expect(label).toHaveClass("usa-checkbox__label");
        });
    });

    describe("PENDING State User Interactions", () => {
        it("Date Completed calls runValidate and setStep3DateCompleted on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = dateCompletedPicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "03/20/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "03/20/2024");
            expect(mockSetStep3DateCompleted).toHaveBeenCalledWith("03/20/2024");
        });

        it("Solicitation Period - Start calls runValidate and setSolicitationPeriodStartDate on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = startDatePicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "02/01/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("solicitationPeriodStartDate", "02/01/2024");
            expect(mockSetSolicitationPeriodStartDate).toHaveBeenCalledWith("02/01/2024");
        });

        it("Solicitation Period - End calls runValidate and setSolicitationPeriodEndDate on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = endDatePicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "02/28/2024" } });

            expect(mockRunValidate).toHaveBeenCalledWith("solicitationPeriodEndDate", "02/28/2024");
            expect(mockSetSolicitationPeriodEndDate).toHaveBeenCalledWith("02/28/2024");
        });

        it("UsersComboBox calls setSelectedUser when user selected", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            fireEvent.change(select, { target: { value: "123" } });

            expect(mockSetSelectedUser).toHaveBeenCalledWith({ id: 123 });
        });

        it("UsersComboBox calls runValidate when user selected", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const select = screen.getByTestId("users-combobox").querySelector("select");
            fireEvent.change(select, { target: { value: "456" } });

            expect(mockRunValidate).toHaveBeenCalledWith("users", 456);
        });

        it("checkbox toggles from unchecked to checked", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();

            fireEvent.click(checkbox);

            expect(mockSetIsSolicitationClosed).toHaveBeenCalledWith(true);
        });

        it("checkbox toggles from checked to unchecked", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeChecked();

            fireEvent.click(checkbox);

            expect(mockSetIsSolicitationClosed).toHaveBeenCalledWith(false);
        });

        it("setIsSolicitationClosed called with correct value", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            fireEvent.click(checkbox);

            expect(mockSetIsSolicitationClosed).toHaveBeenCalledTimes(1);
            expect(mockSetIsSolicitationClosed).toHaveBeenCalledWith(true);
        });
    });

    describe("ACTIVE State Rendering", () => {
        it("renders all form fields in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="ACTIVE"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - Start")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - End")).toBeInTheDocument();
            expect(screen.getByRole("checkbox")).toBeInTheDocument();
        });

        it("form fields are interactive when checkbox checked in ACTIVE state", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="ACTIVE"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isActiveStep={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");

            expect(usersSelect).not.toBeDisabled();
            expect(completedInput).not.toBeDisabled();
            expect(notesInput).not.toBeDisabled();
        });
    });

    describe("Disable Logic", () => {
        it("controlled fields disabled when checkbox unchecked", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");

            expect(usersSelect).toBeDisabled();
            expect(completedInput).toBeDisabled();
            expect(notesInput).toBeDisabled();
        });

        it("controlled fields enabled when checkbox checked AND tracker active", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");

            expect(usersSelect).not.toBeDisabled();
            expect(completedInput).not.toBeDisabled();
            expect(notesInput).not.toBeDisabled();
        });

        it("controlled fields disabled when tracker inactive (regardless of checkbox)", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");

            expect(usersSelect).toBeDisabled();
            expect(completedInput).toBeDisabled();
            expect(notesInput).toBeDisabled();
        });

        it("solicitation date fields remain independent of checkbox", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const startInput = startDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const endInput = endDatePicker.querySelector("input");

            expect(startInput).not.toBeDisabled();
            expect(endInput).not.toBeDisabled();
        });

        it("checkbox disabled when tracker not active", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeDisabled();
        });
    });

    describe("Solicitation Dates Display", () => {
        it("displays solicitation dates as TermTags when dates are saved in PENDING state", () => {
            const mockStepDataWithSavedDates = {
                ...mockStepData,
                solicitation_period_start_date: "02/01/2024",
                solicitation_period_end_date: "02/28/2024"
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationStartDateLabel: "February 1, 2024",
                solicitationEndDateLabel: "February 28, 2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepDataWithSavedDates}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // Verify TermTags are displayed for solicitation dates
            expect(screen.getByText("Solicitation Period - Start")).toBeInTheDocument();
            expect(screen.getByText("February 1, 2024")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period - End")).toBeInTheDocument();
            expect(screen.getByText("February 28, 2024")).toBeInTheDocument();

            // Verify date input fields are not shown
            const datePickers = screen.queryAllByTestId("date-picker");
            const solicitationStartPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );
            const solicitationEndPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );

            expect(solicitationStartPicker).not.toBeDefined();
            expect(solicitationEndPicker).not.toBeDefined();
        });
    });

    describe("COMPLETED State Rendering", () => {
        it("renders read-only display with instructional paragraph", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(
                screen.getByText(/The Procurement Shop posts the solicitation on the street for vendors to respond/i)
            ).toBeInTheDocument();
        });

        it("shows TermTag components (Completed By, Date Completed, Solicitation Period dates)", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const termTags = screen.getAllByTestId("term-tag");
            expect(termTags).toHaveLength(4);
        });

        it("displays formatted user name from step3CompletedByUserName", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Completed By")).toBeInTheDocument();
            expect(screen.getByText("John Doe")).toBeInTheDocument();
        });

        it("displays formatted date from step3DateCompletedLabel", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
        });

        it("displays formatted solicitation period start date", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Solicitation Period - Start")).toBeInTheDocument();
            expect(screen.getByText("February 1, 2024")).toBeInTheDocument();
        });

        it("displays formatted solicitation period end date", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Solicitation Period - End")).toBeInTheDocument();
            expect(screen.getByText("February 28, 2024")).toBeInTheDocument();
        });

        it("shows checkmark icon with checkbox label text", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(
                screen.getByText(
                    "The Solicitation is closed to vendors, vendor questions have been answered, and evaluations can start"
                )
            ).toBeInTheDocument();
        });

        it("uses FontAwesome icon correctly", () => {
            const { container } = render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
            const icon = container.querySelector("svg[data-icon='circle-check']");
            expect(icon).toBeInTheDocument();
        });
    });

    describe("COMPLETED State Validation", () => {
        it("does not render form controls (checkbox, date pickers, combobox, buttons)", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
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

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
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

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("This is required information")).toBeInTheDocument();
        });

        it("displays validation errors for solicitation period start date", () => {
            const mockValidatorResWithErrors = {
                getErrors: vi.fn((field) => {
                    if (field === "solicitationPeriodStartDate") {
                        return ["Start date must be earlier than end date"];
                    }
                    return [];
                }),
                hasErrors: vi.fn(() => false)
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Start date must be earlier than end date")).toBeInTheDocument();
        });
    });

    describe("Inactive Tracker", () => {
        it("disables pending form controls when there is no active tracker", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            // eslint-disable-next-line testing-library/no-node-access
            const usersSelect = screen.getByTestId("users-combobox").querySelector("select");
            const datePickers = screen.getAllByTestId("date-picker");
            const completedDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const completedInput = completedDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const startInput = startDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const endInput = endDatePicker.querySelector("input");
            // eslint-disable-next-line testing-library/no-node-access
            const notesInput = screen.getByTestId("text-area").querySelector("textarea");

            expect(usersSelect).toBeDisabled();
            expect(completedInput).toBeDisabled();
            expect(startInput).toBeDisabled();
            expect(endInput).toBeDisabled();
            expect(notesInput).toBeDisabled();
        });
    });

    describe("Edge Cases", () => {
        it("handles undefined stepData gracefully", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={undefined}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByRole("checkbox")).toBeInTheDocument();
            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
        });

        it("renders correctly when stepStatus is neither PENDING, ACTIVE, nor COMPLETED", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="SKIPPED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByText("Task Completed By")).not.toBeInTheDocument();
            expect(screen.queryByTestId("term-tag")).not.toBeInTheDocument();
        });

        it("handles empty authorizedUsers array", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={[]}
                    isDisabled={false}
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const fieldset = screen.getByRole("group");
            expect(fieldset).toBeInTheDocument();
            expect(fieldset.tagName).toBe("FIELDSET");
        });

        it("definition list structure correct in COMPLETED state", () => {
            const { container } = render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
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
            <ProcurementTrackerStepThree
                stepStatus="PENDING"
                stepThreeData={mockStepData}
                authorizedUsers={mockAllUsers}
                isDisabled={false}
            />
        );

        expect(screen.getByTestId("text-area")).toBeInTheDocument();
        expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
    });

    it("TextArea has correct maxLength of 750", () => {
        render(
            <ProcurementTrackerStepThree
                stepStatus="PENDING"
                stepThreeData={mockStepData}
                authorizedUsers={mockAllUsers}
                isDisabled={false}
            />
        );

        // eslint-disable-next-line testing-library/no-node-access
        const textarea = screen.getByTestId("text-area").querySelector("textarea");
        expect(textarea).toHaveAttribute("maxLength", "750");
    });

    it("displays notes in COMPLETED state with correct styling", () => {
        const mockCompletedStepData = {
            ...mockStepData,
            notes: "Test notes for step three"
        };

        useProcurementTrackerStepThree.mockReturnValue({
            ...defaultHookReturn,
            step3NotesLabel: "Test notes for step three"
        });

        render(
            <ProcurementTrackerStepThree
                stepStatus="COMPLETED"
                stepThreeData={mockCompletedStepData}
                authorizedUsers={mockAllUsers}
                isDisabled={false}
            />
        );

        expect(screen.getByText("Notes")).toBeInTheDocument();
        expect(screen.getByText("Test notes for step three")).toBeInTheDocument();

        const dt = screen.getByText("Notes");
        expect(dt.tagName).toBe("DT");
        expect(dt).toHaveClass("margin-0", "text-base-dark", "margin-top-3", "font-12px");

        const dd = screen.getByText("Test notes for step three");
        expect(dd.tagName).toBe("DD");
        expect(dd).toHaveClass("margin-0", "margin-top-1");
    });

    it("handles empty notes in COMPLETED state", () => {
        const mockCompletedStepData = {
            ...mockStepData,
            notes: ""
        };

        useProcurementTrackerStepThree.mockReturnValue({
            ...defaultHookReturn,
            step3NotesLabel: ""
        });

        render(
            <ProcurementTrackerStepThree
                stepStatus="COMPLETED"
                stepThreeData={mockCompletedStepData}
                authorizedUsers={mockAllUsers}
                isDisabled={false}
            />
        );

        expect(screen.getByText("Notes")).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-node-access
        const dd = screen.getByText("Notes").nextElementSibling;
        expect(dd.textContent).toBe("");
    });

    describe("Button Rendering", () => {
        it("renders save button for solicitation dates with correct label and data-cy", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).toHaveAttribute("data-cy", "solicitation-dates-save-btn");
        });

        it("save button for solicitation dates is disabled when tracker not active", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when start date is empty", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationPeriodStartDate: "",
                solicitationPeriodEndDate: "02/28/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when end date is empty", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationPeriodStartDate: "02/01/2024",
                solicitationPeriodEndDate: ""
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when start date has validation errors", () => {
            const mockValidatorResWithStartDateError = {
                getErrors: vi.fn(() => []),
                hasErrors: vi.fn((fieldName) => fieldName === "solicitationPeriodStartDate")
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationPeriodStartDate: "13/40/2024",
                solicitationPeriodEndDate: "02/28/2024",
                validatorRes: mockValidatorResWithStartDateError
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is disabled when end date has validation errors", () => {
            const mockValidatorResWithEndDateError = {
                getErrors: vi.fn(() => []),
                hasErrors: vi.fn((fieldName) => fieldName === "solicitationPeriodEndDate")
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationPeriodStartDate: "02/01/2024",
                solicitationPeriodEndDate: "01/01/2024",
                validatorRes: mockValidatorResWithEndDateError
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).toBeDisabled();
        });

        it("save button is enabled when both dates are valid and filled", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                solicitationPeriodStartDate: "02/01/2024",
                solicitationPeriodEndDate: "02/28/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const saveButton = screen.getByRole("button", { name: /^save$/i });
            expect(saveButton).not.toBeDisabled();
        });

        it("renders cancel button with correct label and data-cy", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toBeInTheDocument();
            expect(cancelButton).toHaveAttribute("data-cy", "cancel-button");
        });

        it("renders complete button with correct label and data-cy", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeInTheDocument();
            expect(completeButton).toHaveAttribute("data-cy", "continue-btn");
        });

        it("buttons have correct styling classes", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toHaveClass("usa-button", "usa-button--unstyled", "margin-right-2");

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toHaveClass("usa-button");
        });

        it("buttons are in flex container with correct layout classes", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            // eslint-disable-next-line testing-library/no-node-access
            const buttonContainer = cancelButton.parentElement;
            expect(buttonContainer).toHaveClass("margin-top-2", "display-flex", "flex-justify-end");
        });
    });

    describe("Button Interaction", () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("cancel button calls cancelModalStep3 when clicked", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024",
                cancelModalStep3: mockCancelModalStep3
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            fireEvent.click(cancelButton);

            expect(mockCancelModalStep3).toHaveBeenCalledTimes(1);
        });

        it("complete button calls handleStep3Complete with correct stepId", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024",
                handleStep3Complete: mockHandleStep3Complete
            });

            const stepDataWithDates = {
                ...mockStepData,
                solicitation_period_start_date: "02/01/2024",
                solicitation_period_end_date: "02/28/2024"
            };

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={stepDataWithDates}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            fireEvent.click(completeButton);

            expect(mockHandleStep3Complete).toHaveBeenCalledTimes(1);
            expect(mockHandleStep3Complete).toHaveBeenCalledWith(1);
        });

        it("accepts handleSetCompletedStepNumber and isActiveStep props", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    handleSetCompletedStepNumber={mockHandleSetCompletedStepNumber}
                    isActiveStep={true}
                />
            );

            // Verify component renders without errors with new props
            expect(screen.getByRole("button", { name: /complete step 3/i })).toBeInTheDocument();

            // Verify the hook is called with handleSetCompletedStepNumber
            expect(useProcurementTrackerStepThree).toHaveBeenCalledWith(mockStepData, mockHandleSetCompletedStepNumber);
        });

        it("cancel button is disabled when isDisabled is true", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toBeDisabled();
        });

        it("cancel button is disabled when checkbox is unchecked", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: false
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            expect(cancelButton).toBeDisabled();
        });

        it("complete button is disabled when validation fails", () => {
            const mockValidatorWithErrors = {
                getErrors: vi.fn(() => []),
                hasErrors: vi.fn(() => true)
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024",
                validatorRes: mockValidatorWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });
    });

    describe("Modal Tests", () => {
        it("renders ConfirmationModal when showModal is true", () => {
            useProcurementTrackerStepThree.mockReturnValue({
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        });

        it("modal has correct heading text", () => {
            useProcurementTrackerStepThree.mockReturnValue({
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(
                screen.getByText("Are you sure you want to cancel this task? Your input will not be saved.")
            ).toBeInTheDocument();
        });

        it('modal has "Cancel Task" and "Continue Editing" buttons', () => {
            useProcurementTrackerStepThree.mockReturnValue({
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.getByText("Cancel Task")).toBeInTheDocument();
            expect(screen.getByText("Continue Editing")).toBeInTheDocument();
        });

        it("does not render modal when showModal is false", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                showModal: false
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
        });
    });

    describe("Button Disable Logic", () => {
        it("complete button disabled when no user selected", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: {},
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button disabled when no date completed", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: ""
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button disabled when checkbox unchecked", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: false,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button disabled when isDisabled is true", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={true}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button disabled when validation has errors", () => {
            const mockValidatorWithErrors = {
                getErrors: vi.fn(() => ["Error message"]),
                hasErrors: vi.fn(() => true)
            };

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024",
                validatorRes: mockValidatorWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).toBeDisabled();
        });

        it("complete button enabled when all conditions met", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                isSolicitationClosed: true,
                selectedUser: { id: 123 },
                step3DateCompleted: "01/15/2024"
            });

            const stepDataWithDates = {
                ...mockStepData,
                solicitation_period_start_date: "02/01/2024",
                solicitation_period_end_date: "02/28/2024"
            };

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={stepDataWithDates}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                />
            );

            const completeButton = screen.getByRole("button", { name: /complete step 3/i });
            expect(completeButton).not.toBeDisabled();
        });
    });

    describe("Read-Only Mode", () => {
        it("renders TermTags and no form controls when isReadOnly is true and PENDING", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={{ id: 1 }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isReadOnly={true}
                />
            );

            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /complete step 3/i })).not.toBeInTheDocument();
            expect(screen.queryByTestId("users-combobox")).not.toBeInTheDocument();
        });

        it("shows TBD for empty fields in read-only PENDING mode", () => {
            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                step3CompletedByUserName: "",
                step3DateCompletedLabel: "",
                solicitationStartDateLabel: "",
                solicitationEndDateLabel: "",
                step3NotesLabel: ""
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={{ id: 1 }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
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
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={{ id: 1 }}
                    authorizedUsers={mockAllUsers}
                    isDisabled={false}
                    isReadOnly={true}
                />
            );

            expect(screen.getByText(/Solicitation is closed to vendors/i)).toBeInTheDocument();
            expect(screen.getAllByTestId("term-tag").length).toBeGreaterThan(0);
        });
    });
});

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

describe("ProcurementTrackerStepThree", () => {
    const mockSetSelectedUser = vi.fn();
    const mockSetStep3DateCompleted = vi.fn();
    const mockSetSolicitationPeriodStartDate = vi.fn();
    const mockSetSolicitationPeriodEndDate = vi.fn();
    const mockRunValidate = vi.fn();
    const mockValidatorRes = {
        getErrors: vi.fn(() => [])
    };

    const mockSetStep3Notes = vi.fn();

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
        MemoizedDatePicker: DatePicker
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
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period Start Date")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period End Date")).toBeInTheDocument();
        });

        it("renders instructional paragraph", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(
                screen.getByText(/The Procurement Shop posts the solicitation on the street for vendors to respond/i)
            ).toBeInTheDocument();
        });

        it("Date Completed has correct props (label, hint, maxDate)", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
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

        it("Solicitation Period Start Date has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );

            expect(startDatePicker).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period Start Date")).toBeInTheDocument();
        });

        it("Solicitation Period End Date has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );

            expect(endDatePicker).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period End Date")).toBeInTheDocument();
        });

        it("UsersComboBox has correct props", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
        it("Date Completed calls runValidate and setStep3DateCompleted on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const dateCompletedPicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "step-3-date-completed"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = dateCompletedPicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "2024-03-20" } });

            expect(mockRunValidate).toHaveBeenCalledWith("dateCompleted", "2024-03-20");
            expect(mockSetStep3DateCompleted).toHaveBeenCalledWith("2024-03-20");
        });

        it("Solicitation Period Start Date calls runValidate and setSolicitationPeriodStartDate on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const startDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-start-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = startDatePicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "2024-02-01" } });

            expect(mockRunValidate).toHaveBeenCalledWith("solicitationPeriodStartDate", "2024-02-01");
            expect(mockSetSolicitationPeriodStartDate).toHaveBeenCalledWith("2024-02-01");
        });

        it("Solicitation Period End Date calls setSolicitationPeriodEndDate on change", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            const datePickers = screen.getAllByTestId("date-picker");
            const endDatePicker = datePickers.find(
                (picker) => picker.getAttribute("data-picker-id") === "solicitation-period-end-date"
            );
            // eslint-disable-next-line testing-library/no-node-access
            const dateInput = endDatePicker.querySelector("input");

            fireEvent.change(dateInput, { target: { value: "2024-02-28" } });

            expect(mockSetSolicitationPeriodEndDate).toHaveBeenCalledWith("2024-02-28");
        });

        it("UsersComboBox calls setSelectedUser when user selected", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
                <ProcurementTrackerStepThree
                    stepStatus="ACTIVE"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
            expect(screen.getByText("Date Completed")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period Start Date")).toBeInTheDocument();
            expect(screen.getByText("Solicitation Period End Date")).toBeInTheDocument();
        });

        it("form fields are interactive in ACTIVE state", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="ACTIVE"
                    stepThreeData={mockStepData}
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
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
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
                    hasActiveTracker={true}
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
                    hasActiveTracker={true}
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
                    hasActiveTracker={true}
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
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Solicitation Period Start Date")).toBeInTheDocument();
            expect(screen.getByText("February 1, 2024")).toBeInTheDocument();
        });

        it("displays formatted solicitation period end date", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Solicitation Period End Date")).toBeInTheDocument();
            expect(screen.getByText("February 28, 2024")).toBeInTheDocument();
        });
    });

    describe("COMPLETED State Validation", () => {
        it("does not render form controls (date pickers, combobox, buttons)", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
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

            useProcurementTrackerStepThree.mockReturnValue({
                ...defaultHookReturn,
                validatorRes: mockValidatorResWithErrors
            });

            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
                })
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
                    hasActiveTracker={true}
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
                })
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
                    hasActiveTracker={true}
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
                    hasActiveTracker={false}
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
                    hasActiveTracker={true}
                />
            );

            expect(screen.getByText("Task Completed By")).toBeInTheDocument();
        });

        it("renders correctly when stepStatus is neither PENDING, ACTIVE, nor COMPLETED", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="SKIPPED"
                    stepThreeData={mockStepData}
                    authorizedUsers={mockAllUsers}
                    hasActiveTracker={true}
                />
            );

            expect(screen.queryByText("Task Completed By")).not.toBeInTheDocument();
            expect(screen.queryByTestId("term-tag")).not.toBeInTheDocument();
        });

        it("handles empty authorizedUsers array", () => {
            render(
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
                <ProcurementTrackerStepThree
                    stepStatus="PENDING"
                    stepThreeData={mockStepData}
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
                <ProcurementTrackerStepThree
                    stepStatus="COMPLETED"
                    stepThreeData={mockStepData}
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
            <ProcurementTrackerStepThree
                stepStatus="PENDING"
                stepThreeData={mockStepData}
                authorizedUsers={mockAllUsers}
                hasActiveTracker={true}
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
                hasActiveTracker={true}
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
                hasActiveTracker={true}
            />
        );

        expect(screen.getByText("Notes")).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-node-access
        const dd = screen.getByText("Notes").nextElementSibling;
        expect(dd.textContent).toBe("");
    });
});

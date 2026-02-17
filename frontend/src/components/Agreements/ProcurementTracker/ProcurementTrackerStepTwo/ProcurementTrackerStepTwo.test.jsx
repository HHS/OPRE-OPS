import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import suite from "./suite";

vi.mock("../../../../hooks/user.hooks");

vi.mock("../../../../helpers/utils", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getLocalISODate: vi.fn(() => "2024-01-30")
    };
});

vi.mock("../../../DebugCode", () => ({
    default: ({ data }) => <div data-testid="debug-code">{JSON.stringify(data)}</div>
}));

vi.mock("../../../UI/USWDS/DatePicker", () => ({
    default: ({ id, name, label, hint, value, onChange, messages, minDate }) => (
        <div
            data-testid="date-picker"
            data-min-date={minDate}
        >
            <label htmlFor={id}>{label}</label>
            {hint && <span>{hint}</span>}
            <input
                id={id}
                name={name}
                value={value}
                onChange={onChange}
            />
            {messages?.map((message) => (
                <span key={message}>{message}</span>
            ))}
        </div>
    )
}));

vi.mock("../../UsersComboBox", () => ({
    default: ({ label, selectedUser, setSelectedUser, isDisabled, users }) => (
        <div data-testid="users-combobox">
            <label>{label}</label>
            <select
                disabled={isDisabled}
                value={selectedUser?.id || ""}
                onChange={(e) => setSelectedUser({ id: parseInt(e.target.value) })}
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

vi.mock("../../../UI/Term/TermTag", () => ({
    default: ({ term, description }) => (
        <div data-testid="term-tag">
            <dt>{term}</dt>
            <dd>{description}</dd>
        </div>
    )
}));

describe("ProcurementTrackerStepTwo", () => {
    const mockStepTwoData = {
        id: 102,
        step_number: 2,
        status: "PENDING"
    };

    const mockAuthorizedUsers = [
        { id: 1, full_name: "John Doe", email: "john@example.com" },
        { id: 2, full_name: "Jane Smith", email: "jane@example.com" }
    ];

    beforeEach(() => {
        suite.reset();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-30T12:00:00.000Z"));
        vi.spyOn(window, "alert").mockImplementation(() => {});
        useGetUserFullNameFromId.mockReturnValue("John Doe");
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("renders editable content for PENDING state", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        expect(
            screen.getByText(/Edit the pre-solicitation package in collaboration with the Procurement Shop/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders editable content for ACTIVE state", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="ACTIVE"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders completed state without editable controls", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="COMPLETED"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByText("Completed By")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.queryByLabelText("Target Completion Date")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    });

    it("shows validation error and disables save for invalid input", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        fireEvent.change(screen.getByLabelText("Target Completion Date"), {
            target: { value: "2024-01-30" }
        });

        expect(screen.getByText("Date must be MM/DD/YYYY")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("enables save for valid input", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        const dateInput = screen.getByLabelText("Target Completion Date");
        fireEvent.change(dateInput, {
            target: { value: "01/30/2024" }
        });

        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    it("calls alert when save is clicked", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(window.alert).toHaveBeenCalledWith("Save target completion date functionality coming soon!");
    });

    it("initializes target completion date from step data", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={{ ...mockStepTwoData, target_completion_date: "01/30/2024" }}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByLabelText("Target Completion Date")).toHaveValue("01/30/2024");
    });

    it("passes minDate from getLocalISODate to DatePicker", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepTwoData={mockStepTwoData}
                authorizedUsers={mockAuthorizedUsers}
                hasActiveTracker={true}
            />
        );

        expect(screen.getByTestId("date-picker")).toHaveAttribute("data-min-date", "2024-01-30");
    });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo";
import suite from "./suite";

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

describe("ProcurementTrackerStepTwo", () => {
    const mockStepData = {
        id: 102,
        step_number: 2,
        status: "PENDING"
    };

    beforeEach(() => {
        suite.reset();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-30T12:00:00.000Z"));
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("renders editable content for PENDING state", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepData={mockStepData}
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
                stepData={mockStepData}
            />
        );

        expect(screen.getByText("Target Completion Date")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });

    it("renders completed state without editable controls", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="COMPLETED"
                stepData={mockStepData}
            />
        );

        expect(screen.getByText("Step Two Completed")).toBeInTheDocument();
        expect(screen.queryByText("Target Completion Date")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    });

    it("shows validation error and disables save for invalid input", () => {
        render(
            <ProcurementTrackerStepTwo
                stepStatus="PENDING"
                stepData={mockStepData}
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
                stepData={mockStepData}
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
                stepData={mockStepData}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(window.alert).toHaveBeenCalledWith("Save target completion date functionality coming soon!");
    });
});

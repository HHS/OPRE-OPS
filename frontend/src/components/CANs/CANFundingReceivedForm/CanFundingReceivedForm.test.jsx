import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CANFundingReceivedForm from "./CanFundingReceivedForm";

describe("CANFundingReceivedForm", () => {
    let user;
    const defaultProps = {
        cn: vi.fn(),
        res: {
            hasErrors: vi.fn().mockReturnValue(false),
            getErrors: vi.fn().mockReturnValue([])
        },
        receivedFundingAmount: "",
        handleSubmit: vi.fn(),
        runValidate: vi.fn(() => ({ hasErrors: () => false })),
        clearValidationError: vi.fn(),
        setReceivedFundingAmount: vi.fn(),
        notes: "",
        setNotes: vi.fn()
    };

    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();
    });

    it("renders the form correctly", () => {
        render(<CANFundingReceivedForm {...defaultProps} />);

        expect(screen.getByLabelText(/Funding Received/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Notes \(optional\)/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Add Funding Received/i })).toBeInTheDocument();
    });

    it("calls setNotes when typing in notes field", async () => {
        render(<CANFundingReceivedForm {...defaultProps} />);
        const textarea = screen.getByLabelText(/Notes \(optional\)/i);

        await user.type(textarea, "Test note");
        expect(defaultProps.setNotes).toHaveBeenCalledTimes(9);
    });

    it("calls setReceivedFundingAmount when typing amount", async () => {
        render(<CANFundingReceivedForm {...defaultProps} />);
        const input = screen.getByLabelText(/Funding Received/i);

        // Click the input first to focus it
        await user.click(input);
        // Paste the value to avoid character-by-character parsing issues
        await user.paste("1000");

        // Check that setReceivedFundingAmount was called with the pasted value
        expect(defaultProps.setReceivedFundingAmount).toHaveBeenCalled();
        expect(defaultProps.setReceivedFundingAmount).toHaveBeenCalledWith(1000);
    });

    it("calls runValidate on blur", () => {
        render(<CANFundingReceivedForm {...defaultProps} />);

        fireEvent.blur(screen.getByLabelText(/Funding Received/i), {
            target: { value: "1,000" }
        });

        expect(defaultProps.runValidate).toHaveBeenCalledWith("funding-received-amount", "1,000");
    });

    it("does not call runValidate on input change", () => {
        const props = {
            ...defaultProps,
            runValidate: vi.fn(() => ({ hasErrors: () => false })),
            clearValidationError: vi.fn()
        };
        render(<CANFundingReceivedForm {...props} />);

        fireEvent.change(screen.getByLabelText(/Funding Received/i), {
            target: { value: "1000" }
        });

        expect(props.runValidate).not.toHaveBeenCalled();
    });

    it("clears validation error on input change", () => {
        const props = {
            ...defaultProps,
            clearValidationError: vi.fn()
        };
        render(<CANFundingReceivedForm {...props} />);

        fireEvent.change(screen.getByLabelText(/Funding Received/i), {
            target: { value: "1000" }
        });

        expect(props.clearValidationError).toHaveBeenCalledWith("funding-received-amount");
    });

    it("calls handleSubmit when validation passes on submit", async () => {
        const props = {
            ...defaultProps,
            handleSubmit: vi.fn(),
            runValidate: vi.fn(() => ({ hasErrors: () => false })),
            receivedFundingAmount: "1000"
        };
        render(<CANFundingReceivedForm {...props} />);

        await user.click(screen.getByRole("button", { name: /Add Funding Received/i }));

        expect(props.runValidate).toHaveBeenCalledWith("funding-received-amount", "1000");
        expect(props.handleSubmit).toHaveBeenCalled();
    });

    it("blocks handleSubmit when validation fails on submit", async () => {
        const props = {
            ...defaultProps,
            handleSubmit: vi.fn(),
            runValidate: vi.fn(() => ({ hasErrors: () => true })),
            receivedFundingAmount: "1000",
            res: {
                ...defaultProps.res,
                hasErrors: vi.fn().mockReturnValue(false)
            }
        };
        render(<CANFundingReceivedForm {...props} />);

        await user.click(screen.getByRole("button", { name: /Add Funding Received/i }));

        expect(props.runValidate).toHaveBeenCalledWith("funding-received-amount", "1000");
        expect(props.handleSubmit).not.toHaveBeenCalled();
    });

    it("disables submit button when form is invalid", () => {
        render(
            <CANFundingReceivedForm
                {...defaultProps}
                res={{
                    ...defaultProps.res,
                    hasErrors: vi.fn().mockReturnValue(true)
                }}
            />
        );

        expect(screen.getByRole("button", { name: /Add Funding Received/i })).toBeDisabled();
    });

    it("displays validation errors when present", () => {
        const propsWithError = {
            ...defaultProps,
            res: {
                hasErrors: vi.fn().mockReturnValue(true),
                getErrors: vi.fn().mockReturnValue(["Amount cannot exceed FY Budget"])
            }
        };

        render(<CANFundingReceivedForm {...propsWithError} />);
        expect(screen.getByText("Amount cannot exceed FY Budget")).toBeInTheDocument();
    });
});

import { render, screen } from "@testing-library/react";
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
        runValidate: vi.fn(),
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

        await user.type(input, "1000");

        // React 19: Verify the callback was called for each keystroke
        expect(defaultProps.setReceivedFundingAmount).toHaveBeenCalled();
        expect(defaultProps.setReceivedFundingAmount).toHaveBeenCalledTimes(4);
    });

    it("calls handleSubmit when form is submitted", async () => {
        render(
            <CANFundingReceivedForm
                {...defaultProps}
                receivedFundingAmount="1000"
            />
        );

        await user.click(screen.getByRole("button", { name: /Add Funding Received/i }));

        expect(defaultProps.handleSubmit).toHaveBeenCalled();
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
});

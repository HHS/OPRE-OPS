import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { agreement } from "../../../tests/data";
import AgreementBLIAccordion from "./AgreementBLIAccordion";

describe("AgreementBLIAccordion", () => {
    //TODO: Scenarios in the Approve Agreement page:
    // 1. Status Changes to DRAFT to PLANNED ✅
    // 2. Budget Changes to PLANNED Budget lines ✅
    // 3. Status Changes to PLANNED to EXECUTING ✅
    // 4. Cannot make Budget Change to EXECUTING Budget lines
    const defaultProps = {
        title: "Test Title",
        agreement: agreement,
        instructions: "test instructions",
        budgetLineItems: agreement.budget_line_items,
        afterApproval: false,
        setAfterApproval: () => vi.fn(),
        action: BLI_STATUS.PLANNED
    };
    it("should render the component", () => {
        render(
            <AgreementBLIAccordion {...defaultProps}>
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("test instructions")).toBeInTheDocument();
        expect(screen.getByText("Off (Drafts excluded)")).toBeInTheDocument();
        expect(screen.getByText("$ 0")).toBeInTheDocument();
        expect(screen.getByText("PSC - Fee Rate: 0%")).toBeInTheDocument();
        expect(screen.getByText("Test Children")).toBeInTheDocument();
    });
    it("should render the component after approval", () => {
        render(
            <AgreementBLIAccordion
                {...defaultProps}
                afterApproval={true}
            >
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        expect(screen.getByText("On (Drafts included)")).toBeInTheDocument();
        expect(screen.getByText("FY 2043")).toBeInTheDocument();
        expect(screen.getByText("$ 2,000,000")).toBeInTheDocument();
    });
    it("should render the component with EXECUTING action", () => {
        render(
            <AgreementBLIAccordion
                {...defaultProps}
                action={BLI_STATUS.EXECUTING}
            >
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        expect(screen.queryByText("Off (Drafts excluded)")).not.toBeInTheDocument();
    });
    it('should handle the "After Approval" toggle', async () => {
        const user = userEvent.setup();
        const setAfterApprovalMock = vi.fn();

        render(
            <AgreementBLIAccordion
                {...defaultProps}
                setAfterApproval={setAfterApprovalMock}
            >
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        // Find the button by its role and name
        const button = screen.getByRole("button", { name: /after approval/i });

        // Check the initial state
        expect(screen.getByText("Off (Drafts excluded)")).toBeInTheDocument();

        // Simulate a click event on the button
        await user.click(button);

        // Check if setAfterApproval was called with the correct argument
        expect(setAfterApprovalMock).toHaveBeenCalledWith(true);

        // Update the props to reflect the new state
        render(
            <AgreementBLIAccordion
                {...defaultProps}
                afterApproval={true}
                setAfterApproval={setAfterApprovalMock}
            >
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        // Check the final state after the click
        expect(screen.getByText("On (Drafts included)")).toBeInTheDocument();
    });
});

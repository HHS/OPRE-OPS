import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { agreementWithDraftBudgetLines } from "../../../tests/data";
import AgreementBLIAccordion from "./AgreementBLIAccordion";

describe("AgreementBLIAccordion", () => {
    //TODO: Scenarios in the Approve Agreement page:
    // 1. Status Changes to DRAFT to PLANNED ✅
    // 2. Budget Changes to PLANNED Budget lines ✅
    // 3. Status Changes to PLANNED to EXECUTING ✅
    // 4. Cannot make Budget Change to EXECUTING Budget lines
    const defaultProps = {
        title: "Test Title",
        agreement: agreementWithDraftBudgetLines,
        instructions: "test instructions",
        budgetLineItems: agreementWithDraftBudgetLines.budget_line_items,
        afterApproval: false,
        setAfterApproval: () => vi.fn(),
        action: BLI_STATUS.PLANNED
    };
    const budgetLinesInReview =
        agreementWithDraftBudgetLines?.budget_line_items?.filter(
            /** @param {BudgetLine} bli */
            (bli) => bli.in_review
        ) || [];

    it("default render for ", () => {
        render(
            <AgreementBLIAccordion {...defaultProps}>
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        screen.debug();
        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("test instructions")).toBeInTheDocument();
        expect(screen.getByText("Off (Drafts excluded)")).toBeInTheDocument();
        expect(screen.getByText("$ 0")).toBeInTheDocument();
        expect(screen.getByText("PSC - Fee Rate: 0.5%")).toBeInTheDocument();
        expect(screen.getByText("Test Children")).toBeInTheDocument();
    });
    it("should render the component after approval", () => {
        render(
            <AgreementBLIAccordion
                {...defaultProps}
                budgetLineItems={budgetLinesInReview}
                afterApproval={true}
            >
                <div>Test Children</div>
            </AgreementBLIAccordion>
        );

        expect(screen.getByText("On (Drafts included)")).toBeInTheDocument();
        expect(screen.getByText("FY 2024")).toBeInTheDocument();
        expect(screen.getByText("$1,256,250.00")).toBeInTheDocument();
        expect(screen.queryByText("FY 2025")).not.toBeInTheDocument();
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
        screen.debug();
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

    it.skip("on the Approve Agreement page for a Budget Change to PLANNED Budget lines, the component should not include the DRAFT BLIs", () => {});
    it.skip(
        "on the Approve Agreement page for a EXECUTING to PLANNED status change, the component should not include the EXECUTING BLIs"
    );
});

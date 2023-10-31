import Accordion from "../../UI/Accordion";
import { totalBudgetLineFeeAmount } from "../../../helpers/utils";
import CANFundingCard from "../../CANs/CANFundingCard";
import ToggleButton from "../../UI/ToggleButton";

/**
 * Renders an accordion component for reviewing CANs.
 * @param {Object} props - The component props.
 * @param {Array<any>} props.selectedBudgetLines - The selected budget lines.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @returns {React.JSX.Element} The AgreementCANReviewAccordion component.
 */
const AgreementCANReviewAccordion = ({ selectedBudgetLines, afterApproval, setAfterApproval }) => {
    const cansWithPendingAmount = selectedBudgetLines.reduce((acc, budgetLine) => {
        const canId = budgetLine?.can?.id;
        if (!acc[canId]) {
            acc[canId] = {
                can: budgetLine.can,
                pendingAmount: 0,
                count: 0 // not used but handy for debugging
            };
        }
        acc[canId].pendingAmount +=
            budgetLine.amount + totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage);
        acc[canId].count += 1;
        return acc;
    }, {});

    console.log("cansWithPendingAmount", cansWithPendingAmount);

    return (
        <Accordion
            heading="Review CANs"
            level={2}
        >
            <p>
                The budget lines showing In Review Status have allocated funds from the CANs displayed below. Use the
                toggle to see how your approval would change the remaining budget of CANs within your Portfolio or
                Division.
            </p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                <ToggleButton
                    btnText="After Approval"
                    handleToggle={() => setAfterApproval(!afterApproval)}
                    isToggleOn={afterApproval}
                />
            </div>
            <div
                className="display-flex flex-wrap"
                style={{ gap: "32px 28px" }}
            >
                {Object.entries(cansWithPendingAmount).map(([key, value]) => (
                    <CANFundingCard
                        key={key}
                        can={value.can}
                        pendingAmount={value.pendingAmount}
                        afterApproval={afterApproval}
                    />
                ))}
            </div>
        </Accordion>
    );
};

export default AgreementCANReviewAccordion;

import PropTypes from "prop-types";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { selectedAction } from "../../../pages/agreements/review/ReviewAgreement.constants";
import CANFundingCard from "../../CANs/CANFundingCard";
import Accordion from "../../UI/Accordion";
import Tag from "../../UI/Tag";
import ToggleButton from "../../UI/ToggleButton";

/**
 * Renders an accordion component for reviewing CANs.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.instructions - The instructions for the accordion.
 * @param {Array<any>} props.selectedBudgetLines - The selected budget lines.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @param {string} props.action - The action to perform.
 * @param {boolean} [props.isApprovePage=false] - Flag indicating if the page is the approve
 * @returns {JSX.Element} The AgreementCANReviewAccordion component.
 */
const AgreementCANReviewAccordion = ({
    instructions,
    selectedBudgetLines,
    afterApproval,
    setAfterApproval,
    action,
    isApprovePage = false
}) => {
    const { data: portfolios, error, isLoading } = useGetPortfoliosQuery({});
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading Portfolio data</div>;
    }

    const cansWithPendingAmountMap = selectedBudgetLines.reduce((acc, budgetLine) => {
        const currentCanId = budgetLine.can.id;
        let newCanId = currentCanId;
        let amountChange = 0;
        let currentAmount = budgetLine.amount;

        if (budgetLine.change_requests_in_review?.length > 0) {
            budgetLine.change_requests_in_review.forEach((changeRequest) => {
                if (changeRequest.has_budget_change) {
                    if (changeRequest.requested_change_diff?.amount) {
                        amountChange =
                            changeRequest.requested_change_diff.amount.new -
                            changeRequest.requested_change_diff.amount.old;
                    }
                    if (changeRequest.requested_change_diff?.can_id) {
                        newCanId = changeRequest.requested_change_diff.can_id.new;
                    }
                }
            });
        }

        const totalAmount = currentAmount + amountChange;
        const feeAmount = totalBudgetLineFeeAmount(totalAmount, budgetLine.proc_shop_fee_percentage);

        // Initialize or update the current CAN
        if (!acc[currentCanId]) {
            acc[currentCanId] = { can: budgetLine.can, pendingAmount: 0, count: 0 };
        }

        // If the CAN is changing, initialize the new CAN if it doesn't exist
        if (newCanId !== currentCanId && !acc[newCanId]) {
            acc[newCanId] = { can: { id: newCanId }, pendingAmount: 0, count: 0 };
        }

        // Update amounts
        if (newCanId !== currentCanId) {
            acc[currentCanId].pendingAmount -=
                currentAmount + totalBudgetLineFeeAmount(currentAmount, budgetLine.proc_shop_fee_percentage);
            acc[newCanId].pendingAmount += totalAmount + feeAmount;
        } else {
            acc[currentCanId].pendingAmount +=
                amountChange +
                (feeAmount - totalBudgetLineFeeAmount(currentAmount, budgetLine.proc_shop_fee_percentage));
        }
        // If the action is PLANNED, add the amount to the pending amount just like the Review page
        if (!isApprovePage || action === BLI_STATUS.PLANNED) {
            acc[currentCanId].pendingAmount +=
                budgetLine.amount + totalBudgetLineFeeAmount(budgetLine.amount, budgetLine.proc_shop_fee_percentage);
        }

        acc[currentCanId].count += 1;

        return acc;
    }, {});
    const cansWithPendingAmount = Object.values(cansWithPendingAmountMap);

    let canPortfolios = [];
    selectedBudgetLines.forEach((budgetLine) => {
        const canPortfolio = portfolios.find((portfolio) => portfolio.id === budgetLine?.can?.portfolio_id);
        if (canPortfolios.indexOf(canPortfolio) < 0) canPortfolios.push(canPortfolio);
    });

    // TODO: Replace with actual data
    let cansOutsideDivision = [
        {
            id: 1,
            name: "Not"
        },
        {
            id: 2,
            name: "Yet"
        },
        {
            id: 3,
            name: "Implemented"
        }
    ];

    const showToggle = action === selectedAction.DRAFT_TO_PLANNED || isApprovePage;

    return (
        <Accordion
            heading="Review CANs"
            level={2}
        >
            <p>{instructions}</p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                {showToggle && (
                    <ToggleButton
                        btnText="After Approval"
                        handleToggle={() => setAfterApproval(!afterApproval)}
                        isToggleOn={afterApproval}
                    />
                )}
            </div>
            <div
                className="display-flex flex-wrap margin-bottom-0"
                style={{ gap: "32px 28px" }}
            >
                {cansWithPendingAmount.length > 0 &&
                    cansWithPendingAmount.map((value) => (
                        <CANFundingCard
                            key={value.can.id}
                            can={value.can}
                            pendingAmount={value.pendingAmount}
                            afterApproval={afterApproval}
                        />
                    ))}
            </div>

            <div className="margin-top-3">
                <span className="text-base-dark font-12px">Portfolios:</span>
                {canPortfolios?.length > 0 &&
                    canPortfolios.map((portfolio) => (
                        <Tag
                            key={portfolio?.id}
                            className="margin-left-1"
                            text={portfolio?.name}
                            tagStyle="primaryDarkTextLightBackground"
                        />
                    ))}
            </div>
            <div className="margin-top-1">
                <span className="text-base-dark font-12px">Other CANs Outside Your Division:</span>
                {cansOutsideDivision.length > 0 &&
                    cansOutsideDivision.map((portfolio) => (
                        <Tag
                            key={portfolio?.id}
                            className="margin-left-1"
                            text={portfolio?.name}
                            tagStyle="primaryDarkTextLightBackground"
                        />
                    ))}
            </div>
        </Accordion>
    );
};

AgreementCANReviewAccordion.propTypes = {
    instructions: PropTypes.string.isRequired,
    selectedBudgetLines: PropTypes.arrayOf(PropTypes.object),
    afterApproval: PropTypes.bool,
    setAfterApproval: PropTypes.func,
    action: PropTypes.string,
    isApprovePage: PropTypes.bool
};
export default AgreementCANReviewAccordion;

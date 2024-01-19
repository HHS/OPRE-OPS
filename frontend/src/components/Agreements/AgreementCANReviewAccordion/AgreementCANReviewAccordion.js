import PropTypes from "prop-types";
import Accordion from "../../UI/Accordion";
import { totalBudgetLineFeeAmount } from "../../../helpers/utils";
import CANFundingCard from "../../CANs/CANFundingCard";
import ToggleButton from "../../UI/ToggleButton";
import Tag from "../../UI/Tag";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";
import { actionOptions } from "../../../pages/agreements/review/ReviewAgreement.constants";

/**
 * Renders an accordion component for reviewing CANs.
 * @param {Object} props - The component props.
 * @param {string} props.instructions - The instructions for the accordion.
 * @param {Array<any>} props.selectedBudgetLines - The selected budget lines.
 * @param {boolean} props.afterApproval - Flag indicating whether to show remaining budget after approval.
 * @param {Function} props.setAfterApproval - Function to set the afterApproval flag.
 * @param {string} props.action - The action to perform.
 * @returns {React.JSX.Element} The AgreementCANReviewAccordion component.
 */
const AgreementCANReviewAccordion = ({
    instructions,
    selectedBudgetLines,
    afterApproval,
    setAfterApproval,
    action
}) => {
    const { data: portfolios, error, isLoading } = useGetPortfoliosQuery();
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading Portfolio data</div>;
    }

    const cansWithPendingAmountMap = selectedBudgetLines.reduce((acc, budgetLine) => {
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
    const cansWithPendingAmount = Object.values(cansWithPendingAmountMap);

    let canPortfolios = [];
    selectedBudgetLines.forEach((budgetLine) => {
        const canPortfolio = portfolios.find((portfolio) => portfolio.id === budgetLine?.can?.managing_portfolio_id);
        if (canPortfolios.indexOf(canPortfolio) < 0) canPortfolios.push(canPortfolio);
    });

    return (
        <Accordion
            heading="Review CANs"
            level={2}
        >
            <p>{instructions}</p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                {action === actionOptions.CHANGE_DRAFT_TO_PLANNED && (
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
                {cansWithPendingAmount.map((value) => (
                    <CANFundingCard
                        key={value.can.id}
                        can={value.can}
                        pendingAmount={value.pendingAmount}
                        afterApproval={afterApproval}
                    />
                ))}
            </div>
            <div className="text-base-dark font-12px margin-top-1">
                *Total Spending equals the sum of Budget Lines in Planned, Executing and Obligated
            </div>
            <div className="margin-top-3">
                <span className="text-base-dark font-12px">Portfolios:</span>
                {canPortfolios.map((portfolio) => (
                    <Tag
                        key={portfolio.id}
                        className="margin-left-1"
                        text={portfolio.name}
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
    action: PropTypes.string
};
export default AgreementCANReviewAccordion;

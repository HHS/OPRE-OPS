import { useState } from "react";
import Accordion from "../../UI/Accordion";
import { totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import CANFundingCard from "../../CANs/CANFundingCard";
import Tag from "../../UI/Tag";
import { useSelector } from "react-redux";
import { useGetPortfoliosQuery } from "../../../api/opsAPI";

const AgreementCANReviewAccordion = ({ selectedBudgetLines }) => {
    // TODO: may need to elevate state for approval toggle
    const [afterApproval, setAfterApproval] = useState(true);
    const activeUser = useSelector((state) => state.auth.activeUser);
    const myDivisionId = activeUser?.division;

    const { data: portfolios, error, isLoading } = useGetPortfoliosQuery();
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading Portfolio data</div>;
    }

    const cansWithPendingAmountMap = selectedBudgetLines.reduce((acc, budgetLine) => {
        const canId = budgetLine?.can?.id;
        const canPortfolio = portfolios.find((portfolio) => portfolio.id === budgetLine?.can?.managing_portfolio_id);
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
            <p>
                The selected budget lines have allocated funds from the CANs displayed below. Use the toggle to see how
                your approval would change the remaining budget of those CANs.
            </p>
            <div className="display-flex flex-justify-end margin-top-3 margin-bottom-2">
                <button
                    id="toggleAfterApproval"
                    className="hover:text-underline cursor-pointer"
                    onClick={() => setAfterApproval(!afterApproval)}
                >
                    <FontAwesomeIcon
                        icon={afterApproval ? faToggleOn : faToggleOff}
                        size="2xl"
                        className={`margin-right-1 cursor-pointer ${afterApproval ? "text-primary" : "text-base"}`}
                        title={afterApproval ? "On (Drafts included)" : "Off (Drafts excluded)"}
                    />
                    <span className="text-primary">After Approval</span>
                </button>
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

export default AgreementCANReviewAccordion;

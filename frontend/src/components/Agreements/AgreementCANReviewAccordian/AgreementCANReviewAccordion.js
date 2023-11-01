import * as React from "react";
import Accordion from "../../UI/Accordion";
import { totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import CANFundingCard from "../../CANs/CANFundingCard";

const AgreementCANReviewAccordion = ({ selectedBudgetLines }) => {
    // TODO: may need to elevate state for approval toggle
    const [afterApproval, setAfterApproval] = React.useState(true);
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

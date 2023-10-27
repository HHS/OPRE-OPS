import Accordion from "../../UI/Accordion";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import CANFundingBar from "../../CANs/CANFundingBar/CANFundingBar";
import React, { useState } from "react";
import { useGetAgreementByIdQuery, useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { calculatePercent, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faToggleOff, faToggleOn, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import Tag from "../../UI/Tag";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import SummaryCard from "../../UI/SummaryCard";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import styles from "../AgreementChangesAccordion/small-summary-card.module.css";
import RoundedBox from "../../UI/RoundedBox";

const CANFundingCard = ({ can, pendingAmount, afterApproval }) => {
    const adjustAmount = afterApproval ? pendingAmount : 0;
    const canId = can.id;
    const { data: data, error: error, isLoading: isLoading } = useGetCanFundingSummaryQuery(canId);
    const [activeId, setActiveId] = React.useState(0);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading CAN funding data</div>;
    }
    const title = `${data.can.number} (${data.can.appropriation_term} Year)`;
    const totalFunding = Number(data.total_funding);
    const availableFunding = Number(data.available_funding);
    const totalAccountedFor = totalFunding - availableFunding; // same as adding planned, obligated, in_execution
    const totalSpending = totalAccountedFor + adjustAmount;
    const remainingBudget = availableFunding - adjustAmount;
    const overBudget = remainingBudget < 0;
    // available_funding = float(total_funding) - float(total_accounted_for)

    const canFundingBarData = [
        {
            id: 1,
            label: "Total Spending",
            value: totalSpending,
            color: overBudget ? "#B50909" : "#80A858",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "lightTextGreenBackground",
            percent: `${calculatePercent(totalSpending, totalFunding)}%`
        },
        {
            id: 2,
            label: `Remaining Budget`,
            value: remainingBudget,
            color: overBudget ? "#B50909" : "#A9AEB1",
            tagStyle: "darkTextWhiteBackground",
            tagStyleActive: overBudget ? "lightTextRedBackground" : "darkTextGreyBackground",
            percent: `${calculatePercent(remainingBudget, totalFunding)}%`
        }
    ];

    const LegendItem = ({ id, label, value, color, percent, tagStyle, tagStyleActive }) => {
        const isGraphActive = activeId === id;
        return (
            <div className="display-flex flex-justify margin-top-2">
                <div className="">
                    <div className="display-flex flex-align-center">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`height-1 width-1 margin-right-05`}
                            style={{ color: color }}
                        />

                        <span className={isGraphActive ? "fake-bold" : ""}>{label}</span>
                    </div>
                </div>
                <div>
                    <CurrencyFormat
                        value={value}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$ "}
                        renderText={(value) => <span className={isGraphActive ? "fake-bold" : ""}>{value}</span>}
                    />
                    <Tag
                        tagStyle={tagStyle}
                        tagStyleActive={tagStyleActive}
                        text={percent}
                        label={label}
                        active={isGraphActive}
                        className="margin-left-1"
                    />
                </div>
            </div>
        );
    };

    return (
        <RoundedBox
            className={`padding-y-205 padding-x-4 padding-right-9 display-inline-block`}
            dataCy="can-funding-summary-card"
            style={{ height: "14.5rem" }}
        >
            <h3
                className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal"
                style={{ whiteSpace: "pre-line", lineHeight: "20px" }}
            >
                {title} <br /> CAN Total Budget
            </h3>

            <div className={`${styles.font20} margin-0 display-flex flex-justify`}>
                <CurrencyFormat
                    className={`text-bold`}
                    value={totalFunding || 0}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(totalFunding)}
                    fixedDecimalScale={true}
                />
                {overBudget && (
                    <Tag tagStyle={"lightTextRedBackground"}>
                        Over Budget{" "}
                        <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            title="Over Budget"
                        />
                    </Tag>
                )}
            </div>
            <div
                id="currency-summary-card"
                className="margin-top-2"
            >
                <CANFundingBar
                    setActiveId={setActiveId}
                    data={canFundingBarData}
                />
            </div>
            <div className="font-12px margin-top-2">
                {canFundingBarData.map((item) => (
                    <LegendItem
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        value={item.value}
                        color={item.color}
                        percent={item.percent}
                        tagStyle={item.tagStyle}
                        tagStyleActive={item.tagStyleActive}
                    />
                ))}
            </div>
        </RoundedBox>
    );
};

const AgreementCANReviewAccordian = ({ agreement, selectedBudgetLines }) => {
    const [afterApproval, setAfterApproval] = useState(true);
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
    // Object.entries()

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
                {/*<h2 className="font-sans-lg"></h2>*/}
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

                <CANFundingCard
                    can={{ id: 1 }}
                    pendingAmount={1000000}
                    afterApproval={afterApproval}
                />
                <CANFundingCard
                    can={{ id: 2 }}
                    pendingAmount={20000000}
                    afterApproval={afterApproval}
                />
                <CANFundingCard
                    can={{ id: 3 }}
                    pendingAmount={3000000}
                    afterApproval={afterApproval}
                />
                <CANFundingCard
                    can={{ id: 4 }}
                    pendingAmount={4000000}
                    afterApproval={afterApproval}
                />
                <CANFundingCard
                    can={{ id: 5 }}
                    pendingAmount={5000000}
                    afterApproval={afterApproval}
                />
            </div>
            {/*<div>-----------</div>*/}
            {/*<pre>{JSON.stringify(selectedBudgetLines, null, 2)}</pre>*/}
        </Accordion>
    );
};

export default AgreementCANReviewAccordian;

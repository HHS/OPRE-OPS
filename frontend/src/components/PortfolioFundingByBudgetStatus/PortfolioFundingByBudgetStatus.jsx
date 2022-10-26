import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";

import { ResponsiveDonutWithInnerPercent } from "../UI/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";

import constants from "../../constants";
import CustomLayerComponent from "../UI/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";

library.add(faSquare);

const styles = {
    root: {
        width: 150,
        height: 150,
    },
};

const PortfolioFundingByBudgetStatus = (props) => {
    const today = new Date();
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);
    const portfolioFundingChart = useSelector((state) => state.portfolioFundingSummary.portfolioFundingChart);
    const [percent, setPercent] = useState("");

    return (
        <div className="usa-card__container bg-base-lightest font-family-sans">
            <div className="usa-card__header padding-left-1 padding-top-1">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-3xs text-normal">
                        FY {getCurrentFiscalYear(today)} Budget Status
                    </h3>
                </div>
            </div>
            <div className="usa-card__body padding-1">
                <div className="grid-container padding-top-0 padding-1 font-sans-3xs">
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[0] }} />
                            Planned
                        </div>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.planned_funding.amount}
                            dollarsClasses="grid-col-6"
                            centsClasses="grid-col-6"
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[1] }} />
                            In Execution
                        </div>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.in_execution_funding.amount}
                            dollarsClasses="grid-col-6"
                            centsClasses="grid-col-6"
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[2] }} />
                            Obligated
                        </div>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.obligated_funding.amount}
                            dollarsClasses="grid-col-6"
                            centsClasses="grid-col-6"
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[3] }} />
                            Remaining
                        </div>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.available_funding.amount}
                            dollarsClasses="grid-col-6"
                            centsClasses="grid-col-6"
                        />
                    </div>
                </div>
            </div>
            <div className="usa-card__media usa-card__media--inset">
                <div className="usa-card__img">
                    <div style={styles.root}>
                        <ResponsiveDonutWithInnerPercent
                            data={portfolioFundingChart}
                            width={styles.root.width}
                            height={styles.root.height}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            CustomLayerComponent={CustomLayerComponent(percent)}
                            setPercent={setPercent}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFundingByBudgetStatus;

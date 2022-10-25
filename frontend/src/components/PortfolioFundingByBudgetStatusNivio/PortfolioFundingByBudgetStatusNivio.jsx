import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { VictoryPie, Slice, VictoryLabel, VictoryTooltip } from "victory";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";

import { render } from "react-dom";
import { ResponsivePie } from "@nivo/pie";

library.add(faSquare);

const colors = [
    "#336A90",
    "#A1D0BE",
    "#B50909",
    "#E5A000",
    "#6F3331",
    "#C07B96",
    "#264A64",
    "#3E8D61",
    "#D67625",
    "#429195",
];

const margin = { top: 30, right: 200, bottom: 30, left: 30 };

const styles = {
    root: {
        fontFamily: "consolas, sans-serif",
        textAlign: "center",
        position: "relative",
        width: 600,
        height: 600,
    },
    overlay: {
        position: "absolute",
        top: 0,
        right: margin.right,
        bottom: 0,
        left: margin.left,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 96,
        color: "#FFFFFF",
        // background: "#FFFFFF33",
        textAlign: "center",
        // This is important to preserve the chart interactivity
        pointerEvents: "none",
    },
    totalLabel: {
        fontSize: 24,
    },
};

// const data = [
//     {
//         id: "Work",
//         label: "Work",
//         value: 120
//     },
//     {
//         id: "Eat",
//         label: "Eat",
//         value: 35
//     },
//     {
//         id: "Commute",
//         label: "Commute",
//         value: 33
//     },
//     {
//         id: "Watch TV",
//         label: "Watch TV",
//         value: 27
//     },
//     {
//         id: "Sleep",
//         label: "Sleep",
//         value: 199
//     }
// ];

const PortfolioFundingByBudgetStatusNivio = (props) => {
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
            <div className="usa-card__media padding-1" style={styles.root}>
                <ResponsivePie
                    margin={margin}
                    data={portfolioFundingChart}
                    innerRadius={0.8}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    enableRadialLabels={false}
                    enableSlicesLabels={false}
                    tooltip={() => <></>}
                />
                <div style={styles.overlay}>
                    <span>5</span>
                    <span style={styles.totalLabel}>total components</span>
                </div>
            </div>
            <div className="usa-card__body padding-1">
                <div className="grid-container padding-top-0 padding-1 font-sans-3xs">
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[0] }} />
                            Planned
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.planned_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-6" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[1] }} />
                            In Execution
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.in_execution_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-6" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[2] }} />
                            Obligated
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.obligated_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-6" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row margin-bottom-2">
                        <div className="grid-col-6">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[3] }} />
                            Remaining
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.available_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-6" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFundingByBudgetStatusNivio;

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
import { CustomPie } from "./CustomPie";

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

const styles = {
    root: {
        // fontFamily: "consolas, sans-serif",
        // textAlign: "center",
        // position: "relative",
        width: 150,
        height: 150,
        //display: "inline-block",
    },
    cardBody: {
        //display: "inline-block",
    },
};

const CustomLayerComponent = (myProps) => (layerProps) => {
    const { centerX, centerY } = layerProps;

    console.log(`myProps=${{ myProps }}`);
    console.log(layerProps);

    return (
        <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
                fontSize: "20px",
                fontWeight: "600",
            }}
        >
            {myProps}
        </text>
    );
};

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
            <div className="usa-card__media usa-card__media--inset">
                <div className="usa-card__img">
                    <div style={styles.root}>
                        <CustomPie
                            data={portfolioFundingChart}
                            CustomLayerComponent={CustomLayerComponent(percent)}
                            setPercent={setPercent}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFundingByBudgetStatusNivio;

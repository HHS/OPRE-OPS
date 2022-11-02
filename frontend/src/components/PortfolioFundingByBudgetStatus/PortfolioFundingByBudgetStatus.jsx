import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

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
    cardContainer: {
        display: "flex",
        border: "0",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        alignItems: "left",
        borderColor: "#FFF",
    },
    cardGroup: {
        display: "flex",
        marginBottom: "5%",
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "250px",
    },
    cardItem: {
        display: "flex",
        flex: "1",
    },
    iconStyle: {
        verticalAlign: "middle",
        paddingRight: "4px",
    },
};

const PortfolioFundingByBudgetStatus = (props) => {
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);
    const portfolioFundingChart = useSelector((state) => state.portfolioFundingSummary.portfolioFundingChart);
    const [percent, setPercent] = useState("");

    return (
        <div
            className="usa-card__container bg-base-lightest font-family-sans padding-left-2"
            style={styles.cardContainer}
        >
            <div className="usa-card__header padding-top-2 padding-bottom-1">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-3xs text-normal">FY {props.fiscalYear} Budget Status</h3>
                </div>
            </div>
            <div className="usa-card__body font-sans-3xs" style={styles.cardBody}>
                <div style={styles.cardGroup}>
                    <div style={styles.cardItem}>
                        <span style={styles.iconStyle}>
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[0] }} />
                        </span>
                        <span>Planned</span>
                    </div>
                    <div style={styles.cardItem}>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.planned_funding.amount}
                            dollarsClasses="font-sans-3xs"
                            centsStyles={{ fontSize: "10px" }}
                        />
                    </div>
                </div>
                <div style={styles.cardGroup}>
                    <div style={styles.cardItem}>
                        <span style={styles.iconStyle}>
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[1] }} />
                        </span>
                        <span>In Execution</span>
                    </div>
                    <div style={styles.cardItem}>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.in_execution_funding.amount}
                            dollarsClasses="font-sans-3xs"
                            centsStyles={{ fontSize: "10px" }}
                        />
                    </div>
                </div>
                <div style={styles.cardGroup}>
                    <div style={styles.cardItem}>
                        <span style={styles.iconStyle}>
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[2] }} />
                        </span>
                        <span>Obligated</span>
                    </div>
                    <div style={styles.cardItem}>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.obligated_funding.amount}
                            dollarsClasses="font-sans-3xs"
                            centsStyles={{ fontSize: "10px" }}
                        />
                    </div>
                </div>
                <div style={styles.cardGroup}>
                    <div style={styles.cardItem}>
                        <span style={styles.iconStyle}>
                            <FontAwesomeIcon icon={faSquare} style={{ color: constants.colors[3] }} />
                        </span>
                        <span>Remaining</span>
                    </div>
                    <div style={styles.cardItem}>
                        <CurrencyWithSmallCents
                            amount={portfolioFunding.available_funding.amount}
                            dollarsClasses="font-sans-3xs"
                            centsStyles={{ fontSize: "10px" }}
                        />
                    </div>
                </div>
                {/*</div>*/}
            </div>
            <div className="usa-card__media usa-card__media--inset">
                <div className="usa-card__img">
                    <div
                        style={styles.root}
                        aria-label="This is a Donut Chart that displays the percent by budget line status in the center."
                        role="img"
                    >
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

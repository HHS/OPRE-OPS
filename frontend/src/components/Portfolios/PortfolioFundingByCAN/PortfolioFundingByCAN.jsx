import { useSelector } from "react-redux";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

import { ResponsiveDonutWithInnerPercent } from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/ResponsiveDonutWithInnerPercent";

import constants from "../../../constants";
import CustomLayerComponent from "../../UI/DataViz/ResponsiveDonutWithInnerPercent/CustomLayerComponent";
import CurrencyWithSmallCents from "../../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";

import cssClasses from "./styles.module.css";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";

library.add(faSquare);

const styles = {
    root: {
        width: 175,
        height: 175
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        alignItems: "left",
        borderColor: "#FFF"
    },
    cardGroup: {
        display: "flex",
        marginBottom: "7%",
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "250px"
    },
    cardItem: {
        display: "flex",
        flex: "1"
    },
    iconStyle: {
        verticalAlign: "middle",
        paddingRight: "4px"
    }
};

const PortfolioFundingByCAN = () => {
    const portfolioFunding = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const portfolioCansFundingDetails = useSelector((state) => state.portfolio.portfolioCansFundingDetails);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const [percent, setPercent] = useState("");
    const [canChartData, setCanChartData] = useState([]);

    const cardBody = `padding-top-2 padding-left-4 ${styles.cardBody}`;

    useEffect(() => {
        const portfolio_total_funding = parseFloat(portfolioFunding.total_funding.amount);

        if (portfolio_total_funding) {
            const data = portfolioCansFundingDetails
                .filter((item) => item.total_funding)
                .map((item, index) => {
                    if (item.total_funding) {
                        return {
                            id: item.can.id,
                            value: item.total_funding,
                            percent: `${Math.floor((parseFloat(item.total_funding) / portfolio_total_funding) * 100)}%`,
                            color: constants.colors[index],
                            number: item.can.number
                        };
                    }
                });

            setCanChartData(data);
        }

        return () => {
            setCanChartData([]);
        };
    }, [portfolioFunding, portfolioCansFundingDetails]);

    return (
        <RoundedBox>
            <div className={cardBody}>
                <div className="padding-bottom-1">
                    <h3 className="font-sans-3xs text-normal">FY {fiscalYear.value} Portfolio CANs</h3>
                </div>
                <div className="font-sans-3xs">
                    {canChartData.slice(0, 5).map((item) => (
                        <div
                            style={styles.cardGroup}
                            key={item.id}
                        >
                            <div style={styles.cardItem}>
                                <span style={styles.iconStyle}>
                                    <FontAwesomeIcon
                                        icon={faSquare}
                                        style={{ color: item.color }}
                                    />
                                </span>
                                <span>{item.number}</span>
                            </div>
                            <div style={styles.cardItem}>
                                <CurrencyWithSmallCents
                                    amount={item.value}
                                    dollarsClasses="font-sans-3xs"
                                    centsStyles={{ fontSize: "10px" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div
                className={cssClasses.chartArea}
                id="portfolioCANChart"
            >
                <div className="padding-top-4">
                    <div
                        style={styles.root}
                        aria-label="This is a Donut Chart that displays the percent by can in the center."
                        role="img"
                    >
                        <ResponsiveDonutWithInnerPercent
                            data={canChartData}
                            width={styles.root.width}
                            height={styles.root.height}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            CustomLayerComponent={CustomLayerComponent(percent)}
                            setPercent={setPercent}
                            container_id="portfolioCANChart"
                        />
                    </div>
                </div>
            </div>
        </RoundedBox>
    );
};

export default PortfolioFundingByCAN;

import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { VictoryPie, Slice, VictoryTooltip } from "victory";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

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

const CustomSlice = (props) => {
    const [scale, setScale] = useState(1);

    // modified transformation from here
    // https://github.com/FormidableLabs/victory/blob/844109cfe4e40b23a4dcb565e551a5a98015d0c0/packages/victory-pie/src/slice.js#L74
    const transform = `translate(${props.origin.x}, ${props.origin.y}) scale(${scale})`;

    return (
        <Slice
            {...props}
            style={{ ...props.style }}
            events={{
                onMouseOver: (e) => {
                    if (props.events.onMouseOver) {
                        props.events.onMouseOver(e);
                    }
                    setScale((c) => c * 1.2);
                },
                onMouseOut: (e) => {
                    if (props.events.onMouseOut) {
                        props.events.onMouseOut(e);
                    }
                    setScale(1);
                },
            }}
            transform={transform}
        />
    );
};

const PortfolioFunding = () => {
    const today = new Date();
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);
    const portfolioFundingChart = useSelector((state) => state.portfolioFundingSummary.portfolioFundingChart);

    return (
        <div className="usa-card__container bg-base-lightest font-family-sans">
            <div className="usa-card__header padding-left-1">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-md">Total Funding</h3>
                    <h4 className="margin-0 font-sans-sm">Fiscal Year: {getCurrentFiscalYear(today)}</h4>
                </div>
            </div>
            <div className="usa-card__media padding-1">
                <VictoryPie
                    dataComponent={<CustomSlice />}
                    labelComponent={<VictoryTooltip style={{ fontSize: 30 }} constrainToVisibleArea />}
                    className="usa-card__img margin-top-2"
                    aria-label="Portfolio Pie Chart With Funding Status Percentages"
                    data={portfolioFundingChart}
                    labels={[]}
                    style={{
                        data: {
                            fill: ({ datum }) => datum.fill,
                        },
                    }}
                    responsive={false}
                />
            </div>
            <div className="usa-card__body padding-1">
                <CurrencyFormat
                    value={parseInt(portfolioFunding.total_funding.amount)}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$ "}
                    renderText={(value) => <h3 className="font-sans-xl text-bold margin-bottom-0">{value}</h3>}
                />
                <div className="grid-container padding-top-0 padding-1 font-sans-3xs">
                    <div className="grid-row margin-bottom-1">
                        <div className="grid-col-8">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[0] }} />
                            Planned
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.planned_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-4" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row margin-bottom-1">
                        <div className="grid-col-8">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[1] }} />
                            In Execution
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.in_execution_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-4" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row margin-bottom-1">
                        <div className="grid-col-8">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[2] }} />
                            Obligated
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.obligated_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-4" style={{ fontWeight: 600 }}>
                                    {value}
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid-row">
                        <div className="grid-col-8">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[3] }} />
                            Remaining
                        </div>
                        <CurrencyFormat
                            value={portfolioFunding.available_funding.amount}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => (
                                <div className="grid-col-4" style={{ fontWeight: 600 }}>
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

export default PortfolioFunding;

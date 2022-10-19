import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { VictoryPie, Slice, VictoryLabel, VictoryTooltip } from "victory";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

library.add(faSquare);

const data1 = {
    total_funding: 665539,
    planned_funding: 10000,
    obligated_funding: 50000,
    available_funding: 605539,
};

// data1 = {
//     "total_funding": {
//         "amount": 665539,
//         "label": ""
//     },
//     "planned_funding": {
//         "amount": 10000,
//         "label: :"Planned 0.01%",
// }
// obligated_funding: 50000,
//     available_funding: 605539,
// }

const data2 = [
    { x: "planned_funding", y: 10000, label: "Planned 0.01%" },
    { x: "in_execution_funding", y: 10000, label: "In Execution 0.01%" },
    { x: "obligated_funding", y: 50000, label: "Obligated 0.07%" },
    { x: "available_funding", y: 605539, label: "Remaining 91%" },
];

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

    const listStyle = {
        listStyle: "square",
    };

    return (
        <div className="usa-card__container bg-base-lightest font-family-sans">
            <div className="usa-card__header padding-left-1">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-sans-md">Total Funding</h3>
                    <h4 className="margin-0 font-sans-sm">Fiscal Year: {getCurrentFiscalYear(today)}</h4>
                </div>
            </div>
            <div className="usa-card__media padding-3">
                <VictoryPie
                    dataComponent={<CustomSlice />}
                    labelComponent={<VictoryTooltip style={{ fontSize: 50 }} />}
                    className="usa-card__img"
                    data={data2}
                    labels={[]}
                    colorScale={colors}
                    style={{
                        data: {
                            fillOpacity: 0.9,
                            stroke: "black",
                            strokeWidth: 1,
                        },
                    }}
                />
            </div>
            <div className="usa-card__body padding-1">
                <CurrencyFormat
                    value={parseInt(data1.total_funding)}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    renderText={(value) => <h3 className="font-sans-xl text-bold">{value}</h3>}
                />
                <div className="grid-container padding-1 font-sans-3xs">
                    <div className="grid-row">
                        <div className="grid-col-8">
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[0] }} />
                            Planned
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.planned_funding)}
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
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[1] }} />
                            In Execution
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.planned_funding)}
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
                            <FontAwesomeIcon icon={faSquare} style={{ color: colors[2] }} />
                            Obligated
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.obligated_funding)}
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
                            value={parseInt(data1.available_funding)}
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

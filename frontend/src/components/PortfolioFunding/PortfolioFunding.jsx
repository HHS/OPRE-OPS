import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { VictoryPie, VictoryChart, VictoryLegend } from "victory";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";

library.add(faSquare);

const data1 = {
    total_funding: 665539,
    planned_funding: 10000,
    obligated_funding: 50000,
    available_funding: 605539,
};

const data2 = [
    { x: "planned_funding", y: 10000 },
    { x: "in_execution_funding", y: 10000 },
    { x: "obligated_funding", y: 50000 },
    { x: "available_funding", y: 605539 },
];

const PortfolioFunding = () => {
    const today = new Date();
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    const listStyle = {
        listStyle: "square",
    };

    return (
        <div className="usa-card__container">
            <div className="usa-card__header">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-heading-md">Total Funding</h3>
                    <h4 className="margin-0 font-heading-2xs">Fiscal Year: {getCurrentFiscalYear(today)}</h4>
                </div>
            </div>
            <div className="usa-card__media">
                <VictoryPie
                    className="usa-card__img"
                    data={data2}
                    labels={[]}
                    padding={0}
                    colorScale={["red", "green", "blue", "yellow"]}
                    style={{
                        data: {
                            fillOpacity: 0.9,
                            stroke: "black",
                            strokeWidth: 5,
                        },
                    }}
                />
            </div>
            <div className="usa-card__body padding-0">
                <CurrencyFormat
                    value={parseInt(portfolioFunding.total_funding)}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    renderText={(value) => <h3 className="font-heading-xl">{value}</h3>}
                />
                <div className="grid-container padding-0">
                    <div className="grid-row">
                        <div className="grid-col">
                            <FontAwesomeIcon icon={faSquare} className="" style={{ color: "red" }} />
                            Planned
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.planned_funding)}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => <div className="grid-col">{value}</div>}
                        />
                    </div>
                    <div className="grid-row">
                        <div className="grid-col">
                            <FontAwesomeIcon icon={faSquare} className="" style={{ color: "green" }} />
                            In Execution
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.planned_funding)}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => <div className="grid-col">{value}</div>}
                        />
                    </div>
                    <div className="grid-row">
                        <div className="grid-col">
                            <FontAwesomeIcon icon={faSquare} className="" style={{ color: "blue" }} />
                            Obligated
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.obligated_funding)}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => <div className="grid-col">{value}</div>}
                        />
                    </div>
                    <div className="grid-row">
                        <div className="grid-col">
                            <FontAwesomeIcon icon={faSquare} className="" style={{ color: "yellow" }} />
                            Remaining
                        </div>
                        <CurrencyFormat
                            value={parseInt(data1.available_funding)}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            renderText={(value) => <div className="grid-col">{value}</div>}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFunding;

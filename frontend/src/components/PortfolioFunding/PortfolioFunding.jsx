import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { VictoryBar, VictoryChart } from "victory";

const data = [
    { quarter: 1, earnings: 13000 },
    { quarter: 2, earnings: 16500 },
    { quarter: 3, earnings: 14250 },
    { quarter: 4, earnings: 19000 },
];

const PortfolioFunding = () => {
    const today = new Date();
    const portfolioFunding = useSelector((state) => state.portfolioFundingSummary.portfolioFunding);

    return (
        <div className="usa-card__container">
            <div className="usa-card__header padding-2">
                <div className="use-card__heading">
                    <h3 className="margin-0 font-heading-md">Total Funding</h3>
                    <h4 className="margin-0 font-heading-2xs">Fiscal Year: {getCurrentFiscalYear(today)}</h4>
                </div>
            </div>
            <div className="usa-card__media">
                <VictoryChart className="usa-card__img">
                    <VictoryBar data={data} />
                </VictoryChart>
            </div>
            <div className="usa-card__body padding-2">
                <CurrencyFormat
                    value={parseInt(portfolioFunding.total_funding)}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    renderText={(value) => <h3 className="font-body-xl">{value}</h3>}
                />
            </div>
        </div>
    );
};

export default PortfolioFunding;

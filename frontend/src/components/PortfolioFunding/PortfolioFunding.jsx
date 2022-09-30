import { getCurrentFiscalYear } from "./util";
import { useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";

const PortfolioFunding = (props) => {
    const today = new Date();
    const portfolio = useSelector((state) => state.portfolioFundingSummary.portfolio);

    return (
        <div className="usa-card__container">
            <div className="usa-card__header padding-2">
                <div className="use-card__heading">
                    <h3 className="margin-0">Total Funding</h3>
                    <h5 className="margin-0">Fiscal Year: {getCurrentFiscalYear(today)}</h5>
                </div>
            </div>
            <div className="usa-card__media">
                <div className="usa-card__img">
                    <img
                        src="https://designsystem.digital.gov/img/introducing-uswds-2-0/built-to-grow--alt.jpg"
                        alt="A placeholder"
                    />
                </div>
            </div>
            <div className="usa-card__body padding-2">
                <CurrencyFormat
                    value={parseInt(portfolio.current_fiscal_year_funding)}
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

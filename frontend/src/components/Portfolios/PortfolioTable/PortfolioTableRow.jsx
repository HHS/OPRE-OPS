import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { NO_DATA } from "../../../constants";

/**
 * PortfolioTableRow component - displays a single portfolio row with funding data
 * @component
 * @param {Object} props
 * @param {Object} props.portfolio - Portfolio object with fundingSummary attached
 * @param {number} props.fiscalYear - Fiscal year to pass to details page
 * @returns {JSX.Element}
 */
const PortfolioTableRow = ({ portfolio, fiscalYear }) => {
    const fundingSummary = portfolio.fundingSummary;

    // Extract funding values
    const totalFunding = fundingSummary?.total_funding?.amount ?? 0;
    const plannedFunding = fundingSummary?.planned_funding?.amount ?? 0;
    const obligatedFunding = fundingSummary?.obligated_funding?.amount ?? 0;
    const inExecutionFunding = fundingSummary?.in_execution_funding?.amount ?? 0;
    const availableFunding = fundingSummary?.available_funding?.amount ?? 0;

    // Calculate spending
    const spending = plannedFunding + obligatedFunding + inExecutionFunding;

    return (
        <tr>
            <td>
                <Link
                    to={`/portfolios/${portfolio.id}/spending?fy=${fiscalYear}`}
                    className="text-ink text-no-underline"
                >
                    {portfolio.name || portfolio.abbreviation
                        ? `${portfolio.name || NO_DATA} (${portfolio.abbreviation || NO_DATA})`
                        : NO_DATA}
                </Link>
            </td>
            <td>
                {totalFunding > 0 ? (
                    <CurrencyFormat
                        value={totalFunding}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={getDecimalScale(totalFunding)}
                        fixedDecimalScale={true}
                    />
                ) : (
                    <span className="text-ink">{NO_DATA}</span>
                )}
            </td>
            <td>
                {spending > 0 ? (
                    <CurrencyFormat
                        value={spending}
                        displayType={"text"}
                        thousandSeparator={true}
                        prefix={"$"}
                        decimalScale={getDecimalScale(spending)}
                        fixedDecimalScale={true}
                    />
                ) : (
                    <span className="text-ink">{NO_DATA}</span>
                )}
            </td>
            <td>
                <CurrencyFormat
                    value={availableFunding}
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={"$"}
                    decimalScale={getDecimalScale(availableFunding)}
                    fixedDecimalScale={true}
                />
            </td>
        </tr>
    );
};

export default PortfolioTableRow;

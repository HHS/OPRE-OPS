import { Link } from "react-router-dom";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
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
                        ? portfolio.name &&
                          portfolio.abbreviation &&
                          portfolio.name.toLowerCase() !== portfolio.abbreviation.toLowerCase()
                            ? `${portfolio.name} (${portfolio.abbreviation})`
                            : portfolio.name || portfolio.abbreviation || NO_DATA
                        : NO_DATA}
                </Link>
            </td>
            <td>
                {totalFunding > 0 ? (
                    formatCurrency(totalFunding)
                ) : (
                    <span className="text-ink">{NO_DATA}</span>
                )}
            </td>
            <td>
                {spending > 0 ? (
                    formatCurrency(spending)
                ) : (
                    <span className="text-ink">{NO_DATA}</span>
                )}
            </td>
            <td>
                {formatCurrency(availableFunding)}
            </td>
        </tr>
    );
};

export default PortfolioTableRow;

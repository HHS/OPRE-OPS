import { Link } from "react-router-dom";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import Tooltip from "../../UI/USWDS/Tooltip";
import { displayActivePeriod } from "./CANTableRow.helpers";
import { NO_DATA } from "../../../constants";
import { useListTrailState } from "../../../hooks/useBreadcrumbTrail.hooks";
import { useHandOverFiscalYear } from "../../../hooks/useDetailFiscalYear.hooks";
import { withFiscalYearParam } from "../../../helpers/utils";

/**
 * CanTableRow component of CANTable
 * @component
 * @param {Object} props
 * @param {number} props.activePeriod - Active Period in years
 * @param {number} props.canId - CAN ID
 * @param {number} props.fiscalYear - Selected Fiscal Year
 * @param {{available_funding?: number, received_funding?: number, total_funding?: number}} [props.fundingSummary] - Funding summary for this CAN
 * @param {string} props.name - CAN name
 * @param {string} props.nickname - CAN nickname
 * @param {string} props.obligateBy - Obligate By Date
 * @param {string} props.portfolio - Portfolio abbreviation
 * @returns {JSX.Element}
 */
const CANTableRow = ({ activePeriod, canId, fiscalYear, fundingSummary, name, nickname, obligateBy, portfolio }) => {
    const totalFunding = fundingSummary?.total_funding ?? 0;
    const fundingReceived = fundingSummary?.received_funding ?? 0;
    const availableFunds = fundingSummary?.available_funding ?? 0;
    const listTrailState = useListTrailState("cans");
    const handOverFiscalYear = useHandOverFiscalYear();
    // Open the CAN on the FY selected in the list.
    const canPath = withFiscalYearParam(`/cans/${canId}`, fiscalYear);

    return (
        <tr>
            <td>
                <Tooltip
                    label={nickname}
                    position="right"
                >
                    <Link
                        to={canPath}
                        state={listTrailState(canPath)}
                        onClick={handOverFiscalYear(fiscalYear)}
                        className="text-ink text-no-underline"
                    >
                        {name}
                    </Link>
                </Tooltip>
            </td>
            <td>{portfolio}</td>
            <td>{displayActivePeriod(activePeriod)}</td>
            <td>{obligateBy}</td>
            <td>{totalFunding > 0 ? formatCurrency(totalFunding) : <span className="text-ink">{NO_DATA}</span>}</td>
            {fundingReceived === 0 ? <td>TBD</td> : <td>{formatCurrency(fundingReceived)}</td>}
            <td>{formatCurrency(availableFunds)}</td>
        </tr>
    );
};

export default CANTableRow;

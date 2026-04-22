import CurrencyFormat from "react-currency-format";
import { formatActivePeriod, getTableHeadings } from "./ProjectFundingCANsTable.constants";

/**
 * @typedef {Object} ProjectFundingCAN
 * @property {number} id
 * @property {string} number
 * @property {number} portfolio_id
 * @property {string} portfolio
 * @property {number | null} active_period
 * @property {number} fy_funding
 * @property {number} lifetime_funding
 */

/**
 * Table displaying Project Funding broken down by CAN.
 *
 * @component
 * @param {Object} props
 * @param {ProjectFundingCAN[]} props.cans
 * @param {number} props.fiscalYear - Selected fiscal year (drives dynamic column header)
 * @returns {JSX.Element}
 */
const ProjectFundingCANsTable = ({ cans = [], fiscalYear }) => {
    const headings = getTableHeadings(fiscalYear);

    if (cans.length === 0) {
        return (
            <p
                className="text-center"
                data-testid="project-funding-cans-empty"
            >
                No CANs found for this project.
            </p>
        );
    }

    return (
        <table
            className="usa-table usa-table--borderless width-full"
            data-testid="project-funding-cans-table"
        >
            <thead>
                <tr>
                    {headings.map((heading) => (
                        <th
                            key={heading}
                            scope="col"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {heading}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {cans.map((can) => (
                    <tr key={can.id}>
                        <td>{can.number}</td>
                        <td>{can.portfolio}</td>
                        <td>{formatActivePeriod(can.active_period)}</td>
                        <td>
                            <CurrencyFormat
                                value={can.fy_funding}
                                displayType="text"
                                thousandSeparator=","
                                prefix="$"
                                decimalScale={2}
                                fixedDecimalScale
                            />
                        </td>
                        <td>
                            <CurrencyFormat
                                value={can.lifetime_funding}
                                displayType="text"
                                thousandSeparator=","
                                prefix="$"
                                decimalScale={2}
                                fixedDecimalScale
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ProjectFundingCANsTable;

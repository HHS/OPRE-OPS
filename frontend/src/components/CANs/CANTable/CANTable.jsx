import React from "react";
import { NO_DATA } from "../../../constants";
import PaginationNav from "../../UI/PaginationNav";
import { formatObligateBy } from "./CANTable.helpers";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";
import { useLazyGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { exportTableToCsv } from "../../../utils/tableExport";

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../CANTypes").CAN} CAN
 * @typedef {import("../CANTypes").FundingSummary} FundingSummary
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @param {number} props.fiscalYear - Fiscal year to filter by
 * @returns {JSX.Element}
 */
const CANTable = ({ cans, fiscalYear }) => {
    const [trigger] = useLazyGetCanFundingSummaryQuery();
    const tableRef = React.useRef(null);
    const CANS_PER_PAGE = import.meta.env.MODE === "production" ? 25 : 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = [...cans];
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);

    const handleExport = async () => {
        try {
            // table row headers
            const TABLE_HEADERS = [
                "CAN",
                "Portfolio",
                "Active Period",
                "Obligate By",
                "FY Budget",
                "Funding Received",
                "Available Budget"
            ];
            // Get funding data for each CAN individually
            const fundingPromises = cans.map((can) =>
                trigger({
                    ids: [can.id],
                    fiscalYear
                }).unwrap()
            );

            const fundingResponses = await Promise.all(fundingPromises);

            // Create a map of CAN IDs to their funding data
            /** @type {Record<number, {total_funding: number, received_funding: number, available_funding: number}>} */
            const fundingMap = {};
            cans.forEach((can, index) => {
                const response = fundingResponses[index];
                fundingMap[can.id] = {
                    total_funding: response.total_funding,
                    received_funding: response.received_funding,
                    available_funding: response.available_funding
                };
            });

            // Export the data using the helper function
            await exportTableToCsv({
                tableRef,
                data: cans,
                headers: TABLE_HEADERS,
                rowMapper: (/** @type {CAN} */ can) => [
                    can.number,
                    can.portfolio.abbreviation,
                    `${can.active_period ?? 0} years`,
                    formatObligateBy(can.obligate_by),
                    fundingMap[can.id]?.total_funding?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    }) ?? "TBD",
                    fundingMap[can.id]?.received_funding?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    }) ?? "TBD",
                    fundingMap[can.id]?.available_funding?.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    }) ?? "TBD"
                ],
                filename: "cans.csv"
            });
        } catch (error) {
            console.error("Failed to export data:", error);
        }
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [fiscalYear, cans]);

    if (cans.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }

    return (
        <>
            <table
                className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}
                ref={tableRef}
            >
                <CANTableHead />
                <tbody>
                    {cansPerPage.map((can) => (
                        <CANTableRow
                            key={can.id}
                            canId={can.id}
                            name={can.display_name ?? NO_DATA}
                            nickname={can.nick_name ?? NO_DATA}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={fiscalYear}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
                        />
                    ))}
                </tbody>
            </table>

            <button
                className="usa-button"
                onClick={handleExport}
            >
                Export to CSV
            </button>

            {cans.length > CANS_PER_PAGE && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={cans}
                    itemsPerPage={CANS_PER_PAGE}
                />
            )}
        </>
    );
};

export default CANTable;

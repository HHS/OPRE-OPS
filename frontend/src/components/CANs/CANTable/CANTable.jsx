import Papa from "papaparse";
import React from "react";
import { NO_DATA } from "../../../constants";
import DebugCode from "../../DebugCode";
import PaginationNav from "../../UI/PaginationNav";
import { formatObligateBy } from "./CANTable.helpers";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";
/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @param {number} props.fiscalYear - Fiscal year to filter by
 * @returns {JSX.Element}
 */
const CANTable = ({ cans, fiscalYear }) => {
    const tableRef = React.useRef(null);
    const CANS_PER_PAGE = import.meta.env.MODE === "production" ? 25 : 10;
    const [currentPage, setCurrentPage] = React.useState(1);
    let cansPerPage = [...cans];
    cansPerPage = cansPerPage.slice((currentPage - 1) * CANS_PER_PAGE, currentPage * CANS_PER_PAGE);

    // const canDescriptions = new Map(cans.map((can) => [can.number, can.description]));

    const exportTableToCsv = () => {
        if (!tableRef.current) return;
        const canDescriptions = new Map(cans.map((can) => [can.number, can.description]));

        // Get headers from th elements, excluding tooltip content
        let headers = Array.from(tableRef.current.querySelectorAll("thead th")).map((header) => {
            // Get the direct text content, excluding tooltip content
            const headerText = Array.from(header.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent.trim())
                .join("");
            return headerText || header.textContent.trim();
        });
        headers = [...headers, "Descriptions"];

        // Get data from td elements, excluding tooltip content
        let rows = Array.from(tableRef.current.querySelectorAll("tbody tr")).map((row) => {
            const rowData = Array.from(row.querySelectorAll("td")).map((cell, cellIndex) => {
                // Get the direct text content, excluding tooltip content
                if (cellIndex === 0) {
                    // Find the Link element inside the Tooltip and get its text content
                    const linkElement = cell.querySelector("a.text-ink.text-no-underline");
                    if (linkElement) {
                        return linkElement.textContent.trim();
                    }
                }

                return cell.textContent.trim();
            });
            // Add the description as a new column for each row

            const key = rowData[0].split(" ")[0];

            return [...rowData, canDescriptions.get(key) || ""];
        });

        // Combine headers and rows
        const csvData = [headers, ...rows];

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cans.csv";
        a.click();
        URL.revokeObjectURL(url);
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
            <DebugCode data={{}} />
            <button
                className="usa-button"
                onClick={exportTableToCsv}
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

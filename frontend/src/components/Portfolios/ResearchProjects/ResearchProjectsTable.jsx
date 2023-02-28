import * as React from "react";
import { Link } from "react-router-dom";
import useSortableData from "../../../helpers/useSortableData";
import CurrencyFormat from "react-currency-format";

const ResearchProjectsTable = ({ fiscalYear, data }) => {
    const { items: projectTableData, requestSort, sortConfig } = useSortableData(data);
    const [isTableSorted, setIsTableSorted] = React.useState(null);

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    const SortIcon = () => (
        <button
            tabIndex="0"
            className="usa-table__header__button"
            title="Click to sort by Alphabetical in ascending order."
        >
            <svg className="usa-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g className="descending" fill="transparent">
                    <path d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"></path>
                </g>
                <g className="ascending" fill="transparent">
                    <path
                        transform="rotate(180, 12, 12)"
                        d="M17 17L15.59 15.59L12.9999 18.17V2H10.9999V18.17L8.41 15.58L7 17L11.9999 22L17 17Z"
                    ></path>
                </g>
                <g className="unsorted" fill="transparent">
                    <polygon points="15.17 15 13 17.17 13 6.83 15.17 9 16.58 7.59 12 3 7.41 7.59 8.83 9 11 6.83 11 17.17 8.83 15 7.42 16.41 12 21 16.59 16.41 15.17 15"></polygon>
                </g>
            </svg>
        </button>
    );

    const TableRow = ({ id, name, link, funding, fundingToDate, firstAwardDate, cans, agreement }) => (
        <tr>
            <th
                scope="row"
                data-sort-value={name}
                // data-sort-active={isTableSorted}
            >
                <Link
                    to={link}
                    className="text-ink text-no-underline hover:text-underline usa-tooltip"
                    data-position="top"
                    // only show tooltip if name is longer than 30 characters
                    title={name.length > 30 ? name : ""}
                >
                    {/* truncate to 30 characters */}
                    {name.length > 30 ? name.substring(0, 30) + "..." : name}
                </Link>
            </th>

            <td data-sort-value={funding}>
                <CurrencyFormat value={funding} displayType={"text"} thousandSeparator={true} prefix={"$"} />
            </td>
            <td data-sort-value={fundingToDate}>
                <CurrencyFormat value={fundingToDate} displayType={"text"} thousandSeparator={true} prefix={"$"} />
            </td>
            <td data-sort-value={firstAwardDate}>{firstAwardDate}</td>
            <td data-sort-value={cans}>{cans}</td>
            <td data-sort-value={agreement}>{agreement}</td>
        </tr>
    );

    return (
        <div className="usa-table-container--scrollable" tabIndex="0">
            <table className="usa-table usa-table--borderless width-full">
                <thead>
                    <tr>
                        <th
                            data-sortable
                            scope="col"
                            role="columnheader"
                            style={{ paddingRight: 0, width: "32%" }}
                            // aria-sort={isTableSorted ? "descending" : "ascending"}
                        >
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("name")}
                            >
                                Project Name
                            </button>
                        </th>

                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("funding")}
                            >
                                FY {fiscalYear.value} Funding
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("fundingToDate")}
                            >
                                Funding to Date
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("firstAwardDate")}
                            >
                                First Award
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("cans")}
                            >
                                CANs
                            </button>
                        </th>
                        <th scope="col" role="columnheader">
                            <button
                                className="usa-button usa-button--outline usa-button--unstyled"
                                type="button"
                                onClick={() => requestSort("agreement")}
                            >
                                Agreements
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {projectTableData.map((tableData) => (
                        <TableRow key={tableData.id} {...tableData} />
                    ))}
                </tbody>
            </table>
            <div className="usa-sr-only usa-table__announcement-region" aria-live="polite">
                {isTableSorted ? "table is sorted" : "Table  is not sorted"}
            </div>
        </div>
    );
};

export default ResearchProjectsTable;

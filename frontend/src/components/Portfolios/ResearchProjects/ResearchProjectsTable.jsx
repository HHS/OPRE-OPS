import * as React from "react";
import { Link } from "react-router-dom";
import useSortableData from "../../../helpers/useSortableData";
import CurrencyFormat from "react-currency-format";
import "./tables.scss";

const ResearchProjectsTable = ({ fiscalYear, data }) => {
    const { items: projectTableData, requestSort, sortConfig } = useSortableData(data);
    // const [isTableSorted, setIsTableSorted] = React.useState(null);

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

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

    // useeffect to sort  by name on initial render
    React.useEffect(() => {
        requestSort("name");
    }, []);

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
                            // aria sort
                        >
                            <button
                                className={getClassNamesFor("name")}
                                type="button"
                                onClick={() => requestSort("name")}
                            >
                                Project Name
                            </button>
                        </th>

                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className={getClassNamesFor("funding")}
                                type="button"
                                onClick={() => requestSort("funding")}
                            >
                                FY {fiscalYear.value} Funding
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className={getClassNamesFor("fundingToDate")}
                                type="button"
                                onClick={() => requestSort("fundingToDate")}
                            >
                                Funding to Date
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className={getClassNamesFor("firstAwardDate")}
                                type="button"
                                onClick={() => requestSort("firstAwardDate")}
                            >
                                First Award
                            </button>
                        </th>
                        <th scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                            <button
                                className={getClassNamesFor("cans")}
                                type="button"
                                onClick={() => requestSort("cans")}
                            >
                                CANs
                            </button>
                        </th>
                        <th scope="col" role="columnheader">
                            <button
                                className={getClassNamesFor("agreement")}
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
                {/* {isTableSorted ? "table is sorted" : "Table  is not sorted"} */}
            </div>
        </div>
    );
};

export default ResearchProjectsTable;

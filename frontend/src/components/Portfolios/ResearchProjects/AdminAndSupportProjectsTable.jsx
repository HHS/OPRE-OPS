import * as React from "react";
import { Link } from "react-router-dom";
import useSortableData from "../../../helpers/useSortableData";
import CurrencyFormat from "react-currency-format";
import "./tables.scss";

const AdminAndSupportProjectsTable = ({ fiscalYear, data }) => {
    const { items: projectTableData, requestSort, sortConfig } = useSortableData(data);

    const srMsg = `The table named Admin and Support Projects is now sorted by ${sortConfig?.key} in ${sortConfig?.direction} order.`;

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    const TableRow = ({ name, link, funding, fundingToDate, firstAwardDate, cans, agreement }) => (
        <tr>
            <th scope="row" data-sort-value={name} data-sort-active={getClassNamesFor("name")}>
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
            <td data-sort-value={funding} data-sort-active={getClassNamesFor("funding")}>
                <CurrencyFormat value={funding} displayType={"text"} thousandSeparator={true} prefix={"$"} />
            </td>
            <td data-sort-value={fundingToDate} data-sort-active={getClassNamesFor("fundingToDate")}>
                <CurrencyFormat value={fundingToDate} displayType={"text"} thousandSeparator={true} prefix={"$"} />
            </td>
            <td data-sort-value={firstAwardDate} data-sort-active={getClassNamesFor("firstAwardDate")}>
                {firstAwardDate}
            </td>
            <td data-sort-value={cans} data-sort-active={getClassNamesFor("cans")}>
                {cans}
            </td>
            <td data-sort-value={agreement} data-sort-active={getClassNamesFor("agreement")}>
                {agreement}
            </td>
        </tr>
    );

    // sort Table by name on initial render
    React.useEffect(() => {
        requestSort("name");
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                            style={{ width: "32%" }}
                            aria-label={
                                getClassNamesFor("name")
                                    ? `Project Name, sortable column, sorted in ${getClassNamesFor("name")} order`
                                    : `Project Name, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("name")}
                        >
                            <button
                                type="button"
                                onClick={() => requestSort("name")}
                                className={getClassNamesFor("name")}
                            >
                                Project Name
                            </button>
                        </th>
                        <th
                            scope="col"
                            role="columnheader"
                            aria-label={
                                getClassNamesFor("funding")
                                    ? `FY ${fiscalYear.value} Funding, sortable column, sorted in ${getClassNamesFor(
                                          "funding"
                                      )} order`
                                    : `FY ${fiscalYear.value} Funding, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("funding")}
                        >
                            <button
                                className={getClassNamesFor("funding")}
                                type="button"
                                onClick={() => requestSort("funding")}
                            >
                                FY {fiscalYear.value} Funding
                            </button>
                        </th>
                        <th
                            scope="col"
                            role="columnheader"
                            aria-label={
                                getClassNamesFor("fundingToDate")
                                    ? `Funding to Date, sortable column, sorted in ${getClassNamesFor(
                                          "fundingToDate"
                                      )} order`
                                    : `Funding to Date, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("fundingToDate")}
                        >
                            <button
                                className={getClassNamesFor("fundingToDate")}
                                type="button"
                                onClick={() => requestSort("fundingToDate")}
                            >
                                Funding to Date
                            </button>
                        </th>
                        <th
                            scope="col"
                            role="columnheader"
                            aria-label={
                                getClassNamesFor("firstAwardDate")
                                    ? `First Award, sortable column, sorted in ${getClassNamesFor(
                                          "firstAwardDate"
                                      )} order`
                                    : `First Award, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("firstAwardDate")}
                        >
                            <button
                                className={getClassNamesFor("firstAwardDate")}
                                type="button"
                                onClick={() => requestSort("firstAwardDate")}
                            >
                                First Award
                            </button>
                        </th>
                        <th
                            scope="col"
                            role="columnheader"
                            aria-label={
                                getClassNamesFor("cans")
                                    ? `CANs, sortable column, sorted in ${getClassNamesFor("cans")} order`
                                    : `CANs, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("cans")}
                        >
                            <button
                                className={getClassNamesFor("cans")}
                                type="button"
                                onClick={() => requestSort("cans")}
                            >
                                CANs
                            </button>
                        </th>
                        <th
                            scope="col"
                            role="columnheader"
                            aria-label={
                                getClassNamesFor("agreement")
                                    ? `Agreements, sortable column, sorted in ${getClassNamesFor("agreement")} order`
                                    : `Agreements, sortable column, currently unsorted`
                            }
                            aria-sort={getClassNamesFor("agreement")}
                        >
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
                {srMsg}
            </div>
        </div>
    );
};

export default AdminAndSupportProjectsTable;

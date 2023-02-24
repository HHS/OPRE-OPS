import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import CurrencyFormat from "react-currency-format";
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { getResearchProjects } from "../../../pages/portfolios/detail/getResearchProjects";
import ResearchBudgetVsSpending from "./ResearchBudgetVsSpending";
import ProjectsAndAgreements from "./ProjectsAndAgreements";
import useSortableData from "../../../helpers/useSortableData";
import { data } from "./data";

const ResearchProjects = () => {
    const dispatch = useDispatch();
    const urlPathParams = useParams();
    const portfolio = useSelector((state) => state.portfolioBudgetSummary.portfolio);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    const portfolioId = parseInt(urlPathParams.id);
    const researchProjects = useSelector((state) => state.portfolio.researchProjects);
    const filteredResearchProjects = data.filter((project) => project.type === "research");
    const filteredAdminAndSupportProjects = data.filter((project) => project.type === "admin_and_support");
    const numberOfProjects = filteredResearchProjects.length + filteredAdminAndSupportProjects.length;
    const [isTableSorted, setIsTableSorted] = useState(null);

    const { items: projectTableData, requestSort, sortConfig } = useSortableData(filteredResearchProjects);

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    // Comps
    const researchProjectData = researchProjects.map((rp) => (
        <li key={rp.id}>
            <Link to={`/research-projects/${rp.id}`}>{rp.title}</Link>
        </li>
    ));

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
            <th scope="row" data-sort-value={name} data-sort-active={isTableSorted}>
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

    // Get ResearchProject data
    useEffect(() => {
        const getResearchProjectsAndSetState = async () => {
            const result = await getResearchProjects(portfolioId, fiscalYear.value);
            dispatch(setResearchProjects(result));
        };

        getResearchProjectsAndSetState().catch(console.error);

        return () => {
            dispatch(setResearchProjects([]));
        };
    }, [dispatch, fiscalYear, portfolioId]);

    return (
        <section>
            <h2 className="font-sans-lg">Projects & Spending Summary</h2>
            <p className="font-sans-sm">
                The summary below displays all active projects, spending and agreements within this portfolio for the
                selected fiscal year. An active project has active work happening. It might have funding from a previous
                fiscal year or no funding within the fiscal year.
            </p>

            <div className="display-flex flex-justify">
                <ResearchBudgetVsSpending portfolioId={portfolioId} />
                <ProjectsAndAgreements
                    portfolioId={portfolioId}
                    numberOfProjects={numberOfProjects}
                    numOfResearchProjects={filteredResearchProjects.length}
                    numOfAdminAndSupportProjects={filteredAdminAndSupportProjects.length}
                />
            </div>
            <article>
                <h2 className="font-sans-lg">Research Projects</h2>
                <p className="font-sans-sm">
                    This is a list of all active research projects that this portfolio contributes to for the selected
                    fiscal year.
                </p>
                {/* <button className="usa-button" onClick={() => setIsTableSorted(!isTableSorted)}>
                    Sort table
                </button>
                {isTableSorted ? "Table is sorted" : "Table is not sorted"} */}
                <div className="usa-table-container--scrollable" tabIndex="0">
                    <table className="usa-table usa-table--borderless">
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
            </article>

            {/* <article className="margin-top-4">
                <h2 className="font-sans-lg">Administrative & Support Projects</h2>
                <p className="font-sans-sm">
                    This is a list of all active administrative & support projects that this portfolio contributes to
                    for the selected fiscal year.
                </p>
                <div className="usa-table-container--scrollable" tabIndex="0">
                    <table className="usa-table usa-table--borderless">
                        <thead>
                            <tr>
                                <th
                                    data-sortable
                                    scope="col"
                                    role="columnheader"
                                    style={{ paddingRight: 0, width: "32%" }}
                                >
                                    Project Name
                                </th>
                                <th data-sortable scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                                    FY {fiscalYear.value} Funding
                                </th>
                                <th data-sortable scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                                    Funding to Date
                                </th>
                                <th data-sortable scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                                    First Award
                                </th>
                                <th data-sortable scope="col" role="columnheader" style={{ paddingRight: 0 }}>
                                    CANs
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    Agreements
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdminAndSupportProjects.map((tableData) => (
                                <TableRow key={tableData.id} {...tableData} />
                            ))}
                        </tbody>
                    </table>
                    <div className="usa-sr-only usa-table__announcement-region" aria-live="polite"></div>
                </div>
            </article> */}
            {/* NOTE: Not sure what to do with this */}
            {researchProjects.length > 0 && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <p>There are no Research Projects.</p>}
        </section>
    );
};

export default ResearchProjects;

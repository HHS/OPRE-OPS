import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { setResearchProjects } from "../../../pages/portfolios/detail/portfolioSlice";
import { getResearchProjects } from "../../../pages/portfolios/detail/getResearchProjects";
import ResearchBudgetVsSpending from "./ResearchBudgetVsSpending";
import ProjectsAndAgreements from "./ProjectsAndAgreements";
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

    // Comps
    const researchProjectData = researchProjects.map((rp) => (
        <li key={rp.id}>
            <Link to={`/research-projects/${rp.id}`}>{rp.title}</Link>
        </li>
    ));

    const TableRow = ({ name, link, funding, fundingToDate, firstAwardDate, cans, agreement }) => (
        <tr>
            <th scope="row">
                <Link className="text-ink text-no-underline hover:text-underline" to={link}>
                    {name}
                </Link>
            </th>
            <td data-sort-value="">{funding}</td>
            <td data-sort-value="">{fundingToDate}</td>
            <td data-sort-value="">{firstAwardDate}</td>
            <td data-sort-value="">{cans}</td>
            <td data-sort-value="">{agreement}</td>
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
            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
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
                <div className="usa-table-container--scrollable" tabIndex="0">
                    <table className="usa-table usa-table--borderless">
                        <thead>
                            <tr>
                                <th data-sortable scope="col" role="columnheader">
                                    Project Name
                                    <button
                                        tabIndex="0"
                                        className="usa-table__header__button"
                                        title="Click to sort by Alphabetical in ascending order."
                                    >
                                        <svg
                                            className="usa-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                        >
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
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    FY {fiscalYear.value} Funding
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    Funding to Date
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    First Award
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    CANs
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    Agreements
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResearchProjects.map((tableData) => (
                                <TableRow key={tableData.id} {...tableData} />
                            ))}
                        </tbody>
                    </table>
                    <div className="usa-sr-only usa-table__announcement-region" aria-live="polite"></div>
                </div>
            </article>

            <article className="margin-top-4">
                <h2 className="font-sans-lg">Administrative & Support Projects</h2>
                <p className="font-sans-sm">
                    This is a list of all active administrative & support projects that this portfolio contributes to
                    for the selected fiscal year.
                </p>
                <div className="usa-table-container--scrollable" tabIndex="0">
                    <table className="usa-table usa-table--borderless">
                        <thead>
                            <tr>
                                <th data-sortable scope="col" role="columnheader">
                                    Project Name
                                    <button
                                        tabIndex="0"
                                        className="usa-table__header__button"
                                        title="Click to sort by Alphabetical in ascending order."
                                    >
                                        <svg
                                            className="usa-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                        >
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
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    FY {fiscalYear.value} Funding
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    Funding to Date
                                </th>
                                <th data-sortable scope="col" role="columnheader">
                                    First Award
                                </th>
                                <th data-sortable scope="col" role="columnheader">
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
            </article>
            {/* NOTE: Not sure what to do with this */}
            {researchProjects.length > 0 && <ul>{researchProjectData}</ul>}
            {!researchProjectData && <p>There are no Research Projects.</p>}
        </section>
    );
};

export default ResearchProjects;

import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { ITEMS_PER_PAGE, NO_DATA } from "../../../constants";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { getCurrentFiscalYear, convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectDate, PROJECT_SORT_CODES } from "./ProjectsList.helpers";

/**
 * Reusable sortable header cell for the projects list table.
 * @param {Object} props - Component props.
 * @param {string} props.label - Column label.
 * @param {string} props.sortCode - Sort code tied to the column.
 * @param {string | null} props.selectedHeader - Currently selected sort code.
 * @param {boolean} props.sortDescending - Whether the selected sort is descending.
 * @param {(sortCode: string, isDescending: boolean) => void} props.onClickHeader - Sort toggle handler.
 * @returns {React.ReactElement}
 */
const SortableHeader = ({ label, sortCode, selectedHeader, sortDescending, onClickHeader }) => {
    const isSelected = selectedHeader === sortCode;

    return (
        <th
            scope="col"
            style={{ whiteSpace: "nowrap" }}
            aria-sort={isSelected ? (sortDescending ? "descending" : "ascending") : "none"}
        >
            <button
                className="usa-table__header__button cursor-pointer"
                title={`Click to sort by ${label} in ascending or descending order`}
                onClick={() => {
                    onClickHeader?.(sortCode, sortDescending == null ? true : !sortDescending);
                }}
            >
                {label}
                {isSelected && (
                    <FontAwesomeIcon
                        icon={sortDescending ? faArrowDown : faArrowUp}
                        className="height-2 width-2 cursor-pointer"
                    />
                )}
            </button>
        </th>
    );
};

/**
 * Projects list table with server-side sorted columns.
 * @param {Object} props - Component props.
 * @param {import("../../../types/ProjectTypes").Project[]} props.projects - Project rows.
 * @param {string | null} props.sortConditions - Active sort code.
 * @param {boolean} props.sortDescending - Whether the sort is descending.
 * @param {(sortCode: string, isDescending: boolean) => void} props.setSortConditions - Sort setter.
 * @param {string} props.selectedFiscalYear - The currently selected fiscal year.
 * @returns {React.ReactElement}
 */
const ProjectsTable = ({ projects, sortConditions, sortDescending, setSortConditions, selectedFiscalYear }) => {
    const fyLabel =
        selectedFiscalYear === "All"
            ? "FY Total"
            : `FY${String(selectedFiscalYear).slice(-2)} Total`;

    return (
        <table className="usa-table usa-table--borderless width-full">
            <thead>
                <tr>
                    <SortableHeader
                        label="Project"
                        sortCode={PROJECT_SORT_CODES.TITLE}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="Type"
                        sortCode={PROJECT_SORT_CODES.PROJECT_TYPE}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="Start"
                        sortCode={PROJECT_SORT_CODES.PROJECT_START}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="End"
                        sortCode={PROJECT_SORT_CODES.PROJECT_END}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label={fyLabel}
                        sortCode={PROJECT_SORT_CODES.FY_TOTAL}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="Project Total"
                        sortCode={PROJECT_SORT_CODES.PROJECT_TOTAL}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                </tr>
            </thead>
            <tbody>
                {projects.map((project) => {
                    const fyTotalRaw =
                        selectedFiscalYear !== "All" && project.fiscal_year_totals
                            ? project.fiscal_year_totals[Number(selectedFiscalYear)] ?? null
                            : null;
                    const fyTotal = fyTotalRaw !== null ? Number(fyTotalRaw) : null;
                    const projectTotal =
                        project.project_total !== null && project.project_total !== undefined
                            ? Number(project.project_total)
                            : null;

                    return (
                        <tr key={project.id}>
                            <td>
                                <Link to={`/projects/${project.id}`}>{project.title}</Link>
                            </td>
                            <td>{convertCodeForDisplay("project", project.project_type)}</td>
                            <td>{formatProjectDate(project.start_date)}</td>
                            <td>{formatProjectDate(project.end_date)}</td>
                            <td>
                                {fyTotal !== null ? (
                                    <CurrencyFormat
                                        value={fyTotal}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$"}
                                        decimalScale={getDecimalScale(fyTotal)}
                                        fixedDecimalScale={true}
                                        renderText={(value) => value}
                                    />
                                ) : (
                                    NO_DATA
                                )}
                            </td>
                            <td>
                                {projectTotal !== null && projectTotal > 0 ? (
                                    <CurrencyFormat
                                        value={projectTotal}
                                        displayType={"text"}
                                        thousandSeparator={true}
                                        prefix={"$"}
                                        decimalScale={getDecimalScale(projectTotal)}
                                        fixedDecimalScale={true}
                                        renderText={(value) => value}
                                    />
                                ) : (
                                    NO_DATA
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

/**
 * Page component for the projects list with server-side pagination, sorting, and fiscal year filtering.
 * @returns {React.ReactElement | null}
 */
const ProjectsList = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize] = React.useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(
        PROJECT_SORT_CODES.TITLE,
        false
    );

    const {
        data: projectsResponse,
        isLoading,
        isError
    } = useGetProjectsQuery({
        sortConditions: sortCondition,
        sortDescending,
        page: currentPage - 1,
        limit: pageSize,
        fiscalYear: selectedFiscalYear
    });

    const projects = projectsResponse?.projects ?? [];
    const totalCount = projectsResponse?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Reset to page 1 when sort or fiscal year changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [sortCondition, sortDescending, selectedFiscalYear]);

    React.useEffect(() => {
        if (isError) {
            navigate("/error");
        }
    }, [isError, navigate]);

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (isError) {
        return null;
    }

    const handleChangeFiscalYear = (newValue) => {
        setSelectedFiscalYear(newValue);
    };

    return (
        <App breadCrumbName="Projects">
            <TablePageLayout
                title="Projects"
                subtitle="All Projects"
                details="This is a list of all projects across OPRE."
                TabsSection={<></>}
                FYSelect={
                    <FiscalYear
                        fiscalYear={selectedFiscalYear}
                        handleChangeFiscalYear={handleChangeFiscalYear}
                        showAllOption={true}
                    />
                }
                TableSection={
                    <>
                        <ProjectsTable
                            projects={projects}
                            sortConditions={sortCondition}
                            sortDescending={sortDescending}
                            setSortConditions={setSortConditions}
                            selectedFiscalYear={selectedFiscalYear}
                        />
                        {totalPages > 1 && (
                            <div className="margin-top-3">
                                <PaginationNav
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalPages={totalPages}
                                />
                            </div>
                        )}
                    </>
                }
            >
                <DebugCode data={projectsResponse} />
            </TablePageLayout>
        </App>
    );
};

export default ProjectsList;

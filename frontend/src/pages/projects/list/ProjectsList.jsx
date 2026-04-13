import React from "react";
import { useNavigate } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import { useGetProjectsQuery, useLazyGetProjectsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import ProjectsTable from "../../../components/Projects/ProjectsTable";
import ProjectsTableLoading from "../../../components/Projects/ProjectsTable/ProjectsTableLoading";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { ITEMS_PER_PAGE } from "../../../constants";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import icons from "../../../uswds/img/sprite.svg";
import { handleProjectsExport, PROJECT_SORT_CODES } from "./ProjectsList.helpers";

/**
 * Page component for the projects list with server-side pagination, sorting, and fiscal year filtering.
 * @returns {React.ReactElement | null}
 */
const ProjectsList = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize] = React.useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const [isExporting, setIsExporting] = React.useState(false);
    const { setAlert } = useAlert();
    const [getAllProjectsTrigger] = useLazyGetProjectsQuery();
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(PROJECT_SORT_CODES.TITLE, false);

    const {
        data: projectsResponse,
        isLoading,
        isFetching,
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
    const isTableLoading = isLoading || isFetching;

    // Reset to page 1 when sort or fiscal year changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [sortCondition, sortDescending, selectedFiscalYear]);

    React.useEffect(() => {
        if (isError) {
            navigate("/error");
        }
    }, [isError, navigate]);

    const handleChangeFiscalYear = (newValue) => {
        setSelectedFiscalYear(newValue);
    };

    if (isExporting) {
        return (
            <div className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
                <h1 className="margin-bottom-2">Exporting...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
    }

    if (isTableLoading) {
        return (
            <App breadCrumbName="Projects">
                <TablePageLayout
                    title="Projects"
                    subtitle="All Projects"
                    details="This is a list of all projects across OPRE for the selected fiscal year. Draft budget lines are not included in the Totals."
                    TabsSection={
                        <div className="margin-left-auto">
                            <FiscalYear
                                fiscalYear={selectedFiscalYear}
                                handleChangeFiscalYear={handleChangeFiscalYear}
                                showAllOption={true}
                            />
                        </div>
                    }
                    TableSection={<ProjectsTableLoading />}
                />
            </App>
        );
    }

    if (isError) {
        return null;
    }

    return (
        <App breadCrumbName="Projects">
            <TablePageLayout
                title="Projects"
                subtitle="All Projects"
                details="This is a list of all projects across OPRE for the selected fiscal year. Draft budget lines are not included in the Totals."
                FilterButton={
                    <div>
                        {totalCount > 0 && (
                            <button
                                type="button"
                                style={{ fontSize: "16px" }}
                                className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                                data-cy="projects-export"
                                onClick={() =>
                                    handleProjectsExport(
                                        exportTableToXlsx,
                                        setIsExporting,
                                        setAlert,
                                        getAllProjectsTrigger,
                                        selectedFiscalYear,
                                        sortCondition,
                                        sortDescending,
                                        totalCount
                                    )
                                }
                            >
                                <svg
                                    className="height-2 width-2 margin-right-05"
                                    style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                >
                                    <use href={`${icons}#save_alt`}></use>
                                </svg>
                                <span>Export</span>
                            </button>
                        )}
                    </div>
                }
                TabsSection={
                    <div className="margin-left-auto">
                        <FiscalYear
                            fiscalYear={selectedFiscalYear}
                            handleChangeFiscalYear={handleChangeFiscalYear}
                            showAllOption={true}
                        />
                    </div>
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

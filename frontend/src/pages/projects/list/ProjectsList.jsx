import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import ProjectsTable from "../../../components/Projects/ProjectsTable";
import ProjectsTableLoading from "../../../components/Projects/ProjectsTable/ProjectsTableLoading";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { ITEMS_PER_PAGE } from "../../../constants";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import { PROJECT_SORT_CODES } from "./ProjectsList.helpers";

/**
 * Page component for the projects list with server-side pagination, sorting, and fiscal year filtering.
 * @returns {React.ReactElement | null}
 */
const ProjectsList = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize] = React.useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
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

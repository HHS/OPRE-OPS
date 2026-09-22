import React from "react";
import { useNavigate } from "react-router-dom";
import { PacmanLoader } from "react-spinners";
import { useGetProjectsQuery, useLazyGetProjectsQuery, useGetProjectsFilterOptionsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import ProjectSummaryCardsSection from "../../../components/Projects/ProjectSummaryCardsSection";
import ProjectsTable from "../../../components/Projects/ProjectsTable";
import ProjectsTableLoading from "../../../components/Projects/ProjectsTable/ProjectsTableLoading";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import PaginationNav from "../../../components/UI/PaginationNav/PaginationNav";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import constants, { ITEMS_PER_PAGE } from "../../../constants";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { deriveDropdownValue, mergeFiscalYearOptions, resolveForAPI } from "../../../helpers/fiscalYearFilter.helpers";
import useAlert from "../../../hooks/use-alert.hooks";
import icons from "../../../uswds/img/sprite.svg";
import { handleProjectsExport, PROJECT_SORT_CODES } from "./ProjectsList.helpers";
import ProjectFilterButton from "./ProjectFilterButton/ProjectFilterButton";
import ProjectFilterTags from "./ProjectFilterTags/ProjectFilterTags";

/**
 * Page component for the projects list with server-side pagination, sorting, and fiscal year filtering.
 * @returns {React.ReactElement | null}
 */
const ProjectsList = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize] = React.useState(ITEMS_PER_PAGE);
    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState("All");
    const [isExporting, setIsExporting] = React.useState(false);
    const { setAlert } = useAlert();
    const [getAllProjectsTrigger] = useLazyGetProjectsQuery();
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(PROJECT_SORT_CODES.TITLE, false);
    const [filters, setFilters] = React.useState({
        fiscalYear: [],
        portfolio: [],
        projectSearch: [],
        agreementSearch: [],
        projectType: []
    });

    const { data: projectFilterOptions, isLoading: isLoadingProjectFilterOptions } = useGetProjectsFilterOptionsQuery();

    // Derive the dropdown display value and the API-ready FY array from the two FY inputs:
    // selectedFiscalYear (shortcut dropdown) and filters.fiscalYear (Compare Fiscal Years panel).
    // Compare FYs takes precedence when non-empty; otherwise the dropdown FY is used.
    const dropdownValue = deriveDropdownValue(selectedFiscalYear, filters.fiscalYear);

    // A single Compare FY can fall outside the default rolling window (constants.fiscalYears),
    // e.g. an older year that still has projects. Include every year the API knows about so
    // the <select>'s value always matches a rendered <option>.
    const fiscalYearOptions = mergeFiscalYearOptions(constants.fiscalYears, projectFilterOptions?.fiscal_years);

    // Child components (ProjectsTable, ProjectsTableLoading, export, summary cards) only
    // understand "All" or a specific year string — they have no "Multi" branch. Under Multi,
    // hide the FY Total column and show "Multiple Years" labels, same as "All".
    const isMultiFY = dropdownValue === "Multi";
    const displayFY = isMultiFY ? "All" : dropdownValue;

    const {
        data: projectsResponse,
        isLoading,
        isFetching,
        isError
    } = useGetProjectsQuery({
        filters: {
            ...filters,
            fiscalYear: resolveForAPI(selectedFiscalYear, filters.fiscalYear)
        },
        sortConditions: sortCondition,
        sortDescending,
        page: currentPage - 1,
        limit: pageSize
    });

    const projects = projectsResponse?.projects ?? [];
    const totalCount = projectsResponse?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const summary = projectsResponse?.summary ?? null;
    const isTableLoading = isLoading || isFetching;

    // Reset to page 1 when sort, filters (including fiscal year), or fiscal year dropdown changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortCondition, sortDescending, selectedFiscalYear]);

    React.useEffect(() => {
        if (isError) {
            navigate("/error");
        }
    }, [isError, navigate]);

    // Track when the dropdown shortcut itself clears filters.fiscalYear so the effect
    // below doesn't revert selectedFiscalYear to "All" when the user changed the dropdown.
    const dropdownChangedFYRef = React.useRef(false);

    // Track when applyFilter caused the emptying so the effect below doesn't revert
    // selectedFiscalYear to "All" — Apply means "fall back to the current dropdown year",
    // not "reset to All". This ref is set by useProjectFilterButton's applyFilter.
    const applyFiredFYRef = React.useRef(false);

    // Track the previous length to distinguish "non-zero → zero" (tag removal) from
    // a no-op write of a new [] reference when the array was already empty.
    const prevFYLengthRef = React.useRef(0);

    // When all FY filter tags are explicitly removed (non-zero → zero, not from dropdown
    // or Apply), revert selectedFiscalYear to "All" per the business rule.
    // Normalize null (emitted by FiscalYearComboBox clear control) to [] before length checks.
    React.useEffect(() => {
        const normalizedFYs = filters.fiscalYear ?? [];
        const prevLen = prevFYLengthRef.current;
        prevFYLengthRef.current = normalizedFYs.length;
        if (dropdownChangedFYRef.current) {
            dropdownChangedFYRef.current = false;
            return;
        }
        if (applyFiredFYRef.current) {
            applyFiredFYRef.current = false;
            return;
        }
        if (normalizedFYs.length === 0 && prevLen > 0) {
            setSelectedFiscalYear("All");
        }
    }, [filters.fiscalYear]);

    // FY_TOTAL is meaningless when showing all/multiple fiscal years — reset the sort
    // to the default whenever that happens. Shared by the displayFY effect below (covers
    // panel sentinel, Multi, and tag removal) and handleChangeFiscalYear (covers the dropdown
    // re-selecting "All" while already on "All", which isn't a displayFY transition).
    const resetFYTotalSort = () => {
        if (sortCondition === PROJECT_SORT_CODES.FY_TOTAL) {
            // useSetSortConditions hardcodes sortDescending=true on a column change, ignoring
            // the second arg. Call twice: first to switch column, then same column to set ascending.
            setSortConditions(PROJECT_SORT_CODES.TITLE, false);
            setSortConditions(PROJECT_SORT_CODES.TITLE, false);
        }
    };

    // Reset FY_TOTAL sort whenever displayFY enters "All" mode (All FYs or Multi)
    // from any cause — dropdown shortcut, panel sentinel, Multi, or tag removal.
    const prevDisplayFYRef = React.useRef(displayFY);
    React.useEffect(() => {
        const prev = prevDisplayFYRef.current;
        prevDisplayFYRef.current = displayFY;
        if (displayFY === "All" && prev !== "All") {
            resetFYTotalSort();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayFY]);

    // Handle fiscal year shortcut dropdown change.
    // Clears only the Compare FYs override so portfolio/type/etc. filters are preserved.
    const handleChangeFiscalYear = (newValue) => {
        dropdownChangedFYRef.current = true;
        setFilters((prev) => ({ ...prev, fiscalYear: [] }));
        setSelectedFiscalYear(newValue);
        if (newValue === "All") {
            resetFYTotalSort();
        }
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
                                fiscalYear={dropdownValue}
                                handleChangeFiscalYear={handleChangeFiscalYear}
                                fiscalYears={fiscalYearOptions}
                                showAllOption={true}
                            />
                        </div>
                    }
                    TableSection={<ProjectsTableLoading selectedFiscalYear={displayFY} />}
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
                FilterTags={
                    <ProjectFilterTags
                        filters={filters}
                        setFilters={setFilters}
                    />
                }
                FilterButton={
                    <>
                        <div className="display-flex">
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
                                                displayFY,
                                                sortCondition,
                                                sortDescending,
                                                totalCount,
                                                {
                                                    ...filters,
                                                    fiscalYear: resolveForAPI(selectedFiscalYear, filters.fiscalYear)
                                                }
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
                            <div className="margin-left-205">
                                <ProjectFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                    projectFilterOptions={projectFilterOptions}
                                    isLoadingOptions={isLoadingProjectFilterOptions}
                                    applyFiredFYRef={applyFiredFYRef}
                                />
                            </div>
                        </div>
                    </>
                }
                TabsSection={
                    <div className="margin-left-auto">
                        <FiscalYear
                            fiscalYear={dropdownValue}
                            handleChangeFiscalYear={handleChangeFiscalYear}
                            fiscalYears={fiscalYearOptions}
                            showAllOption={true}
                        />
                    </div>
                }
                SummaryCardsSection={
                    totalCount > 0 &&
                    summary && (
                        <ProjectSummaryCardsSection
                            fiscalYear={isMultiFY ? "Multi" : displayFY === "All" ? "All FYs" : `FY ${displayFY}`}
                            summary={summary}
                        />
                    )
                }
                TableSection={
                    <>
                        <ProjectsTable
                            projects={projects}
                            sortConditions={sortCondition}
                            sortDescending={sortDescending}
                            setSortConditions={setSortConditions}
                            selectedFiscalYear={displayFY}
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
            ></TablePageLayout>
        </App>
    );
};

export default ProjectsList;

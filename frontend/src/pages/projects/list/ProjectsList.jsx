import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { useSetSortConditions } from "../../../components/UI/Table/Table.hooks";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectStartDate, PROJECT_SORT_CODES, sortProjects } from "./ProjectsList.helpers";

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
 * Barebones projects list table.
 * @param {Object} props - Component props.
 * @param {import("../../../types/ProjectTypes").Project[]} props.projects - Project rows.
 * @param {string | null} props.sortConditions - Active sort code.
 * @param {boolean} props.sortDescending - Whether the sort is descending.
 * @param {(sortCode: string, isDescending: boolean) => void} props.setSortConditions - Sort setter.
 * @returns {React.ReactElement}
 */
const ProjectsTable = ({ projects, sortConditions, sortDescending, setSortConditions }) => {
    const sortedProjects = sortProjects(projects, sortConditions, sortDescending);

    return (
        <table className="usa-table usa-table--borderless width-full">
            <thead>
                <tr>
                    <SortableHeader
                        label="Project"
                        sortCode={PROJECT_SORT_CODES.PROJECT}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="Type"
                        sortCode={PROJECT_SORT_CODES.TYPE}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <SortableHeader
                        label="Start"
                        sortCode={PROJECT_SORT_CODES.START}
                        selectedHeader={sortConditions}
                        sortDescending={sortDescending}
                        onClickHeader={setSortConditions}
                    />
                    <th scope="col">End</th>
                    <th scope="col">FY Total</th>
                    <th scope="col">Project Total</th>
                </tr>
            </thead>
            <tbody>
                {sortedProjects.map((project) => (
                    <tr key={project.id}>
                        <td>
                            <Link to={`/projects/${project.id}`}>{project.title}</Link>
                        </td>
                        <td>{convertCodeForDisplay("project", project.project_type)}</td>
                        <td>{formatProjectStartDate(project.origination_date)}</td>
                        <td>TBD</td>
                        <td>TBD</td>
                        <td>TBD</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

/**
 * Page component for the barebones projects list.
 * @returns {React.ReactElement | null}
 */
const ProjectsList = () => {
    const navigate = useNavigate();
    const { data: projects = [], isLoading, isError } = useGetProjectsQuery({});
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions(
        PROJECT_SORT_CODES.PROJECT,
        false
    );

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

    return (
        <App breadCrumbName="Projects">
            <TablePageLayout
                title="Projects"
                subtitle="All Projects"
                details="This is a list of all projects across OPRE. The current response is intentionally lightweight while the list experience is being built out."
                TabsSection={<></>}
                TableSection={
                    <ProjectsTable
                        projects={projects}
                        sortConditions={sortCondition}
                        sortDescending={sortDescending}
                        setSortConditions={setSortConditions}
                    />
                }
            >
                <DebugCode data={projects} />
            </TablePageLayout>
        </App>
    );
};

export default ProjectsList;

import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PROJECT_SORT_CODES } from "../../../pages/projects/list/ProjectsList.helpers";
import ProjectTableRow from "./ProjectTableRow";

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
    const fyLabel = selectedFiscalYear === "All" ? "FY Total" : `FY${String(selectedFiscalYear).slice(-2)} Total`;

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
                    <th scope="col">
                        <span className="usa-sr-only">Expand row</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {projects.map((project) => (
                    <ProjectTableRow
                        key={project.id}
                        project={project}
                        selectedFiscalYear={selectedFiscalYear}
                    />
                ))}
            </tbody>
        </table>
    );
};

export default ProjectsTable;

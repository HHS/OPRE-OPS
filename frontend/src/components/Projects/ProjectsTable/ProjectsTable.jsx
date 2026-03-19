import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import { NO_DATA } from "../../../constants";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectDate, PROJECT_SORT_CODES } from "../../../pages/projects/list/ProjectsList.helpers";

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
                </tr>
            </thead>
            <tbody>
                {projects.map((project) => {
                    const fyTotalRaw =
                        selectedFiscalYear !== "All" && project.fiscal_year_totals
                            ? (project.fiscal_year_totals[Number(selectedFiscalYear)] ?? null)
                            : null;
                    const fyTotal = fyTotalRaw !== null ? Number(fyTotalRaw) : null;
                    const projectTotal =
                        project.project_total !== null && project.project_total !== undefined
                            ? Number(project.project_total)
                            : null;

                    return (
                        <tr key={project.id}>
                            <td>
                                <Link
                                    className="text-ink text-no-underline"
                                    to={`/projects/${project.id}`}
                                >
                                    {project.title}
                                </Link>
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

export default ProjectsTable;

import CurrencyFormat from "react-currency-format";
import { Link } from "react-router-dom";
import TableRowExpandable from "../../UI/TableRowExpandable/TableRowExpandable";
import { useTableRow } from "../../UI/TableRowExpandable/TableRowExpandable.hooks";
import {
    changeBgColorIfExpanded,
    expandedRowBGColor,
    removeBorderBottomIfExpanded
} from "../../UI/TableRowExpandable/TableRowExpandable.helpers";
import { NO_DATA } from "../../../constants";
import { getDecimalScale } from "../../../helpers/currencyFormat.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatProjectDate } from "../../../pages/projects/list/ProjectsList.helpers";

/** Number of visible data columns — used for colSpan on the expanded row. */
const COL_COUNT = 6;

/** Max characters for agreement name before truncation. */
const MAX_AGREEMENT_NAME_LENGTH = 25;

/**
 * Truncates an agreement name to at most `MAX_AGREEMENT_NAME_LENGTH` characters,
 * appending "..." when truncated.
 * @param {string} name
 * @returns {string}
 */
const truncateAgreementName = (name) => {
    if (!name) return "";
    return name.length > MAX_AGREEMENT_NAME_LENGTH ? `${name.slice(0, MAX_AGREEMENT_NAME_LENGTH)}...` : name;
};

/**
 * A single expandable row in the projects list table.
 * @param {Object} props
 * @param {import("../../../types/ProjectTypes").Project} props.project
 * @param {string} props.selectedFiscalYear
 * @returns {React.ReactElement}
 */
const ProjectTableRow = ({ project, selectedFiscalYear }) => {
    const { isExpanded, setIsExpanded, isRowActive, setIsRowActive } = useTableRow();

    const fyTotalRaw =
        selectedFiscalYear !== "All" && project.fiscal_year_totals
            ? (project.fiscal_year_totals[Number(selectedFiscalYear)] ?? null)
            : null;
    const fyTotal = fyTotalRaw !== null ? Number(fyTotalRaw) : null;
    const projectTotal =
        project.project_total !== null && project.project_total !== undefined
            ? Number(project.project_total)
            : null;

    const borderExpandedStyles = removeBorderBottomIfExpanded(isExpanded);
    const bgExpandedStyles = changeBgColorIfExpanded(isExpanded);

    const agreementList = project.agreement_name_list ?? [];

    const tableRowData = (
        <>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                <Link
                    className="text-ink text-no-underline"
                    to={`/projects/${project.id}`}
                >
                    {project.title}
                </Link>
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {convertCodeForDisplay("project", project.project_type)}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {formatProjectDate(project.start_date)}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
                {formatProjectDate(project.end_date)}
            </td>
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
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
            <td
                className={borderExpandedStyles}
                style={bgExpandedStyles}
            >
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
        </>
    );

    const expandedData = (
        <td
            colSpan={COL_COUNT + 1}
            className="border-top-none"
            style={expandedRowBGColor}
        >
            <div className="display-flex padding-y-2 padding-x-1">
                <div className="minw-10 margin-right-6">
                    <p className="text-base-dark font-sans-3xs margin-0 margin-bottom-05">Total Agreements</p>
                    <p
                        className="font-sans-3xs margin-0"
                        style={{ fontWeight: 600 }}
                        data-testid="agreement-count"
                    >
                        {agreementList.length}
                    </p>
                </div>
                <div>
                    <p className="text-base-dark font-sans-3xs margin-0 margin-bottom-1">Agreements</p>
                    <div className="display-flex flex-wrap gap-2">
                        {agreementList.length > 0 ? (
                            agreementList.map((agreement) => (
                                <Link
                                    key={agreement.id}
                                    to={`/agreements/${agreement.id}`}
                                    className="bg-primary-lighter text-ink text-no-underline font-sans-3xs padding-x-1 padding-y-05 radius-md margin-right-1 margin-bottom-1"
                                    title={agreement.name}
                                    data-testid="agreement-tag"
                                >
                                    {truncateAgreementName(agreement.name)}
                                </Link>
                            ))
                        ) : (
                            <span className="text-base-dark font-sans-3xs">{NO_DATA}</span>
                        )}
                    </div>
                </div>
            </div>
        </td>
    );

    return (
        <TableRowExpandable
            tableRowData={tableRowData}
            expandedData={expandedData}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            isRowActive={isRowActive}
            setIsRowActive={setIsRowActive}
            data-testid={`project-table-row-${project.id}`}
        />
    );
};

export default ProjectTableRow;

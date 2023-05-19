import { func, bool } from "prop-types";
import { useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock, faClone } from "@fortawesome/free-regular-svg-icons";
import Tag from "../../components/UI/Tag/Tag";
import { editBudgetLineAdded, duplicateBudgetLineAdded } from "./createBudgetLineSlice";
import { TotalSummaryCard } from "./TotalSummaryCard";
import { formatDate, loggedInName } from "../../helpers/utils";
import "./PreviewTable.scss";

export const PreviewTable = ({ handleDeleteBudgetLine = () => {}, readOnly = false, budgetLines = null }) => {
    const dispatch = useDispatch();
    const stateBudgetLinesAdded = useSelector((state) => state.createBudgetLine.budget_lines_added);
    const budgetLinesAdded = budgetLines ? budgetLines : stateBudgetLinesAdded;
    const sortedBudgetLines = budgetLinesAdded
        .slice()
        .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
        .reverse();

    let loggedInUser = useSelector((state) => loggedInName(state.auth?.activeUser));

    const TableRow = ({ bl }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [isRowActive, setIsRowActive] = useState(false);

        const formatted_today = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const bl_created_on = bl?.created_on
            ? new Date(bl.created_on).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : formatted_today;
        let formatted_date_needed;
        let fiscalYear;
        if (bl?.date_needed !== "--" && bl?.date_needed !== null) {
            let date_needed = new Date(bl?.date_needed);
            formatted_date_needed = formatDate(date_needed);
            // FY will automate based on the Need by Date. Anything after September 30th rolls over into the next FY.
            let month = date_needed.getMonth();
            let year = date_needed.getFullYear();
            fiscalYear = month > 8 ? year + 1 : year;
        }
        let feeTotal = bl?.amount * bl?.psc_fee_amount;
        let total = bl?.amount + feeTotal;
        let status = bl?.status.charAt(0).toUpperCase() + bl?.status.slice(1).toLowerCase();

        const handleExpandRow = () => {
            setIsExpanded(!isExpanded);
            setIsRowActive(true);
        };

        const TableTag = ({ status }) => {
            if (status === "In_execution") {
                status = "Executing";
            }
            if (status === "Under_review") {
                status = "In Review";
            }
            let classNames = "padding-x-105 padding-y-1 ";
            switch (status) {
                case "Draft":
                    classNames += "bg-brand-neutral-lighter";
                    break;
                case "In Review":
                    classNames += "bg-brand-data-viz-secondary-23 text-white";
                    break;
                case "Executing":
                    classNames += "bg-brand-data-viz-primary-8";
                    break;
                case "Obligated":
                    classNames += "bg-brand-data-viz-primary-6 text-white";
                    break;
                case "Planned":
                    classNames += "bg-brand-data-viz-primary-11 text-white";
                    break;
                default:
            }
            return <Tag className={classNames} text={status} />;
        };

        const ChangeIcons = ({ budgetLine }) => {
            const handleDuplicateBudgetLine = (budgetLine) => {
                dispatch(duplicateBudgetLineAdded({ ...budgetLine, created_by: loggedInUser }));
            };
            return (
                <>
                    {budgetLine.status === "DRAFT" && (
                        <>
                            <FontAwesomeIcon
                                id={`edit-${bl?.id}`}
                                icon={faPen}
                                className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                                title="edit"
                                data-position="top"
                                onClick={() => dispatch(editBudgetLineAdded(budgetLine))}
                            />
                            <FontAwesomeIcon
                                id={`delete-${bl?.id}`}
                                icon={faTrash}
                                title="delete"
                                data-position="top"
                                className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                                onClick={() => handleDeleteBudgetLine(budgetLine.id)}
                            />
                        </>
                    )}
                    <FontAwesomeIcon
                        id={`duplicate-${bl?.id}`}
                        icon={faClone}
                        title="duplicate"
                        data-position="top"
                        className={`text-primary height-2 width-2 hover: cursor-pointer usa-tooltip ${
                            budgetLine.status !== "DRAFT" ? "margin-left-6" : ""
                        }`}
                        onClick={() => handleDuplicateBudgetLine(budgetLine)}
                    />
                </>
            );
        };
        return (
            <Fragment key={bl?.id}>
                <tr onMouseEnter={() => setIsRowActive(true)} onMouseLeave={() => !isExpanded && setIsRowActive(false)}>
                    <th
                        scope="row"
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {bl?.line_description}
                    </th>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {formatted_date_needed}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {fiscalYear || ""}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {bl?.can?.number}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        <CurrencyFormat
                            value={bl?.amount || 0}
                            displayType={"text"}
                            thousandSeparator={true}
                            prefix={"$"}
                            decimalScale={2}
                            fixedDecimalScale={true}
                            renderText={(value) => value}
                        />
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {feeTotal === 0 ? (
                            0
                        ) : (
                            <CurrencyFormat
                                value={feeTotal}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale={true}
                                renderText={(value) => value}
                            />
                        )}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {total === 0 ? (
                            0
                        ) : (
                            <CurrencyFormat
                                value={total}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale={true}
                                renderText={(value) => value}
                            />
                        )}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        {isRowActive && !isExpanded && !readOnly ? (
                            <div>
                                <ChangeIcons budgetLine={bl} />
                            </div>
                        ) : (
                            <TableTag status={status} />
                        )}
                    </td>
                    <td
                        className={isExpanded ? "border-bottom-none" : undefined}
                        style={{ backgroundColor: isRowActive ? "#F0F0F0" : undefined }}
                    >
                        <FontAwesomeIcon
                            id={`expand-${bl?.id}`}
                            icon={isExpanded ? faChevronUp : faChevronDown}
                            className="height-2 width-2 padding-right-1 hover: cursor-pointer"
                            onClick={() => handleExpandRow()}
                        />
                    </td>
                </tr>

                {isExpanded && (
                    <tr>
                        <td colSpan="9" className="border-top-none" style={{ backgroundColor: "#F0F0F0" }}>
                            <div className="display-flex padding-right-9">
                                <dl className="font-12px">
                                    <dt className="margin-0 text-base-dark">Created By</dt>
                                    <dd id={`created-by-name-${bl?.id}`} className="margin-0">
                                        {bl?.created_by ? bl.created_by : loggedInUser}
                                    </dd>
                                    <dt className="margin-0 text-base-dark display-flex flex-align-center margin-top-2">
                                        <FontAwesomeIcon icon={faClock} className="height-2 width-2 margin-right-1" />
                                        {bl_created_on}
                                    </dt>
                                </dl>
                                <dl className="font-12px" style={{ marginLeft: "9.0625rem" }}>
                                    <dt className="margin-0 text-base-dark">Notes</dt>
                                    <dd className="margin-0" style={{ maxWidth: "400px" }}>
                                        {bl?.comments ? bl.comments : "No notes added."}
                                    </dd>
                                </dl>
                                <div className="flex-align-self-end margin-left-auto margin-bottom-1">
                                    {!readOnly && <ChangeIcons budgetLine={bl} />}
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    };

    return (
        <>
            <table className="usa-table usa-table--borderless width-full">
                <thead>
                    <tr>
                        <th scope="col">Description</th>
                        <th scope="col">Need By</th>
                        <th scope="col">FY</th>
                        <th scope="col">CAN</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Fee</th>
                        <th scope="col">Total</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedBudgetLines.map((bl) => (
                        <TableRow key={bl?.id} bl={bl} />
                    ))}
                </tbody>
            </table>
            <TotalSummaryCard budgetLines={sortedBudgetLines}></TotalSummaryCard>
        </>
    );
};

export default PreviewTable;

PreviewTable.propTypes = {
    handleDeleteBudgetLine: func.isRequired,
    readOnly: bool,
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import _ from "lodash";
import Table from "../../UI/Table";
import AllBLIRow from "./AllBLIRow";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import { All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE } from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import { setAlert } from "../../UI/Alert/alertSlice";
import { useLazyGetServicesComponentByIdQuery } from "../../../api/opsAPI";
import { formatDateNeeded, totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import { exportTableToCsv } from "../../../helpers/tableExport.helpers";
import { useSelector } from "react-redux";
import { USER_ROLES } from "../../Users/User.constants";
import DebugCode from "../../DebugCode";

/**
 * @typedef {Object} BudgetLine
 * @property {number} id
 * @property {string} line_description
 * @property {string} agreement_name
 * @property {string} [date_needed]
 * @property {number} [fiscal_year]
 * @property {string} [can_number]
 * @property {number} [amount]
 * @property {string} status
 * @property {number} [services_component_id]
 */

/**
 * TableRow component that represents a single row in the budget lines table.
 * @component
 * @param {Object} props - The props for the TableRow component.
 * @param {BudgetLine[]} props.budgetLines - The budget line data for the row.
 * @returns {JSX.Element} The TableRow component.
 */

const AllBudgetLinesTable = ({ budgetLines }) => {
    const [trigger] = useLazyGetServicesComponentByIdQuery();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    let budgetLinesPage = _.cloneDeep(budgetLines);
    budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);
    const { showModal, setShowModal, modalProps, handleDeleteBudgetLine } = useAllBudgetLinesTable(budgetLines);
    const loggedInUserRoles = useSelector((state) => state.auth.activeUser.roles);
    const isSystemAdmin = loggedInUserRoles.includes(USER_ROLES.SYSTEM_OWNER);

    const handleExport = async () => {
        try {
            // Get the service component name for each budget line individually
            const serviceComponentPromises = budgetLines
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => trigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string, budget_line_total_plus_fees: number}>} */
            const budgetLinesDataMap = {};
            budgetLines.forEach((budgetLine) => {
                const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
                const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount, feeTotal);

                const response = serviceComponentResponses.find(
                    (resp) => resp && resp.id === budgetLine?.services_component_id
                );

                budgetLinesDataMap[budgetLine.id] = {
                    service_component_name: response?.display_name || "TBD", // Use optional chaining and fallback
                    budget_line_total_plus_fees: budgetLineTotalPlusFees
                };
            });

            const currentTimeStamp = new Date().toISOString();

            await exportTableToCsv({
                data: budgetLines,
                headers: All_BUDGET_LINES_TABLE_HEADINGS,
                rowMapper: (/** @type {BudgetLine} */ budgetLine) => [
                    budgetLine.id,
                    budgetLine.agreement_name,
                    budgetLinesDataMap[budgetLine.id]?.service_component_name,
                    formatDateNeeded(budgetLine?.date_needed),
                    budgetLine.fiscal_year,
                    budgetLine.can_number,
                    budgetLinesDataMap[budgetLine.id]?.budget_line_total_plus_fees.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    }) ?? "",
                    budgetLine?.in_review ? "In Review" : budgetLine?.status
                ],
                filename: `budget_lines_${currentTimeStamp}.tsv`
            });
        } catch (error) {
            console.error("Failed to export data:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while exporting the data.",
                redirectUrl: "/error"
            });
        }
    };

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLinesPage.map((budgetLine) => (
                    <AllBLIRow
                        key={budgetLine?.id}
                        budgetLine={budgetLine}
                        handleDeleteBudgetLine={handleDeleteBudgetLine}
                        handleSetBudgetLineForEditing={() => {
                            navigate(
                                `/agreements/${budgetLine.agreement_id}/budget-lines?mode=edit&budget-line-id=${budgetLine.id}#budget-lines-header`
                            );
                        }}
                        isReviewMode={false}
                        readOnly={false}
                    />
                ))}
            </Table>
            {budgetLines.length > 0 && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLines}
                />
            )}
            {budgetLines.length === 0 && (
                <div
                    id="budget-line-items-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
            {isSystemAdmin && (
                <button
                    className="usa-button"
                    data-cy="budget-line-export"
                    onClick={handleExport}
                >
                    Export
                </button>
            )}
        </>
    );
};

export default AllBudgetLinesTable;

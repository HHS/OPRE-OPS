import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import _ from "lodash";
import Table from "../Table";
import AllBLIRow from "../AllBLIRow";
import { All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE } from "../../../constants";
import PaginationNav from "../PaginationNav/PaginationNav";
import { useDeleteBudgetLineItemMutation } from "../../../api/opsAPI";
import ConfirmationModal from "../Modals/ConfirmationModal";
import { setAlert } from "../Alert/alertSlice";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @param {Object} props - The props for the TableRow component.
 * @param {Object[]} props.budgetLines - The budget line data for the row.
 * @returns {React.JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({
        heading: "",
        actionButtonText: "",
        handleConfirm: () => {},
    });
    let budgetLinesPage = _.cloneDeep(budgetLines);
    budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);
    const globalDispatch = useDispatch();
    const [deleteBudgetLineItem] = useDeleteBudgetLineItemMutation();

    const handleDeleteBudgetLine = (budgetLineId) => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to delete this budget line?",
            actionButtonText: "Delete",
            handleConfirm: () => {
                deleteBudgetLineItem(budgetLineId)
                    .unwrap()
                    .then((fulfilled) => {
                        console.log(`DELETE budget line success: ${JSON.stringify(fulfilled, null, 2)}`);
                        globalDispatch(
                            setAlert({
                                type: "success",
                                heading: "Agreement deleted",
                                message: `Agreement has been successfully deleted.`,
                            })
                        );
                    })
                    .catch((rejected) => {
                        console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                        globalDispatch(
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while deleting the agreement.",
                            })
                        );
                        navigate("/error");
                    });
            },
        });
    };

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLinesPage.map((bl) => (
                    <AllBLIRow
                        key={bl?.id}
                        bl={bl}
                        handleDeleteBudgetLine={handleDeleteBudgetLine}
                        handleSetBudgetLineForEditing={() => {
                            navigate(`/agreements/${bl.agreement_id}/budget-lines?mode=edit&budget-line-id=${bl.id}`);
                        }}
                        isReviewMode={false}
                        readOnly={false}
                    />
                ))}
            </Table>
            {budgetLines.length > 0 && (
                <PaginationNav currentPage={currentPage} setCurrentPage={setCurrentPage} items={budgetLines} />
            )}
            {budgetLines.length === 0 && (
                <div
                    id="budget-line-items-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

AllBudgetLinesTable.propTypes = {
    budgetLines: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            line_description: PropTypes.string.isRequired,
            agreement_name: PropTypes.string.isRequired,
            date_needed: PropTypes.string,
            fiscal_year: PropTypes.number,
            can_number: PropTypes.string,
            amount: PropTypes.number,
            status: PropTypes.string.isRequired,
        })
    ),
};

export default AllBudgetLinesTable;

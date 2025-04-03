import {useState} from "react";
import {useNavigate} from "react-router-dom";
import _ from "lodash";
import Table from "../../UI/Table";
import AllBLIRow from "./AllBLIRow";
import PaginationNav from "../../UI/PaginationNav/PaginationNav";
import {All_BUDGET_LINES_TABLE_HEADINGS, BLIS_PER_PAGE} from "./AllBudgetLinesTable.constants";
import useAllBudgetLinesTable from "./AllBudgetLinesTable.hooks";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import {useGetBudgetLineItemsQuery} from "../../../api/opsAPI.js";
import App from "../../../App.jsx";
import {useBudgetLinesList} from "../../../pages/budgetLines/list/BudgetLinesItems.hooks.js";
import {
    addCanAndAgreementNameToBudgetLines,
    handleFilterByUrl
} from "../../../pages/budgetLines/list/BudgetLineItems.helpers.js";

const AllBudgetLinesTable = ({cans, agreements}) => {
    const navigate = useNavigate();
    const {myBudgetLineItemsUrl, activeUser, filters} = useBudgetLinesList();
    const [currentPage, setCurrentPage] = useState(1);

    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({filters, page: currentPage - 1}); // Adjust for 0-based indexing});

   

    // Always declare hooks at the top level, never conditionally
    const {
        showModal,
        setShowModal,
        modalProps,
        handleDeleteBudgetLine
    } = useAllBudgetLinesTable(budgetLineItems || []);

    if (budgetLineItemsIsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (budgetLineItemsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const totalPages = budgetLineItems[0]._meta.number_of_pages;

    let copyOfBLIs = _.cloneDeep(budgetLineItems);
    const sortedBLIs = handleFilterByUrl(myBudgetLineItemsUrl, copyOfBLIs, agreements, activeUser);

    // adding agreement name and can number to budget lines
    const budgetLinesWithCanAndAgreementName = addCanAndAgreementNameToBudgetLines(sortedBLIs, cans, agreements);

    // Paginate the results client-side using BLIS_PER_PAGE
    // const startIndex = (currentPage % BLIS_PER_PAGE) * BLIS_PER_PAGE;
    // const budgetLinesPage = budgetLinesWithCanAndAgreementName.slice(startIndex, startIndex + BLIS_PER_PAGE);
    const budgetLinesPage = budgetLinesWithCanAndAgreementName;

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
            {budgetLinesWithCanAndAgreementName.length > 0 && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={budgetLinesWithCanAndAgreementName}
                    itemsPerPage={BLIS_PER_PAGE}
                    totalPages={totalPages}
                />
            )}
            {budgetLinesWithCanAndAgreementName.length === 0 && (
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

export default AllBudgetLinesTable;

import PropTypes from "prop-types";
import CurrencyFormat from "react-currency-format";
import TableTag from "../BudgetLinesTable/TableTag";
import { formatDateNeeded } from "../../../helpers/utils";
import Table from "../Table";
import { All_BUDGET_LINES_TABLE_HEADINGS } from "../../../constants";
import { useState } from "react";
import PaginationNav from "../PaginationNav/PaginationNav";
import _ from "lodash";

/**
 * TableRow component that represents a single row in the budget lines table.
 * @param {Object} props - The props for the TableRow component.
 * @param {Object[]} props.budgetLines - The budget line data for the row.
 * } props.budgetLines - The budget line data for the row.
 * @returns {React.JSX.Element} The TableRow component.
 */
const AllBudgetLinesTable = ({ budgetLines }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const BLIS_PER_PAGE = 10;

    let budgetLinesPage = _.cloneDeep(budgetLines);
    budgetLinesPage = budgetLinesPage.slice((currentPage - 1) * BLIS_PER_PAGE, currentPage * BLIS_PER_PAGE);

    const TableRow = ({ bl }) => {
        return (
            <>
                <tr>
                    <th>{bl.line_description}</th>
                    <td>{bl.agreement_name}</td>
                    <td>{formatDateNeeded(bl.date_needed)}</td>
                    <td>{bl.fiscal_year}</td>
                    <td>{bl.can_number}</td>
                    <td>
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
                    <td>
                        <TableTag status={bl.status} />
                    </td>
                </tr>
            </>
        );
    };

    return (
        <>
            <Table tableHeadings={All_BUDGET_LINES_TABLE_HEADINGS}>
                {budgetLinesPage.map((bl) => (
                    <TableRow key={bl?.id} bl={bl} />
                ))}
            </Table>
            <PaginationNav currentPage={currentPage} setCurrentPage={setCurrentPage} items={budgetLines} />
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

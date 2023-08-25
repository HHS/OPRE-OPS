import CurrencyFormat from "react-currency-format";
import TableTag from "../BudgetLinesTable/TableTag";

const AllBudgetLinesTable = ({ budgetLines }) => {
    const TableRow = ({ bl }) => {
        return (
            <>
                <tr>
                    <th>{bl.line_description}</th>
                    <td>{bl.agreement_name}</td>
                    <td>{bl.date_needed}</td>
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
            <table className="usa-table usa-table--borderless width-full">
                <thead>
                    <tr>
                        <th scope="col">Description</th>
                        <th scope="col">Agreement</th>
                        <th scope="col">Need By</th>
                        <th scope="col">FY</th>
                        <th scope="col">CAN</th>
                        <th scope="col">Total</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {budgetLines.map((bl) => (
                        <TableRow key={bl?.id} bl={bl} />
                    ))}
                </tbody>
            </table>
            <pre>{JSON.stringify(budgetLines, null, 2)}</pre>
        </>
    );
};

export default AllBudgetLinesTable;

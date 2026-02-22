import Table from "../../UI/Table";
import { getTableHeadingsWithFY } from "./AgreementsTable.constants";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import AgreementTableRow from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - Array of Agreement to display in the table.
 * @param {string} props.sortConditions - The conditions chosen to sort the table
 * @param {boolean} props.sortDescending - Whether or not the sort condition should be used to sort the table in descending order
 * @param {function} props.setSortConditions - The function that the base table uses to set the sort condition
 * @param {string} props.selectedFiscalYear - The selected fiscal year for the FY Obligated column
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({
    agreements = [],
    sortDescending,
    sortConditions,
    setSortConditions,
    selectedFiscalYear
}) => {
    const tableHeadings = getTableHeadingsWithFY(selectedFiscalYear, getCurrentFiscalYear());

    return (
        <>
            <Table
                tableHeadings={tableHeadings}
                selectedHeader={sortConditions}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
            >
                {agreements.length > 0 &&
                    agreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreementId={agreement.id}
                            selectedFiscalYear={selectedFiscalYear}
                        />
                    ))}
            </Table>
            {agreements.length === 0 && (
                <div
                    id="agreements-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

export default AgreementsTable;

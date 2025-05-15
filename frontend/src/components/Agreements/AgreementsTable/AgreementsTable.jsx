import Table from "../../UI/Table";
import { TABLE_HEADINGS_LIST } from "./AgreementsTable.constants";
import AgreementTableRow from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.

 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - Array of Agreement to display in the table.
 * @param {string} props.sortConditions - The conditions chosen to sort the table
 * @param {boolean} props.sortDescending - Whether or not the sort condition should be used to sort the table in descending order
 * @param {function} props.setSortConditions - The function that the base table uses to set the sort condition
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [], sortDescending, sortConditions, setSortConditions }) => {
    return (
        <>
            <Table
                tableHeadings={TABLE_HEADINGS_LIST}
                selectedHeader={sortConditions}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
            >
                {agreements.length > 0 &&
                    agreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreementId={agreement.id}
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

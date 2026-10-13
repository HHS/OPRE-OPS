import Table from "../../UI/Table";
import { getTableHeadingsWithFY } from "./AgreementsTable.constants";
import AgreementTableRow from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {import("../../../types/AgreementTypes").Agreement[]} props.agreements - Array of Agreement to display in the table.
 * @param {string} props.sortConditions - The conditions chosen to sort the table
 * @param {boolean} props.sortDescending - Whether or not the sort condition should be used to sort the table in descending order
 * @param {function} props.setSortConditions - The function that the base table uses to set the sort condition
 * @param {string} props.selectedFiscalYear - The selected fiscal year for the FY Obligated column
 * @param {boolean} [props.disableRowActions] - When true, hides edit/delete row actions. Use for
 *   non-cache-subscribed result sets (e.g. a one-off search) where a mutation wouldn't be reflected
 *   back into the displayed rows.
 * @param {boolean} [props.disableSorting] - When true, column headers render as plain text instead
 *   of sort buttons. Use when there's no sort state wired up (e.g. a static snapshot), so headers
 *   don't present as interactive controls that silently do nothing.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({
    agreements = [],
    sortDescending,
    sortConditions,
    setSortConditions,
    selectedFiscalYear,
    disableRowActions = false,
    disableSorting = false
}) => {
    const tableHeadings = getTableHeadingsWithFY(selectedFiscalYear);

    const handleClickHeader = (headerValue, isDescending) => {
        setSortConditions(headerValue, isDescending);
    };

    return (
        <>
            <Table
                tableHeadings={tableHeadings}
                selectedHeader={sortConditions}
                onClickHeader={handleClickHeader}
                sortDescending={sortDescending}
                sortable={!disableSorting}
            >
                {agreements.length > 0 &&
                    agreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreement={agreement}
                            selectedFiscalYear={selectedFiscalYear}
                            disableRowActions={disableRowActions}
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

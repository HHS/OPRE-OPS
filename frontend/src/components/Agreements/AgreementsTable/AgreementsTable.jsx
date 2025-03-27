import PropTypes from "prop-types";
import { SORT_TYPES, useSortData } from "../../../hooks/use-sortable-data.hooks";
import Table from "../../UI/Table";
import { useSetSortConditions } from "../../UI/Table/Table.hooks";
import { TABLE_HEADINGS_LIST } from "./AgreementsTable.constants";
import AgreementTableRow from "./AgreementTableRow";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {Object[]} props.agreements - Array of Agreement to display in the table.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [] }) => {
    const { sortDescending, sortCondition, setSortConditions } = useSetSortConditions();

    const sortedAgreements = useSortData(agreements, sortDescending, sortCondition, SORT_TYPES.AGREEMENTS);
    return (
        <>
            <Table
                tableHeadings={TABLE_HEADINGS_LIST}
                selectedHeader={sortCondition}
                onClickHeader={setSortConditions}
                sortDescending={sortDescending}
            >
                {sortedAgreements.length > 0 &&
                    sortedAgreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreement={agreement}
                        />
                    ))}
            </Table>
            {sortedAgreements.length === 0 && (
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

AgreementsTable.propTypes = {
    agreements: PropTypes.arrayOf(PropTypes.object)
};
export default AgreementsTable;

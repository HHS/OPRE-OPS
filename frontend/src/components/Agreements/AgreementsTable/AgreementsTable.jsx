import PropTypes from "prop-types";
import AgreementTableRow from "./AgreementTableRow";
import { useState } from "react";
import Table from "../../UI/Table";
import { TABLE_HEADINGS, TABLE_HEADINGS_LIST } from "./AgreementsTable.constants";
import {
    findNextBudgetLine,
    findNextNeedBy,
    getAgreementSubTotal,
    getBudgetLineAmount,
    getProcurementShopSubTotal
} from "./AgreementsTable.helpers.js";
import _ from "lodash";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {Object[]} props.agreements - Array of Agreement to display in the table.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [] }) => {
    const [sortCondition, setSortCondition] = useState(null);
    const [sortDescending, setSortDescending] = useState(true);
    const copyAgreements = _.cloneDeep(agreements);

    const setSortConditions = (selectedSortCondition, isSortDescending) => {
        if (selectedSortCondition != sortCondition) {
            setSortCondition(selectedSortCondition);
            setSortDescending(true);
        } else {
            setSortDescending(isSortDescending);
        }
    };

    const compareRows = (a, b, descending) => {
        if (a < b) {
            return descending ? 1 : -1;
        } else if (b < a) {
            return descending ? -1 : 1;
        }
        return 0;
    };

    const getComparableValue = (agreement, condition) => {
        switch (condition) {
            case TABLE_HEADINGS.AGREEMENT:
                return agreement.name;
            case TABLE_HEADINGS.PROJECT:
                console.log(`Project value: ${agreement.project}`);
                return agreement.project?.title;
            case TABLE_HEADINGS.TYPE:
                return agreement.agreement_type;
            case TABLE_HEADINGS.AGREEMENT_TOTAL:
                return getAgreementSubTotal(agreement) + getProcurementShopSubTotal(agreement);
            case TABLE_HEADINGS.NEXT_BUDGET_LINE:
                return getBudgetLineAmount(findNextBudgetLine(agreement));
            case TABLE_HEADINGS.NEXT_OBLIGATE_BY:
                return findNextNeedBy(agreement);
            default:
                return agreement;
        }
    };
    const sortedAgreements = copyAgreements.sort((a, b) => {
        const aVal = getComparableValue(a, sortCondition);
        const bVal = getComparableValue(b, sortCondition);
        return compareRows(aVal, bVal, sortDescending);
    });
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

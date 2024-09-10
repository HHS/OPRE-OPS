import _ from "lodash";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers.js";

const sortAgreements = (agreements) => {
    /*
     * Sort agreements by date_needed.
     * @param {Object[]} agreements - Array of agreements.
     *
     * @returns {Object[]} - Sorted array of agreements.
     *
     * This function needs a little work to be consistent with how the "Next Budget Line" and "Next Need By" are calculated.
     *
     * The sort order here is first including all agreements with BLIs that are not in DRAFT status, then sorting by date_needed.
     *
     */
    // BLIs will date_needed should come before BLIs with date_needed === null
    // date_needed can be string or Date
    if (!agreements) {
        return [];
    }

    const agreementsCopy = _.cloneDeep(agreements);

    // keep track of the original data type of date_needed so we can return the same type
    let datesAreStrings = false;

    // convert all date_needed to Date if needed
    agreementsCopy.forEach((agreement) => {
        agreement.budget_line_items.forEach((bli) => {
            if (typeof bli.date_needed === "string") {
                datesAreStrings = true;
                bli.date_needed = new Date(bli.date_needed);
            }
        });
    });

    const agreementsWithDateNeeded = agreementsCopy.map((agreement) => {
        return {
            ...agreement,
            min_date_needed: Math.min(
                ...agreement.budget_line_items.filter((bli) => bli.date_needed).map((bli) => bli.date_needed)
            ),
            all_draft: agreement.budget_line_items.every((bli) => bli.status === BLI_STATUS.DRAFT)
        };
    });

    const sortedAgreements = _.orderBy(agreementsWithDateNeeded, ["all_draft", "min_date_needed"]);

    // convert all date_needed back to string if needed
    if (datesAreStrings) {
        return sortedAgreements.map((agreement) => {
            return {
                ...agreement,
                budget_line_items: agreement.budget_line_items.map((bli) => {
                    return {
                        ...bli,
                        date_needed: bli.date_needed ? bli.date_needed.toISOString().split("T")[0] : null
                    };
                })
            };
        });
    }

    return sortedAgreements;
};

export default sortAgreements;

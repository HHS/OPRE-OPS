import _ from "lodash";

const sortAgreements = (agreements) => {
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

    const sortedAgreements = agreementsCopy.sort((a, b) => {
        const aMinDateNeeded = Math.min(...a.budget_line_items);
        const bMinDateNeeded = Math.min(...b.budget_line_items);

        if ((!aMinDateNeeded && bMinDateNeeded) || aMinDateNeeded < bMinDateNeeded) {
            return -1;
        }
        if ((!bMinDateNeeded && aMinDateNeeded) || aMinDateNeeded > bMinDateNeeded) {
            return 1;
        }
        return 0;
    });

    // convert all date_needed back to string if needed
    if (datesAreStrings) {
        return sortedAgreements.map((agreement) => {
            return {
                ...agreement,
                budget_line_items: agreement.budget_line_items.map((bli) => {
                    return {
                        ...bli,
                        date_needed: bli.date_needed ? bli.date_needed.toISOString().split("T")[0] : null,
                    };
                }),
            };
        });
    }

    return sortedAgreements;
};

export default sortAgreements;

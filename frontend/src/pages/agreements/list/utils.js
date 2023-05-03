import _ from "lodash";

const sortAgreements = (agreements) => {
    // BLIs will date_needed should come before BLIs with date_needed === null
    // date_needed can be string or Date
    if (!agreements) {
        return [];
    }

    let datesAreStrings = false;

    agreements.forEach((agreement) => {
        agreement.budget_line_items.forEach((bli) => {
            if (typeof bli.date_needed === "string") {
                datesAreStrings = true;
            }
        });
    });

    const agreementsCopy = _.cloneDeep(agreements);

    const sortedAgreements = agreementsCopy.sort((a, b) => {
        // convert strings to dates
        const aDates = a.budget_line_items
            .filter((n) => n.date_needed)
            .map((item) => {
                return (item.date_needed = new Date(item.date_needed));
            });
        const bDates = b.budget_line_items
            .filter((n) => n.date_needed)
            .map((item) => {
                return (item.date_needed = new Date(item.date_needed));
            });
        const aMinDateNeeded = Math.min(...aDates);
        const bMinDateNeeded = Math.min(...bDates);

        if ((!aMinDateNeeded && bMinDateNeeded) || aMinDateNeeded < bMinDateNeeded) {
            return -1;
        }
        if ((!bMinDateNeeded && aMinDateNeeded) || aMinDateNeeded > bMinDateNeeded) {
            return 1;
        }
        return 0;
    });

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

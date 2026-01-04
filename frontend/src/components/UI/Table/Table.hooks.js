import { useState } from "react";
export const useSetSortConditions = (initialSortCondition = null, initialSortDescending = true) => {
    const [sortCondition, setSortCondition] = useState(initialSortCondition);
    const [sortDescending, setSortDescending] = useState(initialSortDescending);

    const setSortConditions = (selectedSortCondition, isSortDescending) => {
        if (selectedSortCondition != sortCondition) {
            setSortCondition(selectedSortCondition);
            setSortDescending(true);
        } else {
            setSortDescending(isSortDescending);
        }
    };

    return { sortDescending, sortCondition, setSortConditions };
};

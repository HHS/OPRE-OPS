import { useState } from "react";
export const useSetSortConditions = () => {
    const [sortCondition, setSortCondition] = useState(null);
    const [sortDescending, setSortDescending] = useState(true);

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

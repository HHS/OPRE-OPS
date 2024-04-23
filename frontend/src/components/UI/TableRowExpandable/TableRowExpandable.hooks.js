import React from "react";

export const useTableRow = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isRowActive, setIsRowActive] = React.useState(false);
    const trId = React.useId();

    return {
        trId,
        isExpanded,
        setIsExpanded,
        isRowActive,
        setIsRowActive
    };
};

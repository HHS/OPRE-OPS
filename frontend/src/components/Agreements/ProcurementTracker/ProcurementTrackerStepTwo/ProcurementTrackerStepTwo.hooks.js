import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";

export default function useProcurementTrackerStepTwo(stepTwoData) {
    const MemoizedDatePicker = React.memo(DatePicker);

    return {
        MemoizedDatePicker,
        stepTwoData
    };
}

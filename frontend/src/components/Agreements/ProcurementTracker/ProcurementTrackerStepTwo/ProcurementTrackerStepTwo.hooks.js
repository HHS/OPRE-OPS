import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";

export default function useProcurementTrackerStepTwo(stepTwoData) {
    const MemoizedDatePicker = React.memo(DatePicker);
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");

    return {
        MemoizedDatePicker,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate
    };
}

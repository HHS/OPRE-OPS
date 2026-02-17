import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";

export default function useProcurementTrackerStepTwo(stepTwoData) {
    const MemoizedDatePicker = React.memo(DatePicker);
    const [targetCompletionDate, setTargetCompletionDate] = React.useState(stepTwoData?.target_completion_date || "");

    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    return {
        MemoizedDatePicker,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate,
        runValidate,
        validatorRes
    };
}

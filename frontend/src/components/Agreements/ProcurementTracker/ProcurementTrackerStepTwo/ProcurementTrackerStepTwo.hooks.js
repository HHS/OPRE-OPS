import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import suite from "./suite";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Two.
 * @param {Object} stepTwoData - The data for step two of the procurement tracker.
 */
export default function useProcurementTrackerStepTwo(stepTwoData) {
    const MemoizedDatePicker = React.memo(DatePicker);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState(stepTwoData?.target_completion_date || "");
    const step2CompletedByUserName = useGetUserFullNameFromId(stepTwoData?.task_completed_by);

    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    return {
        selectedUser,
        setSelectedUser,
        MemoizedDatePicker,
        stepTwoData,
        targetCompletionDate,
        step2CompletedByUserName,
        setTargetCompletionDate,
        runValidate,
        validatorRes
    };
}

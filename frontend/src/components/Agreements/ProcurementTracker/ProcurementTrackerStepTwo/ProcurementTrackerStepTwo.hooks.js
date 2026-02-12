import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Two.
 * @param {Object} stepTwoData - The data for step two of the procurement tracker.
 */
export default function useProcurementTrackerStepTwo(stepTwoData) {
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const MemoizedDatePicker = React.memo(DatePicker);
    const step2CompletedByUserName = useGetUserFullNameFromId(stepTwoData?.task_completed_by);

    return {
        selectedUser,
        setSelectedUser,
        MemoizedDatePicker,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate,
        step2CompletedByUserName
    };
}

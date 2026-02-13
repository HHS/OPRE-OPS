import React from "react";
import DatePicker from "../../../UI/USWDS/DatePicker";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateToMonthDayYear } from "../../../../helpers/utils";
import suite from "./suite";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Two.
 * @param {Object} stepTwoData - The data for step two of the procurement tracker.
 */
export default function useProcurementTrackerStepTwo(stepTwoData) {
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const [step2DateCompleted, setStep2DateCompleted] = React.useState("");
    const [validatorRes, setValidatorRes] = React.useState(suite.get());

    const MemoizedDatePicker = React.memo(DatePicker);
    const step2CompletedByUserName = useGetUserFullNameFromId(stepTwoData?.task_completed_by);
    const step2DateCompletedLabel = formatDateToMonthDayYear(stepTwoData?.date_completed);

    const runValidate = (name, value) => {
        const result = suite({ ...{ [name]: value } }, name);
        setValidatorRes(result);
    };

    return {
        selectedUser,
        setSelectedUser,
        MemoizedDatePicker,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        runValidate,
        validatorRes,
        step2DateCompletedLabel
    };
}

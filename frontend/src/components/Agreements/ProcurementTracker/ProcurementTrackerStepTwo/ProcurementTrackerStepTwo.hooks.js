import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Two.
 * @param {Object} stepTwoData - The data for step two of the procurement tracker.
 */
export default function useProcurementTrackerStepTwo(stepTwoData) {
    const [isPreSolicitationPackageFinalized, setIsPreSolicitationPackageFinalized] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState(stepTwoData?.target_completion_date || "");
    const [step2DateCompleted, setStep2DateCompleted] = React.useState("");
    const [step2Notes, setStep2Notes] = React.useState("");

    const step2CompletedByUserName = useGetUserFullNameFromId(stepTwoData?.task_completed_by);
    const step2DateCompletedLabel = formatDateToMonthDayYear(stepTwoData?.date_completed);
    const step2NotesLabel = stepTwoData?.notes;
    const MemoizedDatePicker = React.memo(DatePicker);

    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    return {
        isPreSolicitationPackageFinalized,
        setIsPreSolicitationPackageFinalized,
        selectedUser,
        setSelectedUser,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        step2Notes,
        setStep2Notes,
        step2NotesLabel,
        runValidate,
        validatorRes,
        step2DateCompletedLabel,
        MemoizedDatePicker
    };
}

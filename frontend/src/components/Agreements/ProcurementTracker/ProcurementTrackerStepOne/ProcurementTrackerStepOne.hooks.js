import React from "react";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import suite from "./suite";

export default function useProcurementTrackerStepOne(stepOneData) {
    const [isPreSolicitationPackageSent, setIsPreSolicitationPackageSent] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [step1DateCompleted, setStep1DateCompleted] = React.useState("");
    const [step1Notes, setStep1Notes] = React.useState("");
    const [patchStepOne] = useUpdateProcurementTrackerStepMutation();

    const step1CompletedByUserName = useGetUserFullNameFromId(stepOneData?.task_completed_by);
    const step1DateCompletedLabel = formatDateToMonthDayYear(stepOneData?.date_completed);
    const step1NotesLabel = stepOneData?.notes;

    const MemoizedDatePicker = React.memo(DatePicker);
    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    const handleStep1Complete = async (stepId) => {
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser.id,
            date_completed: formatDateForApi(step1DateCompleted),
            notes: step1Notes.trim()
        };

        try {
            await patchStepOne({
                stepId,
                data: payload
            }).unwrap();
            console.log("Procurement Tracker Step 1 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 1", error);
            if (typeof window !== "undefined" && typeof window.alert === "function") {
                window.alert("Unable to update Procurement Tracker Step 1. Please try again.");
            }
        }
    };

    const cancelStep1 = () => {
        setIsPreSolicitationPackageSent(false);
        setSelectedUser({});
        setStep1DateCompleted("");
        setStep1Notes("");
        suite.reset();
    };

    const disableStep1Continue =
        !isPreSolicitationPackageSent || !selectedUser?.id || !step1DateCompleted || validatorRes.hasErrors();

    return {
        isPreSolicitationPackageSent,
        setIsPreSolicitationPackageSent,
        selectedUser,
        setSelectedUser,
        step1DateCompleted,
        setStep1DateCompleted,
        MemoizedDatePicker,
        step1Notes,
        setStep1Notes,
        handleStep1Complete,
        cancelStep1,
        disableStep1Continue,
        step1CompletedByUserName,
        step1DateCompletedLabel,
        step1NotesLabel,
        runValidate,
        validatorRes
    };
}

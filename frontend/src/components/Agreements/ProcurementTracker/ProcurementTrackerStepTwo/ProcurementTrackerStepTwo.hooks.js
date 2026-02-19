import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Two.
 * @param {Object} stepTwoData - The data for step two of the procurement tracker.
 */
export default function useProcurementTrackerStepTwo(stepTwoData) {
    const [isPreSolicitationPackageFinalized, setIsPreSolicitationPackageFinalized] = React.useState(false);
    const [draftSolicitationDate, setDraftSolicitationDate] = React.useState("");
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const [step2DateCompleted, setStep2DateCompleted] = React.useState("");
    const [step2Notes, setStep2Notes] = React.useState("");

    const [patchStepTwo] = useUpdateProcurementTrackerStepMutation();
    const { setAlert } = useAlert();

    const step2CompletedByUserName = useGetUserFullNameFromId(stepTwoData?.task_completed_by);
    const step2DateCompletedLabel = formatDateToMonthDayYear(stepTwoData?.date_completed);
    const step2TargetCompletionDateLabel = formatDateToMonthDayYear(stepTwoData?.target_completion_date);
    const step2NotesLabel = stepTwoData?.notes;
    const MemoizedDatePicker = React.memo(DatePicker);

    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    /**
     * Handles the submission of the target completion date for step two, updating the procurement tracker step with the new date.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleTargetCompletionDateSubmit = async (stepId) => {
        const payload = {
            target_completion_date: formatDateForApi(targetCompletionDate)
        };
        try {
            await patchStepTwo({
                stepId,
                data: payload
            }).unwrap();
            // handleSetIsFormSubmitted(true);
            console.log("Procurement Tracker Step 2 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 2", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    /**
     * Handles the submission of the target completion date for step two, updating the procurement tracker step with the new date.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleStepTwoComplete = async (stepId) => {
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser.id,
            date_completed: formatDateForApi(step2DateCompleted),
            notes: step2Notes.trim(),
            draft_solicitation_date: formatDateForApi(draftSolicitationDate)
        };

        try {
            await patchStepTwo({
                stepId,
                data: payload
            }).unwrap();

            console.log("Procurement Tracker Step 2 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 2", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    const cancelStepTwo = () => {
        setIsPreSolicitationPackageFinalized(false);
        setDraftSolicitationDate("");
        setSelectedUser({});
        setTargetCompletionDate("");
        setStep2DateCompleted("");
        setStep2Notes("");
    };

    return {
        cancelStepTwo,
        isPreSolicitationPackageFinalized,
        setIsPreSolicitationPackageFinalized,
        draftSolicitationDate,
        setDraftSolicitationDate,
        selectedUser,
        setSelectedUser,
        stepTwoData,
        targetCompletionDate,
        setTargetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        step2TargetCompletionDateLabel,
        step2Notes,
        setStep2Notes,
        step2NotesLabel,
        runValidate,
        validatorRes,
        step2DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        handleStepTwoComplete
    };
}

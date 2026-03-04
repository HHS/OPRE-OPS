import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

/**
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerEvaluationStep} ProcurementTrackerEvaluationStep
 */

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Four (Evaluation).
 * @param {ProcurementTrackerEvaluationStep | undefined} stepFourData - The data for step four of the procurement tracker.
 * @param {Function} handleSetCompletedStepNumber - Function to set the completed step number.
 */
export default function useProcurementTrackerStepFour(stepFourData, handleSetCompletedStepNumber) {
    const [isEvaluationComplete, setIsEvaluationComplete] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const [step4DateCompleted, setStep4DateCompleted] = React.useState("");
    const [step4Notes, setStep4Notes] = React.useState("");
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [patchStepFour] = useUpdateProcurementTrackerStepMutation();
    const { setAlert } = useAlert();

    const step4CompletedByUserName = useGetUserFullNameFromId(stepFourData?.task_completed_by ?? -1);
    const step4DateCompletedLabel = formatDateToMonthDayYear(stepFourData?.date_completed ?? "");
    const step4TargetCompletionDateLabel = formatDateToMonthDayYear(stepFourData?.target_completion_date ?? "");
    const step4NotesLabel = stepFourData?.notes;
    const MemoizedDatePicker = React.memo(DatePicker);

    const runValidate = (name, value) => {
        suite({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    /**
     * Handles the submission of the target completion date for step four, updating the procurement tracker step with the new date.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleTargetCompletionDateSubmit = async (stepId) => {
        const payload = {
            target_completion_date: formatDateForApi(targetCompletionDate)
        };
        try {
            await patchStepFour({
                stepId,
                data: payload
            }).unwrap();
            console.log("Procurement Tracker Step 4 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 4", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    /**
     * Handles the completion of step four, updating the procurement tracker step with completion data.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleStepFourComplete = async (stepId) => {
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser.id,
            date_completed: formatDateForApi(step4DateCompleted),
            notes: step4Notes.trim()
        };

        // Only include target_completion_date if it hasn't been set yet
        if (!stepFourData?.target_completion_date) {
            payload.target_completion_date = formatDateForApi(targetCompletionDate);
        }

        try {
            await patchStepFour({
                stepId,
                data: payload
            }).unwrap();

            // Trigger accordion behavior to keep steps 4 and 5 open
            if (handleSetCompletedStepNumber) {
                handleSetCompletedStepNumber(4);
            }

            console.log("Procurement Tracker Step 4 Completed");
        } catch (error) {
            console.error("Failed to complete Procurement Tracker Step 4", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
        }
    };

    const cancelStepFour = () => {
        setIsEvaluationComplete(false);
        setSelectedUser({});
        setTargetCompletionDate("");
        setStep4DateCompleted("");
        setStep4Notes("");
    };

    const cancelModalStep4 = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                cancelStepFour();
            }
        });
    };

    return {
        cancelStepFour,
        isEvaluationComplete,
        setIsEvaluationComplete,
        selectedUser,
        setSelectedUser,
        stepFourData,
        targetCompletionDate,
        setTargetCompletionDate,
        step4CompletedByUserName,
        step4DateCompleted,
        setStep4DateCompleted,
        step4TargetCompletionDateLabel,
        step4Notes,
        setStep4Notes,
        step4NotesLabel,
        runValidate,
        validatorRes,
        step4DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        handleStepFourComplete,
        showModal,
        modalProps,
        setShowModal,
        cancelModalStep4
    };
}

import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

/**
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerPreAwardStep} ProcurementTrackerPreAwardStep
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 */

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Five (Pre-Award).
 * @param {ProcurementTrackerPreAwardStep | undefined} stepFiveData - The data for step five of the procurement tracker.
 * @param {Function | undefined} handleSetCompletedStepNumber - Function to set the completed step number.
 */
export default function useProcurementTrackerStepFive(stepFiveData, handleSetCompletedStepNumber) {
    const [isPreAwardComplete, setIsPreAwardComplete] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(/** @type {SafeUser | undefined} */ (undefined));
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const [step5DateCompleted, setStep5DateCompleted] = React.useState("");
    const [step5Notes, setStep5Notes] = React.useState("");
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [patchStepFive] = useUpdateProcurementTrackerStepMutation();
    const { setAlert } = useAlert();

    const step5CompletedByUserName = useGetUserFullNameFromId(stepFiveData?.task_completed_by ?? -1);
    const step5DateCompletedLabel = formatDateToMonthDayYear(stepFiveData?.date_completed ?? "") ?? undefined;
    const step5TargetCompletionDateLabel =
        formatDateToMonthDayYear(stepFiveData?.target_completion_date ?? "") ?? undefined;
    const step5NotesLabel = stepFiveData?.notes;
    const MemoizedDatePicker = React.memo(DatePicker);

    /**
     * @param {string} name
     * @param {any} value
     */
    const runValidate = (name, value) => {
        suite.run({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    /**
     * Handles the submission of the target completion date for step five, updating the procurement tracker step with the new date.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleTargetCompletionDateSubmit = async (stepId) => {
        const payload = {
            target_completion_date: formatDateForApi(targetCompletionDate)
        };
        try {
            await patchStepFive({
                stepId,
                data: payload
            }).unwrap();
            setTargetCompletionDate("");
            console.log("Procurement Tracker Step 5 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 5", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    /**
     * Handles the completion of step five, updating the procurement tracker step with completion data.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleStepFiveComplete = async (stepId) => {
        /** @type {Record<string, any>} */
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser?.id,
            date_completed: formatDateForApi(step5DateCompleted),
            notes: step5Notes.trim()
        };

        // Only include target_completion_date if it hasn't been set yet
        if (!stepFiveData?.target_completion_date) {
            payload.target_completion_date = formatDateForApi(targetCompletionDate);
        }

        try {
            await patchStepFive({
                stepId,
                data: payload
            }).unwrap();

            // Trigger accordion behavior to keep steps 5 and 6 open
            if (handleSetCompletedStepNumber) {
                handleSetCompletedStepNumber(5);
            }

            console.log("Procurement Tracker Step 5 Completed");
        } catch (error) {
            console.error("Failed to complete Procurement Tracker Step 5", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
        }
    };

    const cancelStepFive = () => {
        setIsPreAwardComplete(false);
        setSelectedUser(undefined);
        setTargetCompletionDate("");
        setStep5DateCompleted("");
        setStep5Notes("");
    };

    const cancelModalStep5 = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                cancelStepFive();
            }
        });
    };

    return {
        cancelStepFive,
        isPreAwardComplete,
        setIsPreAwardComplete,
        selectedUser,
        setSelectedUser,
        stepFiveData,
        targetCompletionDate,
        setTargetCompletionDate,
        step5CompletedByUserName,
        step5DateCompleted,
        setStep5DateCompleted,
        step5TargetCompletionDateLabel,
        step5Notes,
        setStep5Notes,
        step5NotesLabel,
        runValidate,
        validatorRes,
        step5DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        handleStepFiveComplete,
        showModal,
        modalProps,
        setShowModal,
        cancelModalStep5
    };
}

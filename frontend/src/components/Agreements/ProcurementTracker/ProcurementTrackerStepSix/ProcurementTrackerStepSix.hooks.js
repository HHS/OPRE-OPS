import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";
import useSaveNotes from "../useSaveNotes";

/**
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerAwardStep} ProcurementTrackerAwardStep
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 */

const MemoizedDatePicker = DatePicker; // DatePicker is already React.memo'd at source

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Six (Award).
 * @param {ProcurementTrackerAwardStep | undefined} stepSixData - The data for step six of the procurement tracker.
 * @param {Function | undefined} handleSetCompletedStepNumber - Function to set the completed step number.
 */
export default function useProcurementTrackerStepSix(stepSixData, handleSetCompletedStepNumber) {
    const [isAwardCheckboxChecked, setIsAwardCheckboxChecked] = React.useState(
        () => stepSixData?.approval_requested ?? false
    );
    const [selectedUser, setSelectedUser] = React.useState(/** @type {SafeUser | undefined} */ (undefined));
    const [targetCompletionDate, setTargetCompletionDate] = React.useState("");
    const [stepSixDateCompleted, setStepSixDateCompleted] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [patchStepSix] = useUpdateProcurementTrackerStepMutation();
    const { setAlert } = useAlert();

    const stepSixCompletedByUserName = useGetUserFullNameFromId(stepSixData?.task_completed_by ?? -1);
    const stepSixDateCompletedLabel = formatDateToMonthDayYear(stepSixData?.date_completed ?? "") ?? undefined;
    const stepSixTargetCompletionDateLabel =
        formatDateToMonthDayYear(stepSixData?.target_completion_date ?? "") ?? undefined;
    const stepSixNotesLabel = stepSixData?.notes;

    // Sync checkbox state when approval_requested changes (e.g., after requesting approval)
    React.useEffect(() => {
        if (stepSixData?.approval_requested !== undefined && stepSixData?.approval_requested !== null) {
            setIsAwardCheckboxChecked(stepSixData.approval_requested);
        }
    }, [stepSixData?.approval_requested]);

    /**
     * @param {string} name
     * @param {any} value
     */
    const runValidate = (name, value) => {
        suite.run({ ...{ [name]: value } }, name);
    };

    let validatorRes = suite.get();

    const {
        notes: stepSixNotes,
        setNotes: setStepSixNotes,
        handleSaveNotes
    } = useSaveNotes(patchStepSix, stepSixData?.notes, setAlert);

    /**
     * Handles the submission of the target completion date for step six, updating the procurement tracker step with the new date.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleTargetCompletionDateSubmit = async (stepId) => {
        const payload = {
            target_completion_date: formatDateForApi(targetCompletionDate)
        };
        try {
            await patchStepSix({
                stepId,
                data: payload
            }).unwrap();
            setTargetCompletionDate("");
            console.log("Procurement Tracker Step 6 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 6", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    /**
     * Handles the completion of step six, updating the procurement tracker step with completion data.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleStepSixComplete = async (stepId) => {
        /** @type {Record<string, any>} */
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser?.id,
            date_completed: formatDateForApi(stepSixDateCompleted),
            notes: stepSixNotes.trim()
        };

        // Only include target_completion_date if it hasn't been set yet
        if (!stepSixData?.target_completion_date) {
            payload.target_completion_date = formatDateForApi(targetCompletionDate);
        }

        setIsSubmitting(true);
        try {
            await patchStepSix({
                stepId,
                data: payload
            }).unwrap();
            console.log("Procurement Tracker Step 6 Completed");
            // Notify the parent so the accordion/scroll state updates for the completed step.
            // isSubmitting stays true here intentionally: the edit form only unmounts once
            // RTK Query refetches and stepStatus flips to COMPLETED, which naturally prevents
            // a duplicate submit. Resetting it early (e.g. via setTimeout) would re-enable
            // the button on slow networks before the status has updated.
            handleSetCompletedStepNumber && handleSetCompletedStepNumber(6);
        } catch (error) {
            console.error("Failed to complete Procurement Tracker Step 6", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error completing the procurement tracker step. Please try again."
            });
            setIsSubmitting(false); // Re-enable form on error
        }
    };

    /**
     * Resets the form state to initial values.
     */
    const cancelStepSix = () => {
        suite.reset(); // Clear validation state
        setIsAwardCheckboxChecked(false);
        setSelectedUser(undefined);
        setTargetCompletionDate("");
        setStepSixDateCompleted("");
        setStepSixNotes("");
        setShowModal(false);
    };

    /**
     * Opens the confirmation modal for canceling step six.
     */
    const cancelModalStepSix = () => {
        setModalProps({
            heading: "Are you sure you want to cancel Step 6?",
            actionButtonText: "Cancel Step 6",
            secondaryButtonText: "Continue Step 6",
            handleConfirm: () => {
                cancelStepSix();
            }
        });
        setShowModal(true);
    };

    return {
        handleSaveNotes,
        isAwardCheckboxChecked,
        setIsAwardCheckboxChecked,
        selectedUser,
        setSelectedUser,
        targetCompletionDate,
        setTargetCompletionDate,
        stepSixDateCompleted,
        setStepSixDateCompleted,
        stepSixNotes,
        setStepSixNotes,
        isSubmitting,
        showModal,
        setShowModal,
        modalProps,
        handleTargetCompletionDateSubmit,
        handleStepSixComplete,
        cancelStepSix,
        cancelModalStepSix,
        stepSixCompletedByUserName,
        stepSixDateCompletedLabel,
        stepSixTargetCompletionDateLabel,
        stepSixNotesLabel,
        MemoizedDatePicker,
        runValidate,
        validatorRes
    };
}

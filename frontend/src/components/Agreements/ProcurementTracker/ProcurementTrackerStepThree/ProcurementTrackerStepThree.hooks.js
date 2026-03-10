import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import useAlert from "../../../../hooks/use-alert.hooks";

/**
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerSolicitationStep} ProcurementTrackerSolicitationStep
 */

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Three.
 * @param {ProcurementTrackerSolicitationStep | undefined} stepThreeData - The data for step three of the procurement tracker.
 * @param {Function} handleSetCompletedStepNumber - Callback to update completed step state.
 */
export default function useProcurementTrackerStepThree(stepThreeData, handleSetCompletedStepNumber) {
    const [selectedUser, setSelectedUser] = React.useState({});
    const [step3DateCompleted, setStep3DateCompleted] = React.useState("");
    const [solicitationPeriodStartDate, setSolicitationPeriodStartDate] = React.useState("");
    const [solicitationPeriodEndDate, setSolicitationPeriodEndDate] = React.useState("");
    const [step3Notes, setStep3Notes] = React.useState("");
    const [isSolicitationClosed, setIsSolicitationClosed] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const [patchStepThree] = useUpdateProcurementTrackerStepMutation();
    const { setAlert } = useAlert();

    // @ts-expect-error - These functions handle undefined values gracefully
    const step3CompletedByUserName = useGetUserFullNameFromId(stepThreeData?.task_completed_by);
    // @ts-expect-error - These functions handle undefined values gracefully
    const step3DateCompletedLabel = formatDateToMonthDayYear(stepThreeData?.date_completed);
    // @ts-expect-error - These functions handle undefined values gracefully
    const solicitationStartDateLabel = formatDateToMonthDayYear(stepThreeData?.solicitation_period_start_date);
    // @ts-expect-error - These functions handle undefined values gracefully
    const solicitationEndDateLabel = formatDateToMonthDayYear(stepThreeData?.solicitation_period_end_date);
    const step3NotesLabel = stepThreeData?.notes;
    const MemoizedDatePicker = React.memo(DatePicker);

    /**
     * @param {string} name
     * @param {any} value
     */
    const runValidate = (name, value, overrides = {}) => {
        suite.run(
            {
                users: selectedUser?.id,
                dateCompleted: step3DateCompleted,
                solicitationPeriodStartDate,
                solicitationPeriodEndDate,
                notes: step3Notes,
                ...overrides,
                [name]: value
            },
            name
        );
    };

    let validatorRes = suite.get();

    const cancelStep3 = () => {
        setIsSolicitationClosed(false);
        setSolicitationPeriodStartDate("");
        setSolicitationPeriodEndDate("");
        setSelectedUser({});
        setStep3DateCompleted("");
        setStep3Notes("");
        suite.reset();
    };

    const cancelModalStep3 = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                cancelStep3();
            }
        });
    };

    /**
     * Handles the submission of the solicitation period dates for step three, updating the procurement tracker step with the new dates.
     * @param {number} stepId - The ID of the procurement tracker step being updated.
     * @returns {Promise<void>}
     */
    const handleSolicitationDatesSubmit = async (stepId) => {
        const payload = {
            solicitation_period_start_date: formatDateForApi(solicitationPeriodStartDate),
            solicitation_period_end_date: formatDateForApi(solicitationPeriodEndDate)
        };
        try {
            await patchStepThree({
                stepId,
                data: payload
            }).unwrap();
            console.log("Procurement Tracker Step 3 solicitation dates updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 3 solicitation dates", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the solicitation period dates. Please try again."
            });
        }
    };

    const handleStep3Complete = async (stepId) => {
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser.id,
            date_completed: formatDateForApi(step3DateCompleted),
            notes: step3Notes.trim()
        };

        // Only include solicitation dates if they haven't been saved yet
        if (solicitationPeriodStartDate && !stepThreeData?.solicitation_period_start_date) {
            payload.solicitation_period_start_date = formatDateForApi(solicitationPeriodStartDate);
        }
        if (solicitationPeriodEndDate && !stepThreeData?.solicitation_period_end_date) {
            payload.solicitation_period_end_date = formatDateForApi(solicitationPeriodEndDate);
        }

        try {
            await patchStepThree({
                stepId,
                data: payload
            }).unwrap();
            console.log("Procurement Tracker Step 3 Updated");

            // Trigger accordion behavior to keep steps 3 and 4 open (if step 4 exists)
            if (handleSetCompletedStepNumber) {
                handleSetCompletedStepNumber(3);
            }
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 3", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };

    return {
        selectedUser,
        setSelectedUser,
        stepThreeData,
        step3DateCompleted,
        setStep3DateCompleted,
        solicitationPeriodStartDate,
        setSolicitationPeriodStartDate,
        solicitationPeriodEndDate,
        setSolicitationPeriodEndDate,
        step3Notes,
        setStep3Notes,
        step3CompletedByUserName,
        step3DateCompletedLabel,
        solicitationStartDateLabel,
        solicitationEndDateLabel,
        step3NotesLabel,
        runValidate,
        validatorRes,
        MemoizedDatePicker,
        isSolicitationClosed,
        setIsSolicitationClosed,
        showModal,
        setShowModal,
        modalProps,
        cancelModalStep3,
        handleSolicitationDatesSubmit,
        handleStep3Complete
    };
}

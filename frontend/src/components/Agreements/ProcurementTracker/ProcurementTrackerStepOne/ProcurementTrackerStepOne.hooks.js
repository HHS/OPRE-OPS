import React from "react";
import { useUpdateProcurementTrackerStepMutation } from "../../../../api/opsAPI";
import { formatDateForApi, formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import suite from "./suite";
import useAlert from "../../../../hooks/use-alert.hooks";

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step One.
 * @param {Object} stepOneData - The data for step one of the procurement tracker.
 * @param {Function} handleSetCompletedStepNumber - Function to set the completed step number.
 */
export default function useProcurementTrackerStepOne(stepOneData, handleSetCompletedStepNumber) {
    const [isPreSolicitationPackageSent, setIsPreSolicitationPackageSent] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [step1DateCompleted, setStep1DateCompleted] = React.useState("");
    const [step1Notes, setStep1Notes] = React.useState("");
    const [patchStepOne] = useUpdateProcurementTrackerStepMutation();
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });

    const step1CompletedByUserName = useGetUserFullNameFromId(stepOneData?.task_completed_by);
    const step1DateCompletedLabel = formatDateToMonthDayYear(stepOneData?.date_completed);
    const step1NotesLabel = stepOneData?.notes;
    const { setAlert } = useAlert();
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
            handleSetCompletedStepNumber(1);
            console.log("Procurement Tracker Step 1 Updated");
        } catch (error) {
            console.error("Failed to update Procurement Tracker Step 1", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "There was an error updating the procurement tracker step. Please try again."
            });
        }
    };
    const cancelStep1 = () => {
        setIsPreSolicitationPackageSent(false);
        setSelectedUser({});
        setStep1DateCompleted("");
        setStep1Notes("");
        suite.reset();
    };
    const cancelModalStep1 = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this task? Your input will not be saved.",
            actionButtonText: "Cancel Task",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                cancelStep1();
            }
        });
    };

    const disableStep1Buttons = !isPreSolicitationPackageSent || !selectedUser?.id || !step1DateCompleted;

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
        cancelModalStep1,
        disableStep1Buttons,
        step1CompletedByUserName,
        step1DateCompletedLabel,
        step1NotesLabel,
        modalProps,
        showModal,
        setShowModal,
        runValidate,
        validatorRes
    };
}

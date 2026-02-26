import React from "react";
import useGetUserFullNameFromId from "../../../../hooks/user.hooks";
import { formatDateToMonthDayYear } from "../../../../helpers/utils";
import DatePicker from "../../../UI/USWDS/DatePicker";
import suite from "./suite";

/**
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerSolicitationStep} ProcurementTrackerSolicitationStep
 */

/**
 * Custom hook to manage the state and logic for Procurement Tracker Step Three.
 * @param {ProcurementTrackerSolicitationStep | undefined} stepThreeData - The data for step three of the procurement tracker.
 */
export default function useProcurementTrackerStepThree(stepThreeData) {
    const [selectedUser, setSelectedUser] = React.useState({});
    const [step3DateCompleted, setStep3DateCompleted] = React.useState("");
    const [solicitationPeriodStartDate, setSolicitationPeriodStartDate] = React.useState("");
    const [solicitationPeriodEndDate, setSolicitationPeriodEndDate] = React.useState("");
    const [step3Notes, setStep3Notes] = React.useState("");
    const [isSolicitationClosed, setIsSolicitationClosed] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});

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
        suite(
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

    const handleStep3Complete = (stepId) => {
        // TODO: Implement API call to complete step
        console.log("Complete Step 3:", stepId);
        alert("Complete Step 3 functionality to be implemented with API integration");
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
        handleStep3Complete
    };
}

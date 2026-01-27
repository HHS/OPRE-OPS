import React from "react";
import DatePicker from "../../../components/UI/USWDS/DatePicker";
import { useUpdateProcurementTrackerStepMutation } from "../../../api/opsAPI";

export default function useAgreementProcurementTracker() {
    const [isPreSolicitationPackageSent, setIsPreSolicitationPackageSent] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState({});
    const [step1DateCompleted, setStep1DateCompleted] = React.useState("");
    const [step1Notes, setStep1Notes] = React.useState("");
    const [patchStepOne] = useUpdateProcurementTrackerStepMutation();

    const MemoizedDatePicker = React.memo(DatePicker);

    const handleStep1Complete = async (stepId) => {
        const payload = {
            status: "COMPLETED",
            task_completed_by: selectedUser.id,
            date_completed: step1DateCompleted,
            notes: step1Notes
        };
        await patchStepOne({
            stepId,
            data: payload
        }).unwrap();
        console.log("Procurement Tracker Step 1 Updated");


    };

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
        handleStep1Complete
    };
}

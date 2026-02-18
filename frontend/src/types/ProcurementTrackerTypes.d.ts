export type ProcurementTracker = {
    active_step_number: number;
    agreement_id: number;
    id: number;
    procurement_action: number;
    status: "ACTIVE" | null;
    steps: ProcurementTrackerSteps;
    tracker_type: "DEFAULT";
};

export type ProcurementTrackerSteps = {
    stepOne: {
        date_completed: string;
        id: null;
        notes: string;
        procurement_tracker_id: number;
        status: "COMPLETED" | "PENDING";
        step_completed_date: string;
        step_number: number;
        step_start_date: string;
        step_type: "ACQUISITION_PLANNING" | "PRE_SOLICITATION" | "SOLICITATION" | "EVALUATION" | "PRE_AWARD" | "AWARD";
        task_completed_by: number;
    };
    stepTwo: {
        date_completed: string;
        draft_solicitation_date: string;
        id: number;
        notes: string;
        procurement_tracker_id: number;
        status: "COMPLETED" | "PENDING";
        step_completed_date: string;
        step_number: number;
        step_start_date: string;
        step_type: "ACQUISITION_PLANNING" | "PRE_SOLICITATION" | "SOLICITATION" | "EVALUATION" | "PRE_AWARD" | "AWARD";
        target_completion_date: string;
        task_completed_by: number;
    };
};

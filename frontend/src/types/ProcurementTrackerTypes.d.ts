export type ProcurementTrackerStatus = "ACTIVE" | "INACTIVE" | "COMPLETED";

export type ProcurementTrackerType = "DEFAULT";

export type ProcurementTrackerStepType =
    | "ACQUISITION_PLANNING"
    | "PRE_SOLICITATION"
    | "SOLICITATION"
    | "EVALUATION"
    | "PRE_AWARD"
    | "AWARD";

export type ProcurementTrackerStepStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED";

export type ProcurementTrackerStep = {
    id: number;
    procurement_tracker_id: number;
    step_number: number;
    step_type: ProcurementTrackerStepType;
    status: ProcurementTrackerStepStatus;
    step_start_date?: string | null;
    step_completed_date?: string | null;
};

export type ProcurementTrackerAcquisitionPlanningStep = ProcurementTrackerStep & {
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
};

export type ProcurementTrackerPreSolicitationStep = ProcurementTrackerStep & {
    target_completion_date?: string | null;
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
    draft_solicitation_date?: string | null;
};

export type ProcurementTrackerSolicitationStep = ProcurementTrackerStep & {
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
    solicitation_period_start_date?: string | null;
    solicitation_period_end_date?: string | null;
};

export type ProcurementTrackerEvaluationStep = ProcurementTrackerStep & {
    target_completion_date?: string | null;
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
};

export type ProcurementTrackerPreAwardStep = ProcurementTrackerStep & {
    target_completion_date?: string | null;
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
    // Pre-Award approval request fields (generic names from API)
    approval_requested?: boolean | null;
    approval_requested_date?: string | null;
    approval_requested_by?: number | null;
    requestor_notes?: string | null;
    // Pre-Award approval request fields (model-specific names)
    pre_award_approval_requested?: boolean | null;
    pre_award_approval_requested_date?: string | null;
    pre_award_approval_requested_by?: number | null;
    pre_award_requestor_notes?: string | null;
};

export type ProcurementTrackerResponseStep =
    | ProcurementTrackerStep
    | ProcurementTrackerAcquisitionPlanningStep
    | ProcurementTrackerPreSolicitationStep
    | ProcurementTrackerSolicitationStep
    | ProcurementTrackerEvaluationStep
    | ProcurementTrackerPreAwardStep;

export type ProcurementTracker = {
    id: number;
    agreement_id: number;
    status: ProcurementTrackerStatus;
    procurement_action?: number | null;
    tracker_type: ProcurementTrackerType;
    active_step_number?: number | null;
    steps: ProcurementTrackerResponseStep[];
};

export type ProcurementTrackerStepStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED";

export type ProcurementTrackerStatus = "ACTIVE" | "INACTIVE" | "COMPLETED";

export type ProcurementTrackerType = "DEFAULT";

export type ProcurementTrackerStepType =
    | "ACQUISITION_PLANNING"
    | "PRE_SOLICITATION"
    | "SOLICITATION"
    | "EVALUATION"
    | "PRE_AWARD"
    | "AWARD";

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

export type ProcurementTrackerPreAwardApprovalStatus = "PENDING" | "REQUESTED" | "APPROVED" | "DECLINED" | "CANCELLED";

export type ProcurementTrackerPreAwardStep = ProcurementTrackerStep & {
    target_completion_date?: string | null;
    task_completed_by?: number | null;
    date_completed?: string | null;
    notes?: string | null;
    // Pre-Award approval request fields
    approval_requested?: boolean | null;
    approval_requested_date?: string | null;
    approval_requested_by?: number | null;
    approval_status?: ProcurementTrackerPreAwardApprovalStatus | null;
    requestor_notes?: string | null;
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

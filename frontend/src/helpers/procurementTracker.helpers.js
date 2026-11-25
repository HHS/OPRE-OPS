import {
    PROCUREMENT_STEP_STATUS,
    PROCUREMENT_TRACKER_STATUS
} from "../components/Agreements/ProcurementTracker/ProcurementTracker.constants";

/**
 * Display names for the procurement tracker steps, by step type.
 * @type {Readonly<Record<string, string>>}
 */
export const PROCUREMENT_STEP_LABELS = Object.freeze({
    ACQUISITION_PLANNING: "Acquisition Planning",
    PRE_SOLICITATION: "Pre-Solicitation",
    SOLICITATION: "Solicitation",
    EVALUATION: "Evaluation",
    PRE_AWARD: "Pre-Award",
    AWARD: "Award"
});

/**
 * Every procurement tracker step type, in step-number order (step 1 first).
 * @type {readonly string[]}
 */
export const PROCUREMENT_STEP_ORDER = Object.freeze(Object.keys(PROCUREMENT_STEP_LABELS));

/** The Modification # options a contract mod can use, in order (OPS-5892). */
const MOD_NUMBER_PATTERN = /^P(\d{5})$/;
const MAX_MOD_NUMBER = 20;

/**
 * @typedef {import("../types/ProcurementTrackerTypes").ProcurementTracker} ProcurementTracker
 */

// Newest first; on a tie, an ACTIVE tracker before a COMPLETED one, then the higher id.
const newestFirst = (/** @type {ProcurementTracker} */ a, /** @type {ProcurementTracker} */ b) => {
    const byDate = String(b.created_on ?? "").localeCompare(String(a.created_on ?? ""));
    if (byDate !== 0) return byDate;
    const isActive = (/** @type {ProcurementTracker} */ t) => (t.status === PROCUREMENT_TRACKER_STATUS.ACTIVE ? 1 : 0);
    const byStatus = isActive(b) - isActive(a);
    return byStatus !== 0 ? byStatus : (b.id ?? 0) - (a.id ?? 0);
};

/**
 * Whether a tracker is a contract mod's own procurement cycle (OPS-6513), rather than the
 * agreement's initial award.
 * @param {ProcurementTracker | undefined | null} tracker
 * @returns {boolean}
 */
export const isContractModTracker = (tracker) =>
    tracker?.award_type === "MODIFICATION" && tracker?.agreement_mod_id != null;

/**
 * The tracker the Procurement Tracker tab (and the approval pages reached from it) shows: the most
 * recent one, which is the latest contract mod's once there is one (OPS-6513). Inactive trackers
 * are ignored.
 * @param {ProcurementTracker[] | undefined | null} trackers
 * @returns {ProcurementTracker | undefined}
 */
export const getCurrentProcurementTracker = (trackers) =>
    [...(trackers ?? [])]
        .filter(
            (tracker) =>
                tracker.status === PROCUREMENT_TRACKER_STATUS.ACTIVE ||
                tracker.status === PROCUREMENT_TRACKER_STATUS.COMPLETED
        )
        .sort(newestFirst)[0];

/**
 * The active tracker whose locks apply to the whole agreement: the initial award's. A contract
 * mod's tracker only locks its own budget lines (OPS-6513), so it never drives agreement-level
 * banners or locks.
 * @param {ProcurementTracker[] | undefined | null} trackers
 * @returns {ProcurementTracker | undefined}
 */
export const getAgreementWideActiveTracker = (trackers) =>
    (trackers ?? []).find(
        (tracker) => tracker.status === PROCUREMENT_TRACKER_STATUS.ACTIVE && !isContractModTracker(tracker)
    );

/**
 * The steps this tracker's procurement cycle needs, in order. An As-Is contract mod skips steps
 * 2-4, so it has three (OPS-6513); every other tracker has all six.
 * @param {ProcurementTracker | undefined | null} tracker
 * @returns {ProcurementTracker["steps"]}
 */
export const getRequiredSteps = (tracker) =>
    [...(tracker?.steps ?? [])]
        .filter((step) => step.status !== PROCUREMENT_STEP_STATUS.SKIPPED)
        .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0));

/**
 * The step types this tracker's procurement cycle needs, in order: every type except the ones the
 * tracker marks SKIPPED (steps 2-4 of an As-Is contract mod, OPS-6513). With no tracker, all six.
 * @param {ProcurementTracker | undefined | null} tracker
 * @returns {string[]}
 */
export const getRequiredStepTypes = (tracker) => {
    const skipped = new Set(
        (tracker?.steps ?? [])
            .filter((step) => step.status === PROCUREMENT_STEP_STATUS.SKIPPED)
            .map((step) => step.step_type)
    );
    return PROCUREMENT_STEP_ORDER.filter((stepType) => !skipped.has(stepType));
};

/**
 * The budget lines a tracker covers: a contract mod's own lines, or every line for the initial award.
 * @template {{ id: number }} T
 * @param {ProcurementTracker | undefined | null} tracker
 * @param {T[] | undefined | null} budgetLines
 * @returns {T[]}
 */
export const getTrackerBudgetLines = (tracker, budgetLines) => {
    const lines = budgetLines ?? [];
    if (!isContractModTracker(tracker)) {
        return lines;
    }
    const ids = new Set(tracker?.budget_line_item_ids ?? []);
    return lines.filter((line) => ids.has(line.id));
};

/**
 * The default Modification # for a contract mod's Award step: the number after the highest one
 * already used on the agreement's other trackers (P00001 for the first mod). Returns "" when every
 * number is used, so the user must pick one.
 * @param {ProcurementTracker[] | undefined | null} trackers
 * @param {ProcurementTracker | undefined | null} currentTracker
 * @returns {string}
 */
export const getNextModificationNumber = (trackers, currentTracker) => {
    const used = (trackers ?? [])
        .filter((tracker) => tracker.id !== currentTracker?.id)
        .flatMap((tracker) => tracker.steps ?? [])
        .map((step) => MOD_NUMBER_PATTERN.exec(/** @type {any} */ (step).modification_number ?? ""))
        .filter(Boolean)
        .map((match) => Number(/** @type {RegExpExecArray} */ (match)[1]));
    const next = (used.length ? Math.max(...used) : 0) + 1;
    return next > MAX_MOD_NUMBER ? "" : `P${String(next).padStart(5, "0")}`;
};

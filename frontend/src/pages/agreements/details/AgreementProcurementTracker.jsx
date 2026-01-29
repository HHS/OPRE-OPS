import { useGetProcurementTrackersByAgreementIdQuery } from "../../../api/opsAPI";
import UsersComboBox from "../../../components/Agreements/UsersComboBox";
import DebugCode from "../../../components/DebugCode";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import StepIndicator from "../../../components/UI/StepIndicator";
import TermTag from "../../../components/UI/Term/TermTag";
import { IS_PROCUREMENT_TRACKER_READY } from "../../../constants";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useAgreementProcurementTracker from "./AgreementProcurementTracker.hooks";

/**
 * @typedef {Object} AgreementProcurementTrackerProps
 * @property {import("../../../types/AgreementTypes").Agreement | undefined} agreement - The agreement object containing at least an id
 */

/**
 * @component
 * @param {AgreementProcurementTrackerProps} props
 * @returns {React.ReactElement}
 */

const AgreementProcurementTracker = ({ agreement }) => {
    const agreementId = agreement?.id;
    const {
        isPreSolicitationPackageSent,
        setIsPreSolicitationPackageSent,
        selectedUser,
        setSelectedUser,
        step1DateCompleted,
        setStep1DateCompleted,
        MemoizedDatePicker,
        setStep1Notes,
        step1Notes,
        handleStep1Complete,
        cancelStep1,
        disableStep1Continue,
        STEP_STATUSES
    } = useAgreementProcurementTracker();

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId || !IS_PROCUREMENT_TRACKER_READY,
        refetchOnMountOrArgChange: true
    });

    // Extract tracker data
    const trackers = data?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const step1CompletedByUserName = useGetUserFullNameFromId(
        activeTracker?.steps.find((step) => step.step_number === 1)?.task_completed_by
    );
    const step1DateCompletedLabel = formatDateToMonthDayYear(
        activeTracker?.steps.find((step) => step.step_number === 1)?.date_completed
    );
    const step1NotesLabel = activeTracker?.steps.find((step) => step.step_number === 1)?.notes;

    const wizardSteps = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];

    // Handle loading state
    if (isLoading) {
        return <div>Loading procurement tracker...</div>;
    }

    // Handle error state
    if (isError || !agreementId) {
        return <div>Error loading procurement tracker data</div>;
    }

    if (!IS_PROCUREMENT_TRACKER_READY) {
        return <div>The Procurement Tracker feature is coming soon.</div>;
    }

    if (!activeTracker) {
        // TODO: add inactive procurement tracker
        return <div>No active Procurement Tracker found.</div>;
    }

    // Use active_step_number from tracker if available, otherwise default to 0
    const currentStep = activeTracker?.active_step_number ? activeTracker.active_step_number : 0;

    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Procurement Tracker</h2>
            </div>
            <p className="font-sans-sm margin-bottom-4">
                Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
            </p>
            <StepIndicator
                steps={wizardSteps}
                currentStep={currentStep}
            />
            {/* Accordions */}
            {activeTracker?.steps.length > 0 &&
                activeTracker?.steps?.map((step) => {
                    // TODO : Create separate components for each step type
                    return (
                        <Accordion
                            heading={`Step ${step.step_number} of ${activeTracker?.steps.length} ${step.step_type}`}
                            isClosed={activeTracker.active_step_number !== step.step_number}
                            level={3}
                            key={step.id}
                        >
                            {step.step_number === 1 && step.status === STEP_STATUSES.PENDING && (
                                <fieldset className="usa-fieldset">
                                    <p>
                                        Once the pre-solicitation package is sufficiently drafted and signed by all
                                        parties, send it to the Procurement Shop and check this step as complete.
                                    </p>
                                    <div className="usa-checkbox">
                                        <input
                                            className="usa-checkbox__input"
                                            id="step-1-checkbox"
                                            type="checkbox"
                                            name="step-1-checkbox"
                                            value="step-1-checkbox"
                                            checked={isPreSolicitationPackageSent}
                                            onChange={() =>
                                                setIsPreSolicitationPackageSent(!isPreSolicitationPackageSent)
                                            }
                                        />
                                        <label
                                            className="usa-checkbox__label"
                                            htmlFor="step-1-checkbox"
                                        >
                                            The pre-solicitation package has been sent to the Procurement Shop for
                                            review
                                        </label>
                                    </div>
                                    <UsersComboBox
                                        label={"Task Completed By"}
                                        selectedUser={selectedUser}
                                        setSelectedUser={setSelectedUser}
                                        isDisabled={!isPreSolicitationPackageSent}
                                    />
                                    <MemoizedDatePicker
                                        id="date-completed"
                                        name="dateCompleted"
                                        label="Date Completed"
                                        hint="mm/dd/yyyy"
                                        value={step1DateCompleted}
                                        onChange={(e) => setStep1DateCompleted(e.target.value)}
                                        isDisabled={!isPreSolicitationPackageSent}
                                        maxDate={new Date()}
                                    />
                                    <TextArea
                                        name="notes"
                                        label="Notes (optional)"
                                        className="margin-top-0"
                                        maxLength={750}
                                        value={step1Notes}
                                        onChange={(_, value) => setStep1Notes(value)}
                                        isDisabled={!isPreSolicitationPackageSent}
                                    />
                                    <button
                                        className="usa-button usa-button--unstyled margin-right-2"
                                        data-cy="cancel-button"
                                        onClick={cancelStep1}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="usa-button"
                                        data-cy="continue-btn"
                                        onClick={() => handleStep1Complete(step.id)}
                                        disabled={disableStep1Continue}
                                    >
                                        Complete Step 1
                                    </button>
                                </fieldset>
                            )}
                            {step.step_number === 1 && step.status === STEP_STATUSES.COMPLETED && (
                                <div>
                                    <p>
                                        When the pre-solicitation package has been sufficiently drafted and signed by
                                        all parties, send it to the Procurement Shop and update the task below.
                                    </p>
                                    <p>The pre-solicitation package has been sent to the Procurement Shop for review</p>

                                    <dl>
                                        <TermTag
                                            term="Completed By"
                                            description={step1CompletedByUserName}
                                        />
                                        <TermTag
                                            term="Date Completed"
                                            description={step1DateCompletedLabel}
                                        />
                                        <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                                        <dd className="margin-0 margin-top-1">{step1NotesLabel}</dd>
                                    </dl>
                                </div>
                            )}
                        </Accordion>
                    );
                })}
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;

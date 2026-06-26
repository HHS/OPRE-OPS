import React from "react";
import { useGetProcurementTrackersByAgreementIdQuery, useGetUsersQuery } from "../../../api/opsAPI";
import ProcurementTrackerStepOne from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepOne";
import ProcurementTrackerStepTwo from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepTwo";
import ProcurementTrackerStepThree from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepThree";
import ProcurementTrackerStepFour from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepFour";
import ProcurementTrackerStepFive from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepFive";
import ProcurementTrackerStepSix from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepSix";
import StepBuilderAccordion from "../../../components/Agreements/ProcurementTracker/StepBuilderAccordion";
import StepIndicator from "../../../components/UI/StepIndicator";
import { IS_PROCUREMENT_TRACKER_READY_MAP } from "../../../constants";
import { useIsUserSuperUser, useIsUserOnlyProcurementTeam } from "../../../hooks/user.hooks";

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
    const WIZARD_STEPS = [
        "Acquisition Planning",
        "Pre-Solicitation",
        "Solicitation",
        "Evaluation",
        "Pre-Award",
        "Award"
    ];
    const [completedStepNumber, setCompletedStepNumber] = React.useState(null);
    const completedStepRef = React.useRef(null);

    const handleSetCompletedStepNumber = (stepNumber) => {
        setCompletedStepNumber(stepNumber);
    };

    // After accordions remount, scroll to the completed step
    React.useEffect(() => {
        if (completedStepNumber !== null && completedStepRef.current) {
            // Wait for USWDS to finish all its scrollIntoView calls
            const timeoutId = setTimeout(() => {
                if (completedStepRef.current) {
                    completedStepRef.current.scrollIntoView({ behavior: "auto", block: "nearest" });
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [completedStepNumber]);

    const agreementId = agreement?.id;

    const isSuperUser = useIsUserSuperUser();
    const isProcurementTeamOnly = useIsUserOnlyProcurementTeam();
    const isEditable = isSuperUser || (agreement?._meta?.isEditable ?? false);
    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });

    // Fetch all users for filtering
    const { data: allUsers } = useGetUsersQuery({ excludeReadOnlyUsers: true });

    // Filter users by authorized_user_ids from the agreement (shared across all steps)
    const authorizedUsers = React.useMemo(() => {
        if (!allUsers || !agreement?.authorized_user_ids) {
            return [];
        }
        return allUsers.filter((user) => agreement.authorized_user_ids.includes(user.id));
    }, [allUsers, agreement?.authorized_user_ids]);

    // Extract tracker data
    const trackers = data?.data || [];
    const activeTracker = trackers.find((tracker) => tracker.status === "ACTIVE");
    const completedTracker = trackers.find((tracker) => tracker.status === "COMPLETED");
    const displayTracker = activeTracker || completedTracker;
    const hasActiveTracker = !!activeTracker;
    const hasCompletedTracker = !!completedTracker;

    // Use displayTracker for step data (shows completed tracker data after final step completion)
    const stepOneData = displayTracker?.steps.find((step) => step.step_number === 1);
    const stepTwoData = displayTracker?.steps.find((step) => step.step_number === 2);

    // Single source of truth for all steps - disable editing if no active tracker OR not editable
    const isStepDisabled = !hasActiveTracker || !isEditable;
    const stepThreeData = displayTracker?.steps.find((step) => step.step_number === 3);
    const stepFourData = displayTracker?.steps.find((step) => step.step_number === 4);
    const stepFiveData = displayTracker?.steps.find((step) => step.step_number === 5);

    // Handle loading state
    if (isLoading) {
        return <div>Loading procurement tracker...</div>;
    }

    // Handle error state
    if (isError || !agreementId) {
        return <div>Error loading procurement tracker data</div>;
    }

    // Determine current step based on tracker state:
    // - Active tracker: use active_step_number (defaults to 1 if not set)
    // - Completed tracker: show step 6 (final step)
    // - No tracker: default to step 1
    const currentStep = hasActiveTracker
        ? activeTracker.active_step_number || 1
        : hasCompletedTracker
            ? 6
            : 1;

    // Accordion behavior: open the current step
    const accordionOpenStep = currentStep;

    // Step indicator: show progress based on tracker state
    // - Active tracker: highlight current step
    // - Completed tracker: show all steps complete (step 6)
    // - No tracker: no active segment (0)
    const indicatorCurrentStep = hasActiveTracker ? currentStep : hasCompletedTracker ? 6 : 0;

    const sortedSteps = [...(displayTracker?.steps || [])].sort(
        (a, b) => (a?.step_number ?? Number.MAX_SAFE_INTEGER) - (b?.step_number ?? Number.MAX_SAFE_INTEGER)
    );

    // Create default steps structure when there's no tracker at all
    const defaultSteps = WIZARD_STEPS.map((stepName, index) => ({
        id: `default-step-${index + 1}`,
        step_number: index + 1,
        step_type: stepName,
        status: "PENDING"
    }));

    // Use displayTracker steps when available (ACTIVE or COMPLETED), otherwise default
    const stepsToRender = displayTracker ? sortedSteps : defaultSteps;

    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">Procurement Tracker</h2>
            </div>
            <p className="font-sans-sm margin-bottom-4">
                Follow the steps below to complete the procurement process for Budget Lines in Executing Status.
            </p>
            <StepIndicator
                steps={WIZARD_STEPS}
                currentStep={indicatorCurrentStep}
            />
            {stepsToRender.map((step) => {
                const isCompletedStep = step.step_number === completedStepNumber;
                return (
                    <StepBuilderAccordion
                        ref={isCompletedStep ? completedStepRef : null}
                        step={step}
                        totalSteps={WIZARD_STEPS.length}
                        activeStepNumber={hasActiveTracker ? currentStep : undefined}
                        isReadOnly={!hasActiveTracker || isProcurementTeamOnly}
                        // Keep the completed step and active step open after form submission, all others closed
                        isClosed={
                            completedStepNumber !== null
                                ? !(step.step_number === completedStepNumber || step.step_number === accordionOpenStep)
                                : step.step_number !== accordionOpenStep
                        }
                        level={3}
                        // Key includes state that affects which accordion should be open.
                        // Since Accordion is an uncontrolled component, we need to force a remount
                        // when the active/completed step changes to reset the initial state.
                        key={`${step.id}-${completedStepNumber}-${accordionOpenStep}`}
                    >
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_1 && step.step_number === 1 && (
                            <ProcurementTrackerStepOne
                                stepStatus={step.status}
                                stepOneData={stepOneData}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                authorizedUsers={authorizedUsers}
                                isDisabled={isStepDisabled}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_2 && step.step_number === 2 && (
                            <ProcurementTrackerStepTwo
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepTwoData={stepTwoData}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                isDisabled={isStepDisabled}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                        {!IS_PROCUREMENT_TRACKER_READY_MAP.STEP_2 && step.step_number === 2 && (
                            <div className="usa-fieldset">
                                <p>
                                    Edit the pre-solicitation package in collaboration with the Procurement Shop. Once
                                    the documents are finalized, go to the Documents Tab, upload the final and signed
                                    versions, and check this step as complete. If you have a target completion date for
                                    when the package will be finalized, enter it below.
                                </p>
                            </div>
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_3 && step.step_number === 3 && (
                            <ProcurementTrackerStepThree
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepThreeData={stepThreeData}
                                isDisabled={isStepDisabled}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                        {!IS_PROCUREMENT_TRACKER_READY_MAP.STEP_3 && step.step_number === 3 && (
                            <div className="usa-fieldset">
                                <p>
                                    Once the Procurement Shop has posted the Solicitation and it is on the street, enter
                                    the Solicitation Start and End Dates. After all proposals are received, vendor
                                    questions have been answered, and evaluations are starting, check this step as
                                    complete.
                                </p>
                            </div>
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_4 && step.step_number === 4 && (
                            <ProcurementTrackerStepFour
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepFourData={stepFourData}
                                isDisabled={isStepDisabled}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                        {!IS_PROCUREMENT_TRACKER_READY_MAP.STEP_4 && step.step_number === 4 && (
                            <div className="usa-fieldset">
                                <p>
                                    Complete the technical evaluations and any potential negotiations. If you have a
                                    target completion date for when evaluations will be complete, enter it below. Once
                                    you internally select a vendor check this task as complete (Internally means
                                    internal to OPRE, before you send the Final Consensus Memo to the Procurement Shop).
                                </p>
                            </div>
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_5 && step.step_number === 5 && (
                            <ProcurementTrackerStepFive
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepFiveData={stepFiveData}
                                isDisabled={isStepDisabled}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                agreementId={agreement?.id}
                                budgetLineItems={agreement?.budget_line_items}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                        {!IS_PROCUREMENT_TRACKER_READY_MAP.STEP_5 && step.step_number === 5 && (
                            <div className="usa-fieldset">
                                <p>
                                    All agreements need Pre-Award Approval before the Final Consensus Memo can be sent
                                    to the Procurement Shop. Review the Vendor Price Sheet and make any edits or budget
                                    line status changes as needed. After final edits are approved by the Division
                                    Director(s), come back here and click Request Pre-Award Approval. Once you receive
                                    Pre-Award Approval, check this step as complete. If you have a target completion
                                    date for when the Final Consensus Memo will be sent, enter it below.
                                </p>
                            </div>
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_6 && step.step_number === 6 && (
                            <ProcurementTrackerStepSix
                                stepStatus={step.status}
                                stepSixData={step}
                                authorizedUsers={authorizedUsers}
                                isDisabled={isStepDisabled}
                                isActiveStep={hasActiveTracker && activeTracker.active_step_number === step.step_number}
                                agreementId={agreement?.id}
                                budgetLineItems={agreement?.budget_line_items}
                                handleSetCompletedStepNumber={handleSetCompletedStepNumber}
                                isReadOnly={isProcurementTeamOnly}
                            />
                        )}
                    </StepBuilderAccordion>
                );
            })}
        </>
    );
};

export default AgreementProcurementTracker;

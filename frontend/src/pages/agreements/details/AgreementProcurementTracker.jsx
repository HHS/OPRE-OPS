import React from "react";
import { useGetProcurementTrackersByAgreementIdQuery, useGetUsersQuery } from "../../../api/opsAPI";
import ProcurementTrackerStepOne from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepOne";
import ProcurementTrackerStepTwo from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepTwo";
import StepBuilderAccordion from "../../../components/Agreements/ProcurementTracker/StepBuilderAccordion";
import DebugCode from "../../../components/DebugCode";
import StepIndicator from "../../../components/UI/StepIndicator";
import { IS_PROCUREMENT_TRACKER_READY_MAP } from "../../../constants";
import ProcurementTrackerStepThree from "../../../components/Agreements/ProcurementTracker/ProcurementTrackerStepThree";

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
    const [isFormSubmitted, setIsFormSubmitted] = React.useState(false);
    const handleSetIsFormSubmitted = (value) => {
        setIsFormSubmitted(value);
    };
    const agreementId = agreement?.id;

    const { data, isLoading, isError } = useGetProcurementTrackersByAgreementIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });

    // Fetch all users for filtering
    const { data: allUsers } = useGetUsersQuery({});

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
    const hasActiveTracker = !!activeTracker;
    const stepOneData = activeTracker?.steps.find((step) => step.step_number === 1);
    const stepTwoData = activeTracker?.steps.find((step) => step.step_number === 2);
    const stepThreeData = activeTracker?.steps.find((step) => step.step_number === 3);

    // Handle loading state
    if (isLoading) {
        return <div>Loading procurement tracker...</div>;
    }

    // Handle error state
    if (isError || !agreementId) {
        return <div>Error loading procurement tracker data</div>;
    }

    // Active trackers default to step 1 when no active_step_number exists.
    const currentStep = activeTracker?.active_step_number ? activeTracker.active_step_number : 1;
    // Keep step 1 open for read-only/no-active-tracker mode, but don't show any active segment in the step indicator.
    const accordionOpenStep = hasActiveTracker ? currentStep : 1;
    const indicatorCurrentStep = hasActiveTracker ? currentStep : 0;
    const sortedActiveSteps = [...(activeTracker?.steps || [])].sort(
        (a, b) => (a?.step_number ?? Number.MAX_SAFE_INTEGER) - (b?.step_number ?? Number.MAX_SAFE_INTEGER)
    );

    // Create default steps structure when there's no active tracker
    const defaultSteps = WIZARD_STEPS.map((stepName, index) => ({
        id: `default-step-${index + 1}`,
        step_number: index + 1,
        step_type: stepName,
        status: "PENDING"
    }));

    // Use sorted active tracker steps when present, otherwise use default read-only structure.
    const stepsToRender = hasActiveTracker ? sortedActiveSteps : defaultSteps;

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
                return (
                    <StepBuilderAccordion
                        step={step}
                        totalSteps={WIZARD_STEPS.length}
                        activeStepNumber={hasActiveTracker ? currentStep : undefined}
                        isReadOnly={!hasActiveTracker}
                        // Keep step 1 and the active step open after form submission, all others closed
                        isClosed={
                            isFormSubmitted
                                ? !(step.step_number === 1 || step.step_number === accordionOpenStep)
                                : step.step_number !== accordionOpenStep
                        }
                        level={3}
                        key={step.id}
                    >
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_1 && step.step_number === 1 && (
                            <ProcurementTrackerStepOne
                                stepStatus={step.status}
                                stepOneData={stepOneData}
                                hasActiveTracker={hasActiveTracker}
                                handleSetIsFormSubmitted={handleSetIsFormSubmitted}
                                authorizedUsers={authorizedUsers}
                            />
                        )}
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_2 && step.step_number === 2 && (
                            <ProcurementTrackerStepTwo
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepTwoData={stepTwoData}
                                hasActiveTracker={hasActiveTracker}
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
                        {IS_PROCUREMENT_TRACKER_READY_MAP.STEP_3 && step.step_number === 3 ? (
                            <ProcurementTrackerStepThree
                                stepStatus={step.status}
                                authorizedUsers={authorizedUsers}
                                stepThreeData={stepThreeData}
                                isActiveStep={currentStep === step.step_number}
                                handleSetCompletedStepNumber={() => {}}
                            />
                        ) : (
                            step.step_number === 3 && (
                                <div className="usa-fieldset">
                                    <p>
                                        Once the Procurement Shop has posted the Solicitation and it’s “on the street”,
                                        enter the Solicitation Start and End Dates. After all proposals are received,
                                        vendor questions have been answered, and evaluations are starting, check this
                                        step as complete.
                                    </p>
                                </div>
                            )
                        )}
                        {step.step_number === 4 && (
                            <div className="usa-fieldset">
                                <p>
                                    Complete the technical evaluations and any potential negotiations. If you have a
                                    target completion date for when evaluations will be complete, enter it below. Once
                                    you internally select a vendor check this task as complete (Internally means
                                    internal to OPRE, before you send the Final Consensus Memo to the Procurement Shop).
                                </p>
                            </div>
                        )}
                        {step.step_number === 5 && (
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
                        {step.step_number === 6 && (
                            <div className="usa-fieldset">
                                <p>
                                    Once you receive the signed award, click Request Award Approval below. During this
                                    process you will upload the award document, add CLINs, and update the Vendor and
                                    Vendor Type. The budget team will review everything has been entered correctly
                                    before changing the agreement to Awarded in OPS. Enter the Target Completion Date as
                                    the date you expect to receive the signed award, and once you Request Award
                                    Approval, check this step as complete.
                                </p>
                            </div>
                        )}
                    </StepBuilderAccordion>
                );
            })}
            {activeTracker && <DebugCode data={activeTracker}></DebugCode>}
        </>
    );
};

export default AgreementProcurementTracker;

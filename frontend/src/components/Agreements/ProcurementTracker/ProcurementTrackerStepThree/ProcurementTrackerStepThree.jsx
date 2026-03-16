import { getLocalISODate } from "../../../../helpers/utils";
import ConfirmationModal from "../../../UI/Modals/ConfirmationModal";
import TermTag from "../../../UI/Term/TermTag";
import TextArea from "../../../UI/Form/TextArea";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepThree from "./ProcurementTrackerStepThree.hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 * @typedef {import("../../../../types/ProcurementTrackerTypes").ProcurementTrackerSolicitationStep} ProcurementTrackerSolicitationStep
 */

/**
 * @typedef {Object} ProcurementTrackerStepThreeProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {ProcurementTrackerSolicitationStep} stepThreeData - The data for step 3 of the procurement tracker
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} isDisabled - Whether step controls should be disabled
 * @property {Function} handleSetCompletedStepNumber - Callback to update completed step state
 * @property {boolean} isActiveStep - Whether this is the currently active step
 * @property {boolean} [isReadOnly] - Whether to render in read-only mode (plain text, no form controls)
 */

/**
 * @component
 * @param {ProcurementTrackerStepThreeProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepThree = ({
    stepStatus,
    stepThreeData,
    authorizedUsers,
    isDisabled,
    handleSetCompletedStepNumber,
    isActiveStep,
    isReadOnly = false
}) => {
    const {
        selectedUser,
        setSelectedUser,
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
        handleSolicitationDatesSubmit,
        handleStep3Complete
        // @ts-expect-error - stepThreeData may be undefined but hook handles it
    } = useProcurementTrackerStepThree(stepThreeData, handleSetCompletedStepNumber);

    // Check if solicitation dates exist (either saved or entered)
    const hasSavedSolicitationDates =
        !!stepThreeData?.solicitation_period_start_date && !!stepThreeData?.solicitation_period_end_date;

    const hasEnteredSolicitationDates = !!solicitationPeriodStartDate && !!solicitationPeriodEndDate;

    const missingSolicitationDates = !hasSavedSolicitationDates && !hasEnteredSolicitationDates;

    const disableStep3Buttons =
        isDisabled ||
        !isSolicitationClosed ||
        !selectedUser?.id ||
        !step3DateCompleted ||
        validatorRes.hasErrors() ||
        missingSolicitationDates ||
        !stepThreeData?.id;

    const isSolicitationDatesSaveDisabled =
        isDisabled ||
        validatorRes.hasErrors("solicitationPeriodStartDate") ||
        validatorRes.hasErrors("solicitationPeriodEndDate") ||
        !solicitationPeriodStartDate ||
        !solicitationPeriodEndDate;

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    setShowModal={setShowModal}
                />
            )}
            {isReadOnly && (
                <div>
                    <p>
                        Once the Procurement Shop has posted the Solicitation and it&apos;s &quot;on the street&quot;,
                        enter the Solicitation Start and End Dates. After all proposals are received, vendor questions
                        have been answered, and evaluations are starting, check this step as complete.
                    </p>
                    {stepStatus === "COMPLETED" && (
                        <div className="display-flex flex-align-center margin-top-5">
                            <FontAwesomeIcon
                                icon={faCircleCheck}
                                size="lg"
                                className="margin-right-1 flex-shrink-0 text-primary-darker"
                                aria-hidden="true"
                            />
                            <p className="margin-y-0">
                                The Solicitation is closed to vendors, vendor questions have been answered, and
                                evaluations can start
                            </p>
                        </div>
                    )}
                    <dl className="display-flex flex-wrap">
                        <TermTag
                            term="Solicitation Period - Start"
                            description={solicitationStartDateLabel || "TBD"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Solicitation Period - End"
                            description={solicitationEndDateLabel || "TBD"}
                        />
                        <TermTag
                            term="Completed By"
                            description={step3CompletedByUserName || "TBD"}
                            className="margin-right-4"
                        />
                        <TermTag
                            term="Date Completed"
                            description={step3DateCompletedLabel || "TBD"}
                        />
                        <div className="width-full">
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step3NotesLabel || "None"}</dd>
                        </div>
                    </dl>
                </div>
            )}
            {!isReadOnly && stepStatus === "PENDING" && (
                <fieldset className="usa-fieldset">
                    <p>
                        Once the Procurement Shop has posted the Solicitation and it’s “on the street”, enter the
                        Solicitation Start and End Dates. After all proposals are received, vendor questions have been
                        answered, and evaluations are starting, check this step as complete.
                    </p>
                    <div className="display-flex flex-align-end margin-bottom-2">
                        {stepThreeData?.solicitation_period_start_date &&
                        stepThreeData?.solicitation_period_end_date ? (
                            <div className="display-flex">
                                <TermTag
                                    term="Solicitation Period - Start"
                                    description={solicitationStartDateLabel}
                                    className="margin-right-4"
                                />
                                <TermTag
                                    term="Solicitation Period - End"
                                    description={solicitationEndDateLabel}
                                />
                            </div>
                        ) : (
                            <div className="display-flex flex-align-end width-tablet">
                                <MemoizedDatePicker
                                    id="solicitation-period-start-date"
                                    name="solicitationPeriodStartDate"
                                    label="Solicitation Period - Start"
                                    hint="mm/dd/yyyy"
                                    value={solicitationPeriodStartDate}
                                    messages={validatorRes.getErrors("solicitationPeriodStartDate") || []}
                                    onChange={(/** @type {any} */ e) => {
                                        const nextStartDate = e.target.value;
                                        runValidate("solicitationPeriodStartDate", nextStartDate);
                                        runValidate("solicitationPeriodEndDate", solicitationPeriodEndDate, {
                                            solicitationPeriodStartDate: nextStartDate
                                        });
                                        setSolicitationPeriodStartDate(nextStartDate);
                                    }}
                                    isDisabled={isDisabled}
                                />

                                <MemoizedDatePicker
                                    id="solicitation-period-end-date"
                                    name="solicitationPeriodEndDate"
                                    className="margin-left-3"
                                    label="Solicitation Period - End"
                                    hint="mm/dd/yyyy"
                                    value={solicitationPeriodEndDate}
                                    messages={validatorRes.getErrors("solicitationPeriodEndDate") || []}
                                    onChange={(/** @type {any} */ e) => {
                                        const nextEndDate = e.target.value;
                                        runValidate("solicitationPeriodEndDate", nextEndDate);
                                        setSolicitationPeriodEndDate(nextEndDate);
                                    }}
                                    isDisabled={isDisabled}
                                />

                                <button
                                    className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                                    data-cy="solicitation-dates-save-btn"
                                    disabled={isSolicitationDatesSaveDisabled || !stepThreeData?.id}
                                    onClick={() => {
                                        if (!stepThreeData?.id) {
                                            window.alert(
                                                "Unable to save solicitation dates because this tracker step is not initialized."
                                            );
                                            return;
                                        }
                                        handleSolicitationDatesSubmit(stepThreeData.id);
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="usa-checkbox margin-top-3">
                        <input
                            className="usa-checkbox__input"
                            id="step-3-checkbox"
                            type="checkbox"
                            name="step-3-checkbox"
                            value="step-3-checkbox"
                            checked={isSolicitationClosed}
                            onChange={() => setIsSolicitationClosed(!isSolicitationClosed)}
                            disabled={isDisabled || !isActiveStep}
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor="step-3-checkbox"
                        >
                            The Solicitation is closed to vendors, vendor questions have been answered, and evaluations
                            can start
                        </label>
                    </div>
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            users={authorizedUsers}
                            isDisabled={isDisabled || !isSolicitationClosed}
                            messages={validatorRes.getErrors("users") || []}
                            onChange={(/** @type {string} */ name, /** @type {any} */ value) => {
                                runValidate(name, value);
                            }}
                        />

                        <MemoizedDatePicker
                            id="step-3-date-completed"
                            name="dateCompleted"
                            className="margin-left-4"
                            label="Date Completed"
                            hint="mm/dd/yyyy"
                            value={step3DateCompleted}
                            messages={validatorRes.getErrors("dateCompleted") || []}
                            onChange={(/** @type {any} */ e) => {
                                runValidate("dateCompleted", e.target.value);
                                setStep3DateCompleted(e.target.value);
                            }}
                            maxDate={getLocalISODate()}
                            isDisabled={isDisabled || !isSolicitationClosed}
                        />
                    </div>

                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step3Notes}
                        onChange={(_, value) => setStep3Notes(value)}
                        isDisabled={isDisabled || !isSolicitationClosed}
                    />

                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            onClick={cancelModalStep3}
                            disabled={isDisabled || !isSolicitationClosed}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button"
                            data-cy="continue-btn"
                            onClick={() => {
                                if (!stepThreeData?.id) {
                                    window.alert(
                                        "Unable to complete step because this tracker step is not initialized."
                                    );
                                    return;
                                }
                                handleStep3Complete(stepThreeData.id);
                            }}
                            disabled={disableStep3Buttons}
                        >
                            Complete Step 3
                        </button>
                    </div>
                </fieldset>
            )}

            {!isReadOnly && stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        The Procurement Shop posts the solicitation on the street for vendors to respond. Track the
                        solicitation period dates and update when the posting is complete. Solicitation documents should
                        be uploaded to the Documents Tab.
                    </p>
                    <div className="display-flex flex-align-center margin-top-5">
                        <FontAwesomeIcon
                            icon={faCircleCheck}
                            size="lg"
                            className="margin-right-1 flex-shrink-0 text-primary-darker"
                            aria-hidden="true"
                        />
                        <p className="margin-y-0">
                            The Solicitation is closed to vendors, vendor questions have been answered, and evaluations
                            can start
                        </p>
                    </div>
                    <dl
                        style={{
                            display: "inline-grid",
                            gridTemplateColumns: "auto auto",
                            columnGap: "2rem"
                        }}
                    >
                        <TermTag
                            term="Solicitation Period - Start"
                            description={solicitationStartDateLabel ?? undefined}
                        />
                        <TermTag
                            term="Solicitation Period - End"
                            description={solicitationEndDateLabel ?? undefined}
                        />
                        <TermTag
                            term="Completed By"
                            description={step3CompletedByUserName ?? undefined}
                        />
                        <TermTag
                            term="Date Completed"
                            description={step3DateCompletedLabel ?? undefined}
                        />
                        <div style={{ gridColumn: "1 / -1" }}>
                            <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                            <dd className="margin-0 margin-top-1">{step3NotesLabel}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepThree;

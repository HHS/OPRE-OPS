import { getLocalISODate } from "../../../../helpers/utils";
import TermTag from "../../../UI/Term/TermTag";
import TextArea from "../../../UI/Form/TextArea";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepThree from "./ProcurementTrackerStepThree.hooks";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 */

/**
 * @typedef {Object} ProcurementTrackerStepThreeProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepThreeData - The data for step 3 of the procurement tracker
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} hasActiveTracker - Whether an active tracker exists
 */

/**
 * @component
 * @param {ProcurementTrackerStepThreeProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepThree = ({ stepStatus, stepThreeData, authorizedUsers, hasActiveTracker }) => {
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
        MemoizedDatePicker
        // @ts-expect-error - stepThreeData may be undefined but hook handles it
    } = useProcurementTrackerStepThree(stepThreeData);

    return (
        <>
            {(stepStatus === "PENDING" || stepStatus === "ACTIVE") && (
                <fieldset className="usa-fieldset">
                    <p>
                        The Procurement Shop posts the solicitation on the street for vendors to respond. Track the
                        solicitation period dates and update when the posting is complete. Solicitation documents should
                        be uploaded to the Documents Tab.
                    </p>
                    <div className="display-flex flex-justify width-tablet">
                        <div style={{ width: "275px" }}>
                            <MemoizedDatePicker
                                id="solicitation-period-start-date"
                                name="solicitationPeriodStartDate"
                                className="width-card-lg"
                                label="Solicitation Period Start Date"
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
                                isDisabled={!hasActiveTracker}
                            />
                        </div>
                        <div style={{ width: "275px" }}>
                            <MemoizedDatePicker
                                id="solicitation-period-end-date"
                                name="solicitationPeriodEndDate"
                                className="margin-left-4"
                                label="Solicitation Period End Date"
                                hint="mm/dd/yyyy"
                                value={solicitationPeriodEndDate}
                                messages={validatorRes.getErrors("solicitationPeriodEndDate") || []}
                                onChange={(/** @type {any} */ e) => {
                                    const nextEndDate = e.target.value;
                                    runValidate("solicitationPeriodEndDate", nextEndDate);
                                    setSolicitationPeriodEndDate(nextEndDate);
                                }}
                                isDisabled={!hasActiveTracker}
                            />
                        </div>
                        <button
                            className="usa-button usa-button--unstyled flex-align-self-end padding-bottom-1"
                            data-cy="target-completion-save-btn"
                            disabled={false}
                            onClick={() => {
                                alert("Save button clicked! Implement save functionality here.");
                            }}
                        >
                            Save
                        </button>
                    </div>
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            users={authorizedUsers}
                            isDisabled={!hasActiveTracker}
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
                            isDisabled={!hasActiveTracker}
                        />
                    </div>

                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step3Notes}
                        onChange={(/** @type {any} */ _, /** @type {string} */ value) => setStep3Notes(value)}
                        isDisabled={!hasActiveTracker}
                    />
                </fieldset>
            )}

            {stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        The Procurement Shop posts the solicitation on the street for vendors to respond. Track the
                        solicitation period dates and update when the posting is complete. Solicitation documents should
                        be uploaded to the Documents Tab.
                    </p>
                    <dl>
                        <TermTag
                            term="Completed By"
                            description={step3CompletedByUserName}
                        />
                        <TermTag
                            term="Date Completed"
                            description={step3DateCompletedLabel}
                        />
                        <TermTag
                            term="Solicitation Period Start Date"
                            description={solicitationStartDateLabel}
                        />
                        <TermTag
                            term="Solicitation Period End Date"
                            description={solicitationEndDateLabel}
                        />
                        <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                        <dd className="margin-0 margin-top-1">{step3NotesLabel}</dd>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepThree;

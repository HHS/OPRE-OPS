import { getLocalISODate } from "../../../../helpers/utils";
import TermTag from "../../../UI/Term/TermTag";
import TextArea from "../../../UI/Form/TextArea";
import UsersComboBox from "../../UsersComboBox";
import useProcurementTrackerStepTwo from "./ProcurementTrackerStepTwo.hooks";

/**
 * @typedef {import("../../../../types/UserTypes").SafeUser} SafeUser
 */

/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {string} stepStatus - The current status of the procurement tracker step
 * @property {Object} stepTwoData - The data for step 2 of the procurement tracker
 * @property {SafeUser[]} authorizedUsers - List of users authorized for this agreement
 * @property {boolean} hasActiveTracker - Whether an active tracker exists
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */
const ProcurementTrackerStepTwo = ({ stepStatus, stepTwoData, authorizedUsers, hasActiveTracker }) => {
    const {
        cancelStepTwo,
        isPreSolicitationPackageFinalized,
        setIsPreSolicitationPackageFinalized,
        draftSolicitationDate,
        setDraftSolicitationDate,
        selectedUser,
        setSelectedUser,
        setTargetCompletionDate,
        targetCompletionDate,
        step2CompletedByUserName,
        step2DateCompleted,
        setStep2DateCompleted,
        step2Notes,
        setStep2Notes,
        step2NotesLabel,
        runValidate,
        validatorRes,
        step2DateCompletedLabel,
        MemoizedDatePicker,
        handleTargetCompletionDateSubmit,
        step2TargetCompletionDateLabel
    } = useProcurementTrackerStepTwo(stepTwoData);

    return (
        <>
            {(stepStatus === "PENDING" || stepStatus === "ACTIVE") && (
                <fieldset className="usa-fieldset">
                    <p>
                        Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents
                        are finalized, go to the Documents Tab, upload the final and signed versions, and check this
                        step as complete. If you have a target completion date for when the package will be finalized,
                        enter it below.
                    </p>

                    {/* TODO: Add save functionality for target completion date */}
                    <div className="display-flex flex-align-end">
                        {stepTwoData?.target_completion_date ? (
                            <TermTag
                                term="Target Completion Date"
                                description={step2TargetCompletionDateLabel}
                            />
                        ) : (
                            <>
                                <MemoizedDatePicker
                                    id="target-completion-date"
                                    name="targetCompletionDate"
                                    label="Target Completion Date"
                                    messages={validatorRes.getErrors("targetCompletionDate") || []}
                                    hint="mm/dd/yyyy"
                                    value={targetCompletionDate}
                                    onChange={(e) => {
                                        runValidate("targetCompletionDate", e.target.value);
                                        setTargetCompletionDate(e.target.value);
                                    }}
                                    minDate={getLocalISODate()}
                                    isDisabled={stepStatus !== "ACTIVE" || !hasActiveTracker}
                                />
                                <button
                                    className="usa-button usa-button--unstyled margin-bottom-1 margin-left-2"
                                    data-cy="target-completion-save-btn"
                                    disabled={validatorRes.hasErrors("targetCompletionDate")}
                                    onClick={() => {
                                        handleTargetCompletionDateSubmit(stepTwoData?.id);
                                    }}
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                    <div className="usa-checkbox">
                        <input
                            className="usa-checkbox__input"
                            id="step-2-checkbox"
                            type="checkbox"
                            name="step-2-checkbox"
                            value="step-2-checkbox"
                            checked={isPreSolicitationPackageFinalized}
                            onChange={() => setIsPreSolicitationPackageFinalized(!isPreSolicitationPackageFinalized)}
                            disabled={!hasActiveTracker}
                        />
                        <label
                            className="usa-checkbox__label"
                            htmlFor="step-2-checkbox"
                        >
                            The pre-solicitation package has been sent to the Procurement Shop for review
                        </label>
                    </div>
                    <div className="display-flex flex-align-center">
                        <UsersComboBox
                            className="width-card-lg margin-top-5"
                            label={"Task Completed By"}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            users={authorizedUsers}
                            isDisabled={!isPreSolicitationPackageFinalized || authorizedUsers.length === 0}
                            messages={validatorRes.getErrors("users") || []}
                            onChange={(name, value) => {
                                runValidate(name, value);
                            }}
                        />

                        <MemoizedDatePicker
                            id="step-2-date-completed"
                            name="dateCompleted"
                            className="margin-left-4"
                            label="Date Completed"
                            hint="mm/dd/yyyy"
                            value={step2DateCompleted}
                            messages={validatorRes.getErrors("dateCompleted") || []}
                            onChange={(e) => {
                                runValidate("dateCompleted", e.target.value);
                                setStep2DateCompleted(e.target.value);
                            }}
                            maxDate={getLocalISODate()}
                            isDisabled={!isPreSolicitationPackageFinalized}
                        />
                    </div>
                    <TextArea
                        name="notes"
                        label="Notes (optional)"
                        className="margin-top-2"
                        maxLength={750}
                        value={step2Notes}
                        onChange={(_, value) => setStep2Notes(value)}
                        isDisabled={!isPreSolicitationPackageFinalized}
                    />
                    <p>After the package is finalized, enter the Draft Solicitation date below (if applicable).</p>
                    <MemoizedDatePicker
                        id="step-2-draft-solicitation-date"
                        name="draftSolicitationDate"
                        className=""
                        label="Draft Solicitation Date (optional)"
                        hint="mm/dd/yyyy"
                        value={draftSolicitationDate}
                        messages={validatorRes.getErrors("draftSolicitationDate") || []}
                        onChange={(e) => {
                            runValidate("draftSolicitationDate", e.target.value);
                            setDraftSolicitationDate(e.target.value);
                        }}
                        isDisabled={!isPreSolicitationPackageFinalized}
                    />
                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            onClick={cancelStepTwo}
                            disabled={!isPreSolicitationPackageFinalized}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button"
                            data-cy="continue-btn"
                            onClick={() => {}}
                            disabled={!isPreSolicitationPackageFinalized}
                        >
                            Complete Step 2
                        </button>
                    </div>
                </fieldset>
            )}

            {stepStatus === "COMPLETED" && (
                <div>
                    <p>
                        Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents
                        are finalized, go to the Documents Tab, upload the final and signed versions, and update the
                        task below.
                    </p>
                    <dl>
                        <TermTag
                            term="Completed By"
                            description={step2CompletedByUserName}
                        />
                        <TermTag
                            term="Date Completed"
                            description={step2DateCompletedLabel}
                        />
                        <dt className="margin-0 text-base-dark margin-top-3 font-12px">Notes</dt>
                        <dd className="margin-0 margin-top-1">{step2NotesLabel}</dd>
                    </dl>
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;

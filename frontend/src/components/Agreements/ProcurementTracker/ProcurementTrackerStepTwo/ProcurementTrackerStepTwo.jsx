/**
 * @typedef {Object} ProcurementTrackerStepTwoProps
 * @property {boolean} isCurrentStep - Indicates if the step is active
 * @property {string} stepStatus - The current status of the procurement tracker step
 */

/**
 * @component
 * @param {ProcurementTrackerStepTwoProps} props
 * @returns {React.ReactElement}
 */

const ProcurementTrackerStepTwo = ({ isCurrentStep, stepStatus }) => {
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
                    <div>
                        <>Target Completion Date</>
                    </div>
                    <div className="usa-checkbox">
                        <input
                            type="checkbox"
                            disabled={!isCurrentStep}
                        />
                        <> Checkbox</>
                    </div>
                    <div>
                        <>Task Completed By</>
                    </div>
                    <div>
                        <>Date Completed</>
                    </div>
                    <div>
                        <>Notes</>
                    </div>
                    <div>
                        <>Draft Solicitation Date</>
                    </div>
                    <div className="margin-top-2 display-flex flex-justify-end">
                        <button
                            className="usa-button usa-button--unstyled margin-right-2"
                            data-cy="cancel-button"
                            // onClick={cancelModalStep1}
                            // disabled={!isPreSolicitationPackageSent}
                        >
                            Cancel
                        </button>
                        <button
                            className="usa-button"
                            data-cy="continue-btn"
                            // onClick={() => handleStep1Complete(stepOneData?.id)}
                            // disabled={disableStep1Buttons}
                        >
                            Complete Step 1
                        </button>
                    </div>
                </fieldset>
            )}
            {stepStatus === "COMPLETED" && (
                <div>
                    <p>Step Completed</p>
                    {/* <p></p> */}

                    {/* <dl>
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
                    </dl> */}
                </div>
            )}
        </>
    );
};

export default ProcurementTrackerStepTwo;

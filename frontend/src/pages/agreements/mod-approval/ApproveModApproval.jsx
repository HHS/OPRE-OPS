import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementCANReviewAccordion from "../../../components/Agreements/AgreementCANReviewAccordion";
import ContractModificationEditCard from "../../../components/Agreements/ContractModificationEdits/ContractModificationEditCard";
import Accordion from "../../../components/UI/Accordion";
import TextArea from "../../../components/UI/Form/TextArea";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import TermTag from "../../../components/ChangeRequests/TermTag";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { formatCurrency } from "../../../helpers/currencyFormat.helpers";
import { getAgreementDisplayName } from "../../../helpers/agreement.helpers";
import { agreementCrumb } from "../../../helpers/breadcrumb.helpers";
import useApproveModApproval from "./ApproveModApproval.hooks";
import { BudgetLinesReviewAccordion } from "../pre-award-approval/BudgetLinesReviewAccordion";

/**
 * @component - The Division Director's Mod Approval review page (OPS-6489): one dedicated page
 * for every Contract Modification Request type (Modified LOE, Admin/COR, As-Is, De-obligation)
 * -- they all render the same generic layout for now. Reached from the For Review list's
 * "Review agreement" link.
 * @returns {React.ReactElement}
 */
export const ApproveModApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

    const {
        agreement,
        isLoading,
        request,
        hasPermission,
        allBudgetLines,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        totalGrantNumbers,
        executingTotal,
        highlightedFieldByBudgetLineId,
        projectOfficerName,
        alternateProjectOfficerName,
        requestorName,
        reviewerNotes,
        setReviewerNotes,
        showModal,
        setShowModal,
        modalProps,
        handleApprove,
        handleDecline,
        handleCancel,
        isSubmitDisabled,
        submitError
    } = useApproveModApproval(agreementId);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!request || !hasPermission) {
        return (
            <App
                breadCrumbName="Mod Approval"
                breadCrumbParent={agreementCrumb(agreement)}
            >
                <SimpleAlert
                    type="error"
                    heading={request ? "Access Denied" : "Nothing to Review"}
                    message={
                        request
                            ? "You do not have permission to review this contract modification."
                            : "There is no contract modification currently awaiting review on this agreement."
                    }
                    headingLevel={2}
                />
            </App>
        );
    }

    return (
        <App
            breadCrumbName="Mod Approval"
            breadCrumbParent={agreementCrumb(agreement)}
        >
            <PageHeader
                title="Mod Approval"
                subTitle={getAgreementDisplayName(agreement)}
            />

            <p className="margin-y-3">
                Review the contract modification requested below, along with the agreement, budget lines, CANs, and
                documents it affects, then approve or decline it.
            </p>

            {/* Review Contract Modification */}
            <Accordion
                heading="Review Contract Modification"
                level={2}
            >
                <p>Please review the requested modification below.</p>
                {request.edits.length > 0 && (
                    <ul
                        className="usa-list--unstyled display-flex flex-column margin-top-3"
                        style={{ gap: "1rem" }}
                    >
                        {request.edits.map((edit) => (
                            <li key={edit.id}>
                                <ContractModificationEditCard edit={edit} />
                            </li>
                        ))}
                    </ul>
                )}
                {request.budget_line_items?.length > 0 && (
                    <div className="margin-top-3">
                        <p className="font-12px text-base-dark margin-0 margin-bottom-1">
                            <strong>Budget Lines to Execute</strong>
                        </p>
                        <ul
                            className="usa-list--unstyled display-flex flex-column"
                            style={{ gap: "1rem" }}
                        >
                            {request.budget_line_items.map((budgetLineItem) => (
                                <li key={budgetLineItem.id}>
                                    <div
                                        className="padding-205 bg-base-lightest border-1px border-base-light radius-md display-flex flex-wrap"
                                        style={{ gap: "1rem" }}
                                        data-cy="contract-modification-budget-line-summary"
                                    >
                                        <TermTag
                                            label="BL ID"
                                            value={budgetLineItem.id}
                                            className="margin-0"
                                        />
                                        <TermTag
                                            label="Description"
                                            value={budgetLineItem.line_description}
                                            className="margin-0"
                                        />
                                        <TermTag
                                            label="CAN"
                                            value={budgetLineItem.can_display_name}
                                            className="margin-0"
                                        />
                                        <TermTag
                                            label="Amount"
                                            value={formatCurrency(budgetLineItem.amount)}
                                            className="margin-0"
                                        />
                                        <TermTag
                                            label="FY"
                                            value={budgetLineItem.fiscal_year}
                                            className="margin-0"
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <p className="font-12px text-base-dark margin-top-3">Requested by {requestorName || "Unknown"}</p>
            </Accordion>

            {/* Agreement Details */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Please review the agreement details below."
                changeRequestType=""
            />

            {/* Budget Lines and Executing Total */}
            <BudgetLinesReviewAccordion
                budgetLineItems={allBudgetLines}
                agreement={agreement}
                servicesComponents={servicesComponents}
                groupedBudgetLines={groupedBudgetLinesByServicesComponent}
                totalGrantNumbers={totalGrantNumbers}
                executingTotal={executingTotal}
                highlightedFieldByBudgetLineId={highlightedFieldByBudgetLineId}
            />

            {/* CAN Impact */}
            <AgreementCANReviewAccordion
                instructions="The budget lines on this agreement have allocated funds from the CANs displayed below. Review to confirm everything looks good."
                selectedBudgetLines={allBudgetLines}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
                changeRequestType=""
            />

            {/* Notes Section */}
            <Accordion
                heading="Notes"
                level={2}
            >
                <p>Notes can be shared between the Submitter and Reviewer, if needed.</p>

                {request.requestor_notes && (
                    <section className="margin-top-5">
                        <h2 className="font-sans-lg text-semibold">Submitter&apos;s Notes</h2>
                        <p
                            className="maxw-mobile-lg"
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {request.requestor_notes}
                        </p>
                    </section>
                )}

                <section className={request.requestor_notes ? "margin-top-5" : "margin-top-3"}>
                    <h2 className="font-sans-lg text-semibold margin-bottom-0">Reviewer&apos;s Notes</h2>
                    <TextArea
                        name="reviewer-notes"
                        label="Notes (optional)"
                        maxLength={150}
                        value={reviewerNotes}
                        onChange={(_name, value) => setReviewerNotes(value)}
                        textAreaStyle={{ height: "8.5rem", maxWidth: "40rem" }}
                    />
                </section>
            </Accordion>

            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Action Failed"
                    message={submitError}
                    headingLevel={2}
                />
            )}

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8 margin-bottom-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                    disabled={isSubmitDisabled}
                    data-cy="cancel-mod-approval-btn"
                >
                    Cancel
                </button>

                <button
                    className="usa-button usa-button--outline margin-right-2"
                    onClick={handleDecline}
                    disabled={isSubmitDisabled}
                    data-cy="decline-mod-approval-btn"
                >
                    Decline
                </button>

                <button
                    className="usa-button"
                    onClick={handleApprove}
                    disabled={isSubmitDisabled}
                    data-cy="approve-mod-approval-btn"
                >
                    Approve modification
                </button>
            </div>

            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
        </App>
    );
};

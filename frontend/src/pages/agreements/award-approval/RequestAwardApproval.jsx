import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import { convertCodeForDisplay } from "../../../helpers/utils";
import useRequestAwardApproval from "./RequestAwardApproval.hooks";
import useAlert from "../../../hooks/use-alert.hooks";
import AwardRequestForm from "../../../components/Agreements/AwardRequestForm";

/**
 * @component - Renders a page for requesting award approval from the Budget Team.
 * @returns {React.ReactElement} - The rendered component.
 */
export const RequestAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);
    const { setAlert } = useAlert();

    const [selectedBudgetLineId, setSelectedBudgetLineId] = useState(null);
    const clinSelectorRef = useRef(null);

    useEffect(() => {
        if (selectedBudgetLineId && clinSelectorRef.current) {
            clinSelectorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedBudgetLineId]);

    const handleAddCLIN = (clinNumber) => {
        if (!selectedBudgetLineId) return;

        setClinAssignments((prev) => ({
            ...prev,
            [selectedBudgetLineId]: clinNumber
        }));

        // Show success toast
        setAlert({
            type: "success",
            message: `Budget line ${selectedBudgetLineId} was updated. When you're done adding CLINs, click Send to Approval below.`,
            isCloseable: false,
            isToastMessage: true
        });

        setSelectedBudgetLineId(null);
    };

    const {
        agreement,
        isLoading,
        notes,
        setNotes,
        handleSubmit,
        handleCancel,
        submitError,
        isSubmitting,
        hasApprovalBeenRequested,
        isApprovalApproved,
        hasBLIInReview,
        isStep5Completed,
        projectOfficerName,
        alternateProjectOfficerName,
        allBudgetLines,
        servicesComponentLookup,
        groupedBudgetLinesByServicesComponent,
        vendors,
        selectedVendor,
        setSelectedVendor,
        contractNumber,
        setContractNumber,
        awardAmount,
        setAwardAmount,
        awardDate,
        setAwardDate,
        runValidate,
        validationResult,
        MemoizedDatePicker,
        clinAssignments,
        setClinAssignments,
        showModal,
        setShowModal,
        modalProps
    } = useRequestAwardApproval(agreementId);

    // Check if any non-Draft BLIs are missing CLINs
    const hasMissingCLINs = useMemo(() => {
        return allBudgetLines.some((bli) => bli.status !== "DRAFT" && !clinAssignments[bli.id] && !bli.clin_id);
    }, [allBudgetLines, clinAssignments]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName="Request Award Approval">
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            <PageHeader
                title="Request Award Approval"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the agreement details below to ensure the signed award has been uploaded, CLINs have been
                entered, and Vendor information is complete. The Budget Team will review everything before changing the
                agreement to Awarded status in OPS. Once approved, you can complete Step 6 (Award) in the Procurement
                Tracker.
            </p>

            {!isStep5Completed && (
                <SimpleAlert
                    type="warning"
                    heading="Step 5 Not Completed"
                    message="Step 5 (Pre-Award) must be completed before requesting Award Approval. Please complete Step 5 first."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {hasApprovalBeenRequested && (
                <SimpleAlert
                    type="warning"
                    heading="Award Approval Already Requested"
                    message="Award Approval has already been requested for this agreement. The Budget Team will review and approve when ready."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {hasBLIInReview && (
                <SimpleAlert
                    type="warning"
                    heading="Budget Line Items In Review"
                    message="Some budget line items have pending changes that are currently in review. Award Approval cannot be requested until all changes are approved."
                    isClosable={false}
                    headingLevel={2}
                />
            )}

            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Error Requesting Award Approval"
                    message={submitError}
                    isClosable={true}
                    headingLevel={2}
                />
            )}

            {/* Agreement Details */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Review the agreement details below to ensure the signed award has been uploaded, CLINs have been entered, and Vendor information is complete."
                changeRequestType={agreement?.change_request_type}
                isAgreementAwarded={true}
            />

            <AwardRequestForm
                agreement={agreement}
                vendors={vendors}
                selectedVendor={selectedVendor}
                onVendorChange={setSelectedVendor}
                contractNumber={contractNumber}
                onContractNumberChange={setContractNumber}
                awardAmount={awardAmount}
                onAwardAmountChange={setAwardAmount}
                awardDate={awardDate}
                onAwardDateChange={setAwardDate}
                MemoizedDatePicker={MemoizedDatePicker}
                groupedBudgetLinesByServicesComponent={groupedBudgetLinesByServicesComponent}
                servicesComponentLookup={servicesComponentLookup}
                selectedBudgetLineId={selectedBudgetLineId}
                setSelectedBudgetLineId={setSelectedBudgetLineId}
                clinAssignments={clinAssignments}
                handleAddCLIN={handleAddCLIN}
                hasMissingCLINs={hasMissingCLINs}
                clinSelectorRef={clinSelectorRef}
                notes={notes}
                setNotes={setNotes}
                validationResult={validationResult}
                runValidate={runValidate}
            />

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    className="usa-button"
                    onClick={handleSubmit}
                    disabled={
                        isSubmitting ||
                        hasApprovalBeenRequested ||
                        isApprovalApproved ||
                        hasBLIInReview ||
                        !isStep5Completed ||
                        validationResult.hasErrors() ||
                        !selectedVendor ||
                        !contractNumber ||
                        !awardAmount ||
                        !awardDate ||
                        hasMissingCLINs
                    }
                    data-cy="request-award-approval-submit"
                >
                    {isSubmitting ? "Submitting..." : "Send to Approval"}
                </button>
            </div>
        </App>
    );
};

export default RequestAwardApproval;

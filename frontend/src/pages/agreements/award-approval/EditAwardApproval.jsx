import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import SaveChangesAndExitModal from "../../../components/UI/Modals/SaveChangesAndExitModal";
import { convertCodeForDisplay } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks";
import AwardRequestForm from "../../../components/Agreements/AwardRequestForm";
import useEditAwardApproval from "./EditAwardApproval.hooks";

/**
 * @component - Budget Team edit screen for a pending award approval request.
 *
 * Presents the same award fields as the award request form (Vendor, Contract #,
 * Award Amount, Award Date, CLINs) pre-filled from the submitted step 6 data.
 * Saving PATCHes the step 6 record without changing the approval status, then returns
 * the user to the Award Approval review page.
 *
 * Route: /agreements/:id/edit-award
 *
 * @returns {React.ReactElement}
 */
export const EditAwardApproval = () => {
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

        setAlert({
            type: "success",
            message: `Budget line ${selectedBudgetLineId} was updated.`,
            isCloseable: false,
            isToastMessage: true
        });

        setSelectedBudgetLineId(null);
    };

    const {
        agreement,
        isLoading,
        hasPermission,
        handleSave,
        handleCancel,
        submitError,
        isSubmitting,
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
    } = useEditAwardApproval(agreementId);

    // Check if any non-Draft BLIs are missing CLINs
    const hasMissingCLINs = useMemo(() => {
        return allBudgetLines.some((bli) => bli.status !== "DRAFT" && !clinAssignments[bli.id] && !bli.clin_id);
    }, [allBudgetLines, clinAssignments]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!hasPermission) {
        return (
            <App breadCrumbName="Edit Award Approval">
                <SimpleAlert
                    type="error"
                    heading="Access Denied"
                    message="You do not have permission to edit this award approval request."
                    headingLevel={2}
                />
            </App>
        );
    }

    return (
        <App breadCrumbName="Edit Award Approval">
            {showModal && (
                <SaveChangesAndExitModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    handleSecondary={modalProps.closeModal}
                    closeModal={modalProps.closeModal}
                />
            )}

            <PageHeader
                title="Edit Award Approval"
                subTitle={agreement?.name}
            />

            <p className="margin-y-3">
                Review the CLINs, Vendor Information and Current Award Information to make sure everything matches the
                award exactly. If not, correct any differences.
            </p>

            {submitError && (
                <SimpleAlert
                    type="error"
                    heading="Error Saving Changes"
                    message={submitError}
                    isClosable={true}
                    headingLevel={2}
                />
            )}

            {/* Agreement Details — read-only */}
            <AgreementMetaAccordion
                agreement={agreement}
                projectOfficerName={projectOfficerName}
                alternateProjectOfficerName={alternateProjectOfficerName}
                convertCodeForDisplay={convertCodeForDisplay}
                instructions="Please review the agreement details below and edit any information if necessary."
                changeRequestType={agreement?.change_request_type}
                isAgreementAwarded={true}
            />

            <AwardRequestForm
                mode="edit"
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
                validationResult={validationResult}
                runValidate={runValidate}
            />

            {/* Action Buttons */}
            <div className="grid-row flex-justify-end margin-top-8 margin-bottom-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    data-cy="cancel-edit-award-btn"
                >
                    Cancel
                </button>
                <button
                    className="usa-button"
                    onClick={handleSave}
                    disabled={
                        isSubmitting ||
                        validationResult.hasErrors() ||
                        !selectedVendor ||
                        !contractNumber ||
                        !awardAmount ||
                        !awardDate ||
                        hasMissingCLINs
                    }
                    data-cy="save-edit-award-btn"
                >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </App>
    );
};

export default EditAwardApproval;

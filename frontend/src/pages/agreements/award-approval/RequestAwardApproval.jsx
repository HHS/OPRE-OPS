import { useState, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import PageHeader from "../../../components/UI/PageHeader";
import AgreementMetaAccordion from "../../../components/Agreements/AgreementMetaAccordion";
import AgreementBLIAccordion from "../../../components/Agreements/AgreementBLIAccordion";
import AgreementBLIReviewTable from "../../../components/BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../../components/ServicesComponents/ServicesComponentAccordion";
import TextArea from "../../../components/UI/Form/TextArea";
import CurrencyInput from "../../../components/UI/Form/CurrencyInput";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import ConfirmationModal from "../../../components/UI/Modals/ConfirmationModal";
import Accordion from "../../../components/UI/Accordion";
import { convertCodeForDisplay } from "../../../helpers/utils";
import useRequestAwardApproval from "./RequestAwardApproval.hooks";
import CLINSelector from "../../../components/BudgetLineItems/CLINSelector";
import useAlert from "../../../hooks/use-alert.hooks";
import SummaryBox from "../../../components/Agreements/SummaryBox";
import FileUploadButton from "../../../components/UI/Button/FileUploadButton";

// Feature flag for upload signed award functionality - will be used once backend support is ready
// eslint-disable-next-line no-unused-vars
const ENABLE_UPLOAD_SIGNED_AWARD = false;

/**
 * Format vendor type enum for display
 * @param {string} vendorType - Vendor type enum value (e.g., "VendorType.SMALL_BUSINESS" or "SMALL_BUSINESS")
 * @returns {string} - Formatted vendor type
 */
const formatVendorType = (vendorType) => {
    if (!vendorType) return "";

    // Strip "VendorType." prefix if present
    const cleanType = vendorType.replace(/^VendorType\./, "");

    const typeMap = {
        SMALL_BUSINESS: "Small Business",
        EIGHT_A: "8(a)",
        HUBZONE: "HUBZone",
        WOMAN_OWNED: "Woman-Owned Small Business",
        VETERAN_OWNED: "Veteran-Owned Small Business",
        SERVICE_DISABLED_VETERAN_OWNED: "Service-Disabled Veteran-Owned Small Business",
        LARGE_BUSINESS: "Large Business",
        OTHER: "Other"
    };

    return typeMap[cleanType] || vendorType;
};

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

            {/* Add CLINs to Budget Lines */}
            <AgreementBLIAccordion
                title="Add CLINs to Budget Lines"
                instructions="Hover over each budget line and click Add CLIN to enter the Contract Line Item Number as outlined in the award. The budget team will double check the CLINs match the award exactly."
                budgetLineItems={allBudgetLines}
                agreement={agreement}
                afterApproval={false}
                setAfterApproval={() => {}}
                action=""
            >
                {hasMissingCLINs && !selectedBudgetLineId && (
                    <div className="font-12px usa-form-group usa-form-group--error margin-left-0 margin-bottom-2">
                        <span
                            className="usa-error-message text-normal margin-left-neg-1"
                            role="alert"
                        >
                            This information is required to submit for approval
                        </span>
                    </div>
                )}
                {selectedBudgetLineId && (
                    <div ref={clinSelectorRef}>
                        <CLINSelector
                            key={selectedBudgetLineId}
                            budgetLineId={selectedBudgetLineId}
                            onAddCLIN={handleAddCLIN}
                            currentClinNumber={clinAssignments[selectedBudgetLineId]}
                        />
                    </div>
                )}
                {groupedBudgetLinesByServicesComponent &&
                    groupedBudgetLinesByServicesComponent.length > 0 &&
                    groupedBudgetLinesByServicesComponent.map(
                        (/** @type {any} */ group, /** @type {number} */ index) => {
                            const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                                ? group.serviceComponentGroupingLabel
                                : group.servicesComponentNumber;
                            // Use Map lookup instead of array search for O(1) performance
                            const sc = servicesComponentLookup.get(budgetLineScGroupingLabel);
                            return (
                                <ServicesComponentAccordion
                                    key={`${group.servicesComponentNumber}-${index}`}
                                    servicesComponentNumber={group.servicesComponentNumber}
                                    serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                                    withMetadata={true}
                                    periodStart={sc?.period_start}
                                    periodEnd={sc?.period_end}
                                    description={sc?.description}
                                    optional={sc?.optional}
                                    serviceRequirementType={agreement?.service_requirement_type}
                                >
                                    {group.budgetLines.length > 0 ? (
                                        <AgreementBLIReviewTable
                                            readOnly={true}
                                            budgetLines={group.budgetLines}
                                            isReviewMode={true}
                                            servicesComponentNumber={group.servicesComponentNumber}
                                            action=""
                                            onAddCLINClick={setSelectedBudgetLineId}
                                            showCLINColumn={true}
                                            clinAssignments={clinAssignments}
                                        />
                                    ) : (
                                        <p className="text-center margin-y-7">
                                            No budget lines in this services component.
                                        </p>
                                    )}
                                </ServicesComponentAccordion>
                            );
                        }
                    )}
            </AgreementBLIAccordion>

            {/* Vendor Information */}
            <Accordion
                heading="Vendor Information"
                level={3}
                isClosed={false}
                dataCy="vendor-information-accordion"
            >
                <fieldset className="usa-fieldset">
                    <p className="margin-top-1 margin-bottom-3">Add the vendor information for this contract.</p>

                    <div className="grid-row grid-gap margin-top-3">
                        <div className="grid-col-4">
                            <label
                                className="usa-label"
                                htmlFor="vendor"
                            >
                                Vendor
                            </label>
                            <select
                                id="vendor"
                                name="vendor"
                                className="usa-select"
                                value={selectedVendor?.id || ""}
                                onChange={(e) => {
                                    const vendorId = parseInt(e.target.value);
                                    const vendor = vendors.find((v) => v.id === vendorId);
                                    setSelectedVendor(vendor || null);
                                    runValidate("vendor", vendorId);
                                }}
                                required
                                aria-required="true"
                                data-cy="vendor-select"
                            >
                                <option value="">- Select Vendor -</option>
                                {vendors.map((vendor) => (
                                    <option
                                        key={vendor.id}
                                        value={vendor.id}
                                    >
                                        {vendor.name}
                                    </option>
                                ))}
                            </select>
                            {validationResult.getErrors("vendor")?.length > 0 && (
                                <div
                                    className="usa-error-message"
                                    role="alert"
                                >
                                    {validationResult.getErrors("vendor")[0]}
                                </div>
                            )}
                        </div>

                        {selectedVendor && (
                            <SummaryBox
                                leftLabel="Unique Entity ID (SAM.gov ID)"
                                leftValue={selectedVendor?.duns || "—"}
                                rightLabel="Vendor Type"
                                rightValue={formatVendorType(selectedVendor?.vendor_type) || "—"}
                                dataCy="vendor-info-box"
                                className="grid-col-5 margin-left-3 margin-top-3"
                            />
                        )}
                    </div>
                </fieldset>
            </Accordion>

            {/* Current Award Information */}
            <Accordion
                heading="Current Award Information"
                level={3}
                isClosed={false}
                dataCy="award-information-accordion"
            >
                <fieldset className="usa-fieldset">
                    <p className="margin-top-1 margin-bottom-0">Add the award information for this contract.</p>

                    <div className="grid-row grid-gap flex-align-end">
                        <div className="grid-col-4">
                            <div
                                className={`usa-form-group padding-bottom-1 ${validationResult.getErrors("contractNumber")?.length > 0 ? "usa-form-group--error" : ""}`}
                            >
                                <label
                                    className={`usa-label ${validationResult.getErrors("contractNumber")?.length > 0 ? "usa-label--error" : ""}`}
                                    htmlFor="contractNumber"
                                >
                                    Contract #
                                </label>
                                {validationResult.getErrors("contractNumber")?.length > 0 && (
                                    <div
                                        className="usa-error-message"
                                        role="alert"
                                    >
                                        {validationResult.getErrors("contractNumber")[0]}
                                    </div>
                                )}
                                <input
                                    id="contractNumber"
                                    name="contractNumber"
                                    className={`usa-input ${validationResult.getErrors("contractNumber")?.length > 0 ? "usa-input--error" : ""}`}
                                    type="text"
                                    value={contractNumber}
                                    onChange={(e) => {
                                        setContractNumber(e.target.value);
                                        runValidate("contractNumber", e.target.value);
                                    }}
                                    required
                                    aria-required="true"
                                    data-cy="contract-number-input"
                                />
                            </div>
                        </div>

                        <div className="grid-col-4 padding-bottom-1">
                            <CurrencyInput
                                name="awardAmount"
                                label="Award Amount"
                                prefix="$"
                                value={awardAmount}
                                onChange={(_name, value) => {
                                    setAwardAmount(value);
                                    runValidate("awardAmount", value);
                                }}
                                messages={validationResult.getErrors("awardAmount") || []}
                                isRequiredNoShow={true}
                                dataCy="award-amount-input"
                            />
                        </div>

                        <div className="grid-col-4">
                            <MemoizedDatePicker
                                id="awardDate"
                                name="awardDate"
                                label="Award Date"
                                hint="mm/dd/yyyy"
                                value={awardDate}
                                onChange={(e) => {
                                    setAwardDate(e.target.value);
                                    runValidate("awardDate", e.target.value);
                                }}
                                messages={validationResult.getErrors("awardDate") || []}
                                isRequiredNoShow={true}
                                dataCy="award-date-input"
                            />
                        </div>
                    </div>
                </fieldset>
            </Accordion>

            {/* Upload Signed Award */}
            <Accordion
                heading="Upload Signed Award"
                level={3}
            >
                <p>Please upload the signed Award.</p>

                <div className="usa-form-group margin-top-3">
                    <FileUploadButton
                        id="signed-award-upload"
                        acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx"
                        onFileChange={() => {}}
                        selectedFile={null}
                        label="Signed Award"
                        disabled={true}
                        disabledTooltip="Documents tab is coming soon! For now, please upload to the OPRE preferred tool to share documents."
                        buttonText="Upload File"
                    />
                </div>
            </Accordion>

            {/* Notes (Optional) */}
            <div className="margin-top-4">
                <TextArea
                    name="notes"
                    label="Notes (Optional)"
                    value={notes}
                    onChange={(_name, value) => setNotes(value)}
                    maxLength={150}
                    messages={notes.length > 150 ? ["Notes must be 150 characters or less"] : []}
                />
            </div>

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

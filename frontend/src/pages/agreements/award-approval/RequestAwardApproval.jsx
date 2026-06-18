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
import TermTag from "../../../components/UI/Term/TermTag";
import { convertCodeForDisplay } from "../../../helpers/utils";
import {
    findDescription,
    findIfOptional,
    findPeriodEnd,
    findPeriodStart
} from "../../../helpers/servicesComponent.helpers";
import useRequestAwardApproval from "./RequestAwardApproval.hooks";

/**
 * Format vendor type enum for display
 * @param {string} vendorType - Vendor type enum value
 * @returns {string} - Formatted vendor type
 */
const formatVendorType = (vendorType) => {
    if (!vendorType) return "";

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

    return typeMap[vendorType] || vendorType;
};

/**
 * @component - Renders a page for requesting award approval from the Budget Team.
 * @returns {React.ReactElement} - The rendered component.
 */
export const RequestAwardApproval = () => {
    const { id } = useParams();
    const agreementId = Number(id);

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
        servicesComponents,
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
        MemoizedDatePicker
    } = useRequestAwardApproval(agreementId);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <App breadCrumbName="Request Award Approval">
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
                {groupedBudgetLinesByServicesComponent &&
                    groupedBudgetLinesByServicesComponent.length > 0 &&
                    groupedBudgetLinesByServicesComponent.map(
                        (/** @type {any} */ group, /** @type {number} */ index) => {
                            const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                                ? group.serviceComponentGroupingLabel
                                : group.servicesComponentNumber;
                            return (
                                <ServicesComponentAccordion
                                    key={`${group.servicesComponentNumber}-${index}`}
                                    servicesComponentNumber={group.servicesComponentNumber}
                                    serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                                    withMetadata={true}
                                    periodStart={findPeriodStart(servicesComponents, budgetLineScGroupingLabel)}
                                    periodEnd={findPeriodEnd(servicesComponents, budgetLineScGroupingLabel)}
                                    description={findDescription(servicesComponents, budgetLineScGroupingLabel)}
                                    optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                                    serviceRequirementType={agreement?.service_requirement_type}
                                >
                                    {group.budgetLines.length > 0 ? (
                                        <AgreementBLIReviewTable
                                            readOnly={true}
                                            budgetLines={group.budgetLines}
                                            isReviewMode={true}
                                            servicesComponentNumber={group.servicesComponentNumber}
                                            action=""
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
            <fieldset className="usa-fieldset margin-top-4">
                <legend className="usa-legend usa-legend--large">Vendor Information</legend>
                <p className="margin-top-1 margin-bottom-3">
                    Select the vendor for this contract. The Unique Entity ID and Vendor Type will be populated
                    automatically.
                </p>

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

                    <div className="grid-col-4">
                        <TermTag
                            term="Unique Entity ID (SAM.gov ID)"
                            description={selectedVendor?.duns || "—"}
                            data-cy="vendor-unique-entity-id-input"
                        />
                    </div>

                    <div className="grid-col-4">
                        <TermTag
                            term="Vendor Type"
                            description={formatVendorType(selectedVendor?.vendor_type) || "—"}
                            data-cy="vendor-type-input"
                        />
                    </div>
                </div>
            </fieldset>

            {/* Award Information */}
            <fieldset className="usa-fieldset margin-top-4">
                <legend className="usa-legend usa-legend--large">Award Information</legend>
                <p className="margin-top-1">Add the award information for this contract.</p>

                <div className="grid-row grid-gap">
                    <div className="grid-col-4 margin-top-3">
                        <label
                            className="usa-label"
                            htmlFor="contractNumber"
                        >
                            Contract #
                        </label>
                        <input
                            id="contractNumber"
                            name="contractNumber"
                            className="usa-input"
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
                        {validationResult.getErrors("contractNumber")?.length > 0 && (
                            <div
                                className="usa-error-message"
                                role="alert"
                            >
                                {validationResult.getErrors("contractNumber")[0]}
                            </div>
                        )}
                    </div>

                    <div className="grid-col-4 margin-top-3">
                        <CurrencyInput
                            name="awardAmount"
                            label="Award Amount"
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

                    <div className="grid-col-4 ">
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
            <div className="display-flex flex-justify margin-top-4">
                <button
                    className="usa-button usa-button--unstyled"
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
                        !awardDate
                    }
                    data-cy="request-award-approval-submit"
                >
                    {isSubmitting ? "Requesting..." : "Request Award Approval"}
                </button>
            </div>
        </App>
    );
};

export default RequestAwardApproval;

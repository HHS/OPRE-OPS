import AgreementBLIAccordion from "../AgreementBLIAccordion";
import AgreementBLIReviewTable from "../../BudgetLineItems/BLIReviewTable";
import ServicesComponentAccordion from "../../ServicesComponents/ServicesComponentAccordion";
import TextArea from "../../UI/Form/TextArea";
import CurrencyInput from "../../UI/Form/CurrencyInput";
import Accordion from "../../UI/Accordion";
import CLINSelector from "../../BudgetLineItems/CLINSelector";
import SummaryBox from "../SummaryBox";
import FileUploadButton from "../../UI/Button/FileUploadButton";
import { formatVendorType } from "./awardForm.helpers";

/**
 * @component - Shared presentational form for award request / award edit fields.
 *
 * Renders four accordions (CLINs, Vendor Information, Current Award Information,
 * Upload Signed Award) plus a Notes text area. All field values and handlers are
 * passed as props — this component contains no data fetching or local state.
 *
 * Used by:
 *   - RequestAwardApproval — submitting a new award approval request
 *   - EditAwardApproval   — Budget Team editing fields on a pending request
 *
 * @param {Object}   props
 * @param {Object}   props.agreement                           - Agreement object
 * @param {Array}    props.vendors                             - List of vendor objects
 * @param {Object}   props.selectedVendor                      - Currently selected vendor
 * @param {Function} props.onVendorChange                      - (vendor|null) => void
 * @param {string}   props.contractNumber                      - Contract # field value
 * @param {Function} props.onContractNumberChange              - (value: string) => void
 * @param {string}   props.awardAmount                         - Award Amount field value
 * @param {Function} props.onAwardAmountChange                 - (value: string) => void
 * @param {string}   props.awardDate                           - Award Date field value
 * @param {Function} props.onAwardDateChange                   - (value: string) => void
 * @param {React.ComponentType} props.MemoizedDatePicker       - Memoized DatePicker component
 * @param {Array}    props.groupedBudgetLinesByServicesComponent - BLIs grouped by SC
 * @param {Map}      props.servicesComponentLookup              - SC label → SC object Map
 * @param {number|null} props.selectedBudgetLineId             - BLI id awaiting CLIN entry
 * @param {Function} props.setSelectedBudgetLineId             - (id|null) => void
 * @param {Object}   props.clinAssignments                     - { [bliId]: clinNumber }
 * @param {Function} props.handleAddCLIN                       - (clinNumber) => void
 * @param {boolean}  props.hasMissingCLINs                     - true when required CLINs absent
 * @param {Object}   props.clinSelectorRef                     - ref to scroll CLIN selector into view
 * @param {string}   props.notes                               - Notes field value
 * @param {Function} props.setNotes                            - (value: string) => void
 * @param {Object}   props.validationResult                    - Vest result object (getErrors)
 * @param {Function} props.runValidate                         - (fieldName, value) => void
 * @param {"request"|"edit"} [props.mode="request"]           - Controls instruction copy and Notes visibility.
 *   "request" = submitter creating a new award approval request (Add … copy, Notes shown).
 *   "edit"    = Budget Team editing a pending request (Edit … copy, Notes hidden).
 * @returns {React.ReactElement}
 */
const AwardRequestForm = ({
    agreement,
    vendors,
    selectedVendor,
    onVendorChange,
    contractNumber,
    onContractNumberChange,
    awardAmount,
    onAwardAmountChange,
    awardDate,
    onAwardDateChange,
    MemoizedDatePicker,
    groupedBudgetLinesByServicesComponent,
    servicesComponentLookup,
    selectedBudgetLineId,
    setSelectedBudgetLineId,
    clinAssignments,
    handleAddCLIN,
    hasMissingCLINs,
    clinSelectorRef,
    notes,
    setNotes,
    validationResult,
    runValidate,
    mode = "request"
}) => {
    const isEditMode = mode === "edit";
    return (
        <>
            {/* Add / Edit CLINs to Budget Lines */}
            <AgreementBLIAccordion
                title={isEditMode ? "Edit CLINs on Budget Lines" : "Add CLINs to Budget Lines"}
                instructions={
                    isEditMode
                        ? "Hover over each budget line and click Edit CLIN to edit the Contract Line Item Number as outlined in the award."
                        : "Hover over each budget line and click Add CLIN to enter the Contract Line Item Number as outlined in the award. The budget team will double check the CLINs match the award exactly."
                }
                budgetLineItems={agreement?.budget_line_items ?? []}
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
                            {isEditMode
                                ? "This information is required to save changes"
                                : "This information is required to submit for approval"}
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
                                            clin={{
                                                showColumn: true,
                                                onAddClick: setSelectedBudgetLineId,
                                                assignments: clinAssignments
                                            }}
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
                    <p className="margin-top-1 margin-bottom-3">
                        {isEditMode
                            ? "Edit the vendor information for this contract."
                            : "Add the vendor information for this contract."}
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
                                    onVendorChange(vendor || null);
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
                    <p className="margin-top-1 margin-bottom-0">
                        {isEditMode
                            ? "Edit the award information for this contract."
                            : "Add the award information for this contract."}
                    </p>

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
                                        onContractNumberChange(e.target.value);
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
                                    onAwardAmountChange(value);
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
                                    onAwardDateChange(e.target.value);
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

            {/* Notes (Optional) — shown on request form only, not edit */}
            {!isEditMode && (
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
            )}
        </>
    );
};

export default AwardRequestForm;

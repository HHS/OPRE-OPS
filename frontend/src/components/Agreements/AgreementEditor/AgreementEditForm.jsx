import { convertCodeForDisplay } from "../../../helpers/utils";
import { AgreementFields } from "../../../pages/agreements/agreements.constants";
import ContractTypeSelect from "../../ServicesComponents/ContractTypeSelect";
import ServiceReqTypeSelect from "../../ServicesComponents/ServiceReqTypeSelect";
import { AGREEMENT_TYPES } from "../../ServicesComponents/ServicesComponents.constants";
import GoBackButton from "../../UI/Button/GoBackButton";
import DefinitionListCard from "../../UI/Cards/DefinitionListCard";
import Input from "../../UI/Form/Input";
import Select from "../../UI/Form/Select";
import TextArea from "../../UI/Form/TextArea/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import AgencySelect from "../AgencySelect";
import AgreementReasonSelect from "../AgreementReasonSelect";
import AgreementTypeSelect from "../AgreementTypeSelect";
import ProcurementShopSelectWithFee from "../ProcurementShopSelectWithFee";
import ProductServiceCodeSelect from "../ProductServiceCodeSelect";
import ProductServiceCodeSummaryBox from "../ProductServiceCodeSummaryBox";
import ProjectOfficerComboBox from "../ProjectOfficerComboBox";
import ResearchMethodologyComboBox from "../ResearchMethodologyComboBox";
import SpecialTopicComboBox from "../SpecialTopicComboBox";
import TeamMemberComboBox from "../TeamMemberComboBox";
import TeamMemberList from "../TeamMemberList";
import { isFieldDisabled } from "./AgreementEditForm.helpers";
import useAgreementEditForm from "./AgreementEditForm.hooks";

/**
 * Renders the "Create Agreement" step of the Create Agreement flow.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.setHasAgreementChanged] - A function to set the agreement changed state. - optional
 * @param {Function} [props.goBack] - A function to go back to the previous step. - optional
 * @param {Function} [props.goToNext] - A function to go to the next step. - optional
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode. - optional
 * @param {boolean} props.isEditMode - Whether the edit mode is on (in the Agreement details page) - optional.
 * @param {function} props.setIsEditMode - The function to set the edit mode (in the Agreement details page) - optional.
 * @param {number} [props.selectedAgreementId] - The ID of the selected agreement. - optional
 * @param {string} [props.cancelHeading] - The heading for the cancel modal. - optional
 * @param {boolean} [props.isAgreementAwarded] - Whether any budget lines are obligated. - optional
 * @param {boolean} [props.areAnyBudgetLinesPlanned] - Whether any budget lines are planned. - optional
 * @returns {React.ReactElement} - The rendered component.
 */
const AgreementEditForm = ({
    setHasAgreementChanged = () => {},
    goBack,
    goToNext,
    isReviewMode,
    isEditMode,
    setIsEditMode,
    selectedAgreementId,
    cancelHeading,
    isAgreementAwarded = false,
    areAnyBudgetLinesPlanned = false
}) => {
    const {
        cn,
        isWizardMode,
        isAgreementCreated,
        agreementNotes,
        agreementVendor,
        agreementType,
        agreementTitle,
        agreementNickName,
        agreementDescription,
        agreementReason,
        selectedTeamMembers,
        contractType,
        serviceReqType,
        servicingAgency,
        requestingAgency,
        specialTopics,
        researchMethodologies,
        productServiceCodes,
        selectedProductServiceCode,
        selectedProcurementShop,
        selectedProjectOfficer,
        selectedAlternateProjectOfficer,
        showModal,
        setShowModal,
        modalProps,
        selectedAgreementFilter,
        vendorDisabled,
        immutableFields,
        isAgreementAA,
        isSuperUser,
        shouldDisableBtn,
        changeSelectedProductServiceCode,
        changeSelectedProjectOfficer,
        changeSelectedAlternateProjectOfficer,
        setSelectedTeamMembers,
        removeTeamMember,
        setResearchMethodology,
        setSpecialTopics,
        handleContinue,
        handleDraft,
        handleCancel,
        handleOnChangeSelectedProcurementShop,
        runValidate,
        isProcurementShopDisabled,
        disabledMessage,
        fundingMethod,
        agreementFilterOptions,
        handleAgreementFilterChange,
        setAgreementDescription,
        setAgreementNickName,
        setAgreementReason,
        setAgreementTitle,
        setContractType,
        setServiceReqType,
        setRequestingAgency,
        setServicingAgency,
        setAgreementVendor,
        setAgreementNotes,
        setAgreementType,
        res,
        isLoadingProductServiceCodes
    } = useAgreementEditForm(
        isAgreementAwarded,
        areAnyBudgetLinesPlanned,
        setHasAgreementChanged,
        goBack,
        goToNext,
        isReviewMode,
        isEditMode,
        setIsEditMode,
        selectedAgreementId,
        cancelHeading
    );

    const awardedImmutableFieldsTooltipMsg = "This information cannot be edited on awarded agreements";

    if (isLoadingProductServiceCodes) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <Select
                className={cn("agreement-type-filter")}
                label="Agreement Type"
                messages={res.getErrors("agreement-type-filter")}
                name="agreement-type-filter"
                options={agreementFilterOptions}
                onChange={(name, value) => {
                    handleAgreementFilterChange(value);
                    runValidate(name, value);
                }}
                isDisabled={isAgreementCreated}
                value={selectedAgreementFilter || ""}
                tooltipMsg="Agreement Type cannot be changed once an agreement is created"
                isRequired
            />
            {isWizardMode && (
                <>
                    <h2 className="font-sans-lg margin-top-3">Agreement Details</h2>
                    <p className="margin-top-1">
                        Tell us a little more about this agreement. Make sure you complete the required information in
                        order to proceed. For everything else you can skip the parts you do not know or come back to
                        edit the information later.
                    </p>
                </>
            )}
            <Input
                name="name"
                label="Agreement Title"
                messages={res.getErrors("name")}
                maxLength={200}
                className={cn("name")}
                isRequired={true}
                value={agreementTitle}
                onChange={(name, value) => {
                    setAgreementTitle(value);
                    runValidate(name, value);
                }}
                isDisabled={isFieldDisabled(AgreementFields.Name, immutableFields, isSuperUser, isAgreementAwarded)}
                tooltipMsg={awardedImmutableFieldsTooltipMsg}
            />
            <Input
                name="nickname"
                label="Agreement Nickname or Acronym"
                maxLength={40}
                value={agreementNickName || ""}
                onChange={(_, value) => setAgreementNickName(value)}
            />
            <TextArea
                name="description"
                label="Description"
                messages={res.getErrors("description")}
                className={cn("description")}
                value={agreementDescription}
                maxLength={1000}
                onChange={(name, value) => {
                    setAgreementDescription(value);
                    if (isReviewMode) {
                        runValidate(name, value);
                    }
                }}
            />
            {selectedAgreementFilter === AGREEMENT_TYPES.PARTNER && (
                <AgreementTypeSelect
                    label="Partner Type"
                    messages={res.getErrors("agreement_type")}
                    className={`margin-top-3 ${cn("agreement_type")}`}
                    selectedAgreementType={agreementType || ""}
                    isRequired={true}
                    onChange={(name, value) => {
                        setAgreementType(value);
                        runValidate(name, value);
                    }}
                    selectedAgreementFilter={selectedAgreementFilter}
                />
            )}
            {isAgreementAA && (
                <>
                    <DefinitionListCard
                        definitionList={fundingMethod}
                        className="width-card-lg"
                    />
                    <AgencySelect
                        className={`margin-top-3 ${cn("requesting_agency")}`}
                        value={requestingAgency}
                        messages={res.getErrors("requesting_agency")}
                        agencyType="Requesting"
                        setAgency={setRequestingAgency}
                        overrideStyles={{ width: "30em" }}
                        isRequired={true}
                        onChange={(name, agency) => {
                            runValidate(name, agency);
                        }}
                        isDisabled={isFieldDisabled(
                            AgreementFields.RequestingAgency,
                            immutableFields,
                            isSuperUser,
                            isAgreementAwarded
                        )}
                        tooltipMsg={awardedImmutableFieldsTooltipMsg}
                    />
                    <AgencySelect
                        className={`margin-top-3 ${cn("servicing_agency")}`}
                        value={servicingAgency}
                        messages={res.getErrors("servicing_agency")}
                        agencyType="Servicing"
                        setAgency={setServicingAgency}
                        overrideStyles={{ width: "30em" }}
                        isRequired={true}
                        onChange={(name, agency) => {
                            runValidate(name, agency);
                        }}
                        isDisabled={isFieldDisabled(
                            AgreementFields.ServicingAgency,
                            immutableFields,
                            isSuperUser,
                            isAgreementAwarded
                        )}
                        tooltipMsg={awardedImmutableFieldsTooltipMsg}
                    />
                    {isWizardMode ? (
                        <>
                            <h2 className="font-sans-lg margin-top-3">Assisted Acquisition Details</h2>
                            <p>
                                For an assisted acquisition, the Servicing Agency conducts an acquisition on behalf of
                                the Requesting Agency. Please complete the information below related to the contract
                                this assisted acquisition will result in. You can enter these details as they are being
                                proposed to the Procurement Shop, and come back later to edit them once everything is
                                finalized.
                            </p>
                        </>
                    ) : (
                        <h2 className="font-sans-lg margin-top-3">Edit Assisted Acquisition Details</h2>
                    )}
                </>
            )}
            <ContractTypeSelect
                messages={res.getErrors("contract-type")}
                className={`margin-top-3 ${cn("contract-type")}`}
                value={contractType}
                onChange={(name, value) => {
                    setContractType(value);
                }}
                isDisabled={isFieldDisabled(
                    AgreementFields.ContractType,
                    immutableFields,
                    isSuperUser,
                    isAgreementAwarded
                )}
                tooltipMsg={awardedImmutableFieldsTooltipMsg}
            />
            <ServiceReqTypeSelect
                messages={res.getErrors("service_requirement_type")}
                className={`margin-top-3 ${cn("service_requirement_type")}`}
                isRequired={true}
                value={serviceReqType}
                onChange={(name, value) => {
                    setServiceReqType(value);
                    runValidate(name, value);
                }}
                isDisabled={isFieldDisabled(
                    AgreementFields.ServiceRequirementType,
                    immutableFields,
                    isSuperUser,
                    isAgreementAwarded
                )}
                tooltipMsg={awardedImmutableFieldsTooltipMsg}
            />
            <ProductServiceCodeSelect
                name="product_service_code_id"
                label="Product Service Code"
                messages={res.getErrors("product_service_code_id")}
                className={cn("product_service_code_id")}
                selectedProductServiceCode={selectedProductServiceCode || ""}
                codes={productServiceCodes}
                onChange={(name, value) => {
                    changeSelectedProductServiceCode(productServiceCodes[value - 1]);
                    if (isReviewMode) {
                        runValidate(name, value);
                    }
                }}
                isDisabled={isFieldDisabled(
                    AgreementFields.ProductServiceCode,
                    immutableFields,
                    isSuperUser,
                    isAgreementAwarded
                )}
                tooltipMsg={awardedImmutableFieldsTooltipMsg}
            />
            {selectedProductServiceCode &&
                selectedProductServiceCode.naics &&
                selectedProductServiceCode.support_code && (
                    <ProductServiceCodeSummaryBox selectedProductServiceCode={selectedProductServiceCode} />
                )}
            <div className="margin-top-3">
                <ProcurementShopSelectWithFee
                    name="procurement-shop-select"
                    label="Procurement Shop"
                    className={cn("procurement-shop-select")}
                    messages={res.getErrors("procurement-shop-select")}
                    selectedProcurementShop={selectedProcurementShop}
                    onChangeSelectedProcurementShop={(procurementShop) => {
                        handleOnChangeSelectedProcurementShop(procurementShop);
                        if (isReviewMode) {
                            runValidate("procurement-shop-select", procurementShop);
                        }
                    }}
                    isDisabled={isProcurementShopDisabled}
                    disabledMessage={disabledMessage()}
                />
            </div>
            <div className="display-flex margin-top-3">
                <AgreementReasonSelect
                    name="agreement_reason"
                    label="Reason for Agreement"
                    messages={res.getErrors("agreement_reason")}
                    className={cn("agreement_reason")}
                    selectedAgreementReason={agreementReason}
                    onChange={(name, value) => {
                        setAgreementVendor(null);
                        setAgreementReason(value);
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                    isDisabled={isFieldDisabled(
                        AgreementFields.AgreementReason,
                        immutableFields,
                        isSuperUser,
                        isAgreementAwarded
                    )}
                    tooltipMsg={awardedImmutableFieldsTooltipMsg}
                />
                <fieldset
                    className={`usa-fieldset margin-top-0 margin-left-4 ${vendorDisabled && "text-disabled"}`}
                    disabled={vendorDisabled}
                >
                    <Input
                        name="vendor"
                        label="Vendor"
                        messages={res.getErrors("vendor")}
                        className={`margin-top-0 ${cn("vendor")}`}
                        value={agreementVendor || ""}
                        onChange={(name, value) => {
                            setAgreementVendor(value);
                            if (isReviewMode) {
                                runValidate(name, value);
                            }
                        }}
                    />
                </fieldset>
            </div>
            <div
                className="margin-top-3"
                data-cy="research-and-special-topics"
            >
                <ResearchMethodologyComboBox
                    legendClassName="usa-label"
                    overrideStyles={{ width: "30em" }}
                    selectedResearchMethodologies={researchMethodologies}
                    setSelectedResearchMethodologies={setResearchMethodology}
                />
                <SpecialTopicComboBox
                    legendClassName="usa-label"
                    overrideStyles={{ width: "30em" }}
                    selectedSpecialTopics={specialTopics}
                    setSelectedSpecialTopics={setSpecialTopics}
                />
            </div>
            <div
                className="display-flex margin-top-3"
                data-cy="cor-combo-boxes"
            >
                <ProjectOfficerComboBox
                    selectedProjectOfficer={selectedProjectOfficer}
                    setSelectedProjectOfficer={changeSelectedProjectOfficer}
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    messages={res.getErrors("project_officer")}
                    onChange={(name, value) => {
                        if (isReviewMode) {
                            runValidate(name, value);
                        }
                    }}
                    overrideStyles={{ width: "15em" }}
                    label={convertCodeForDisplay("projectOfficer", agreementType)}
                />
                <ProjectOfficerComboBox
                    selectedProjectOfficer={selectedAlternateProjectOfficer}
                    setSelectedProjectOfficer={changeSelectedAlternateProjectOfficer}
                    className="margin-left-4"
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    overrideStyles={{ width: "15em" }}
                    label={`Alternate ${convertCodeForDisplay("projectOfficer", agreementType)}`}
                />
            </div>
            <div className="margin-top-3 width-card-lg">
                <TeamMemberComboBox
                    messages={res.getErrors("team-members")}
                    legendClassname="usa-label margin-top-0 margin-bottom-1"
                    selectedTeamMembers={selectedTeamMembers}
                    selectedProjectOfficer={selectedProjectOfficer}
                    selectedAlternateProjectOfficer={selectedAlternateProjectOfficer}
                    setSelectedTeamMembers={setSelectedTeamMembers}
                    overrideStyles={{ width: "15em" }}
                />
            </div>
            <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
            <TeamMemberList
                selectedTeamMembers={selectedTeamMembers}
                removeTeamMember={removeTeamMember}
            />
            <TextArea
                name="agreementNotes"
                label="Notes (optional)"
                maxLength={500}
                messages={res.getErrors("agreementNotes")}
                className={cn("agreementNotes")}
                value={agreementNotes || ""}
                onChange={(name, value) => setAgreementNotes(value)}
            />
            <div className="grid-row flex-justify margin-top-8">
                {isWizardMode ? <GoBackButton handleGoBack={goBack} /> : <div />}
                <div>
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    {isWizardMode && (
                        <button
                            className="usa-button usa-button--outline"
                            onClick={handleDraft}
                            disabled={!isReviewMode && shouldDisableBtn}
                            data-cy="save-draft-btn"
                        >
                            Save Draft
                        </button>
                    )}
                    <button
                        id="continue"
                        className="usa-button"
                        onClick={handleContinue}
                        disabled={shouldDisableBtn}
                        data-cy="continue-btn"
                    >
                        {isWizardMode ? "Continue" : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AgreementEditForm;

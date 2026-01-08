import EditModeTitle from "../../../pages/agreements/EditModeTitle";
import AgreementBudgetLinesHeader from "../../Agreements/AgreementBudgetLinesHeader";
import AgreementTotalCard from "../../Agreements/AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../../Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import ProjectAgreementSummaryCard from "../../Projects/ProjectAgreementSummaryCard";
import ServicesComponents from "../../ServicesComponents";
import ServicesComponentAccordion from "../../ServicesComponents/ServicesComponentAccordion";
import GoBackButton from "../../UI/Button/GoBackButton";
import FormHeader from "../../UI/Form/FormHeader";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import SaveChangesAndExitModal from "../../UI/Modals/SaveChangesAndExitModal";
import StepIndicator from "../../UI/StepIndicator/StepIndicator";
import BudgetLinesForm from "../BudgetLinesForm";
import BudgetLinesTable from "../BudgetLinesTable";
import useCreateBLIsAndSCs from "./CreateBLIsAndSCs.hooks";
import { findIfOptional } from "../../../helpers/servicesComponent.helpers";

/**
 * Renders the Create Budget Lines and Services Components with React context.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to navigate to the next step in the flow. - optional
 * @param {Function} [props.goBack] - A function to navigate to the previous step in the flow. - optional
 * @param {string[]} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {import("../../../types/ProjectTypes").Project} [props.selectedResearchProject] - The selected research project.
 * @param {import("../../../types/AgreementTypes").Agreement} [props.selectedAgreement] - The selected agreement.
 * @param {import("../../../types/AgreementTypes").ProcurementShop} [props.selectedProcurementShop] - The selected procurement shop.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} props.budgetLines - The selected Agreements budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} props.setIsEditMode - A function to set the edit mode state.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {Function} [props.continueOverRide] - A function to override the default "Continue" button behavior. - optional
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @param {boolean} props.includeDrafts - Whether to include drafts budget lines.
 * @param {Function} props.setIncludeDrafts - A function to set the include drafts state.
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateBLIsAndSCs = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject = {},
    selectedAgreement = {},
    selectedProcurementShop = {},
    budgetLines = [],
    continueBtnText,
    continueOverRide,
    isEditMode,
    canUserEditBudgetLines = false,
    setIsEditMode = () => {},
    isReviewMode,
    workflow,
    includeDrafts,
    setIncludeDrafts
}) => {
    const {
        blocker,
        handleDeleteBudgetLine,
        handleDuplicateBudgetLine,
        handleEditBLI,
        handleResetForm,
        handleSetBudgetLineForEditingById,
        handleAddBLI,
        isEditing,
        modalProps,
        pageErrors,
        setEnteredAmount,
        setEnteredDescription,
        setHasUnsavedChanges,
        setSelectedCan,
        servicesComponentNumber,
        setShowModal,
        showModal,
        setShowSaveChangesModal,
        selectedCan,
        enteredAmount,
        needByDate,
        setNeedByDate,
        enteredDescription,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        res,
        feesForCards,
        subTotalForCards,
        totalsForCards,
        handleCancel,
        handleGoBack,
        handleSave,
        budgetLinesForCards,
        tempBudgetLines,
        isBudgetLineNotDraft,
        budgetFormSuite,
        datePickerSuite,
        isAgreementNotYetDeveloped,
        hasUnsavedChanges,
        setServicesComponentNumber
    } = useCreateBLIsAndSCs(
        isEditMode,
        isReviewMode,
        budgetLines,
        goToNext,
        goBack,
        continueOverRide,
        selectedAgreement,
        selectedProcurementShop,
        setIsEditMode,
        workflow,
        includeDrafts,
        canUserEditBudgetLines,
        continueBtnText,
        currentStep
    );

    const isAgreementWorkflowOrCanEditBudgetLines = workflow === "agreement" || canUserEditBudgetLines;

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

            {blocker.state === "blocked" && (
                <SaveChangesAndExitModal
                    heading={modalProps.heading}
                    setShowModal={setShowSaveChangesModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    description={modalProps.description}
                    handleSecondary={modalProps.handleSecondary}
                    closeModal={modalProps.closeModal}
                />
            )}

            {workflow === "agreement" && (
                <>
                    <EditModeTitle isEditMode={isEditMode || isReviewMode} />
                    <StepIndicator
                        steps={wizardSteps}
                        currentStep={currentStep}
                    />
                    <ProjectAgreementSummaryCard
                        selectedResearchProject={selectedResearchProject}
                        selectedAgreement={selectedAgreement}
                        selectedProcurementShop={selectedProcurementShop}
                    />
                    {isAgreementWorkflowOrCanEditBudgetLines && (
                        <ServicesComponents
                            serviceRequirementType={selectedAgreement.service_requirement_type ?? ""}
                            agreementId={selectedAgreement.id}
                            continueBtnText={continueBtnText}
                            workflow={workflow}
                        />
                    )}
                    <div className="margin-top-3">
                        <FormHeader
                            heading="Add Budget Lines"
                            details="Add Budget lines to each Services Component to outline how the work will be funded."
                        />
                    </div>
                    <div className="display-flex flex-justify margin-y-2">
                        <AgreementTotalCard
                            total={totalsForCards(subTotalForCards(tempBudgetLines), tempBudgetLines)}
                            subtotal={subTotalForCards(tempBudgetLines)}
                            fees={feesForCards(tempBudgetLines)}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee_percentage}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={tempBudgetLines} />
                    </div>
                </>
            )}

            {workflow === "none" && (
                // NOTE: this is the Agreement Details page
                <>
                    {!isAgreementNotYetDeveloped && (
                        <ServicesComponents
                            serviceRequirementType={selectedAgreement.service_requirement_type ?? ""}
                            agreementId={selectedAgreement.id}
                            isEditMode={isEditMode}
                            continueBtnText={continueBtnText}
                        />
                    )}
                    <AgreementBudgetLinesHeader
                        heading="Edit Budget Lines"
                        includeDrafts={includeDrafts}
                        setIncludeDrafts={setIncludeDrafts}
                        isEditable={false}
                    />
                    <div className="display-flex flex-justify margin-y-2">
                        <AgreementTotalCard
                            total={totalsForCards(subTotalForCards(budgetLinesForCards), budgetLinesForCards)}
                            subtotal={subTotalForCards(budgetLinesForCards)}
                            fees={feesForCards(budgetLinesForCards)}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee_percentage}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                    </div>
                </>
            )}

            {isAgreementWorkflowOrCanEditBudgetLines && (
                <BudgetLinesForm
                    selectedCan={selectedCan}
                    servicesComponentNumber={servicesComponentNumber}
                    enteredAmount={enteredAmount}
                    needByDate={needByDate}
                    setNeedByDate={setNeedByDate}
                    enteredDescription={enteredDescription}
                    isEditing={isEditing}
                    setServicesComponentNumber={setServicesComponentNumber}
                    setSelectedCan={setSelectedCan}
                    setEnteredAmount={setEnteredAmount}
                    setEnteredDescription={setEnteredDescription}
                    handleEditBLI={handleEditBLI}
                    handleResetForm={handleResetForm}
                    handleAddBLI={handleAddBLI}
                    isReviewMode={isReviewMode}
                    isEditMode={isEditMode}
                    agreementId={selectedAgreement.id}
                    isBudgetLineNotDraft={isBudgetLineNotDraft}
                    budgetFormSuite={budgetFormSuite}
                    datePickerSuite={datePickerSuite}
                    hasUnsavedChanges={hasUnsavedChanges}
                    workflow={workflow}
                />
            )}

            {pageErrors?.length > 0 && (
                <div className="font-12px usa-form-group usa-form-group--error margin-left-0 margin-bottom-2">
                    <span
                        className="usa-error-message text-normal margin-left-neg-1"
                        role="alert"
                    >
                        This information is required to submit for approval
                    </span>
                </div>
            )}

            {groupedBudgetLinesByServicesComponent.length > 0 ? (
                groupedBudgetLinesByServicesComponent.map((group, index) => {
                    const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                        ? group.serviceComponentGroupingLabel
                        : group.servicesComponentNumber;
                    return (
                        <ServicesComponentAccordion
                            key={`${group.servicesComponentNumber}-${index}`}
                            servicesComponentNumber={group.servicesComponentNumber}
                            serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                            serviceRequirementType={selectedAgreement.service_requirement_type}
                            optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                        >
                            <BudgetLinesTable
                                budgetLines={group.budgetLines}
                                handleSetBudgetLineForEditing={handleSetBudgetLineForEditingById}
                                handleDeleteBudgetLine={handleDeleteBudgetLine}
                                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                                isEditable={isAgreementWorkflowOrCanEditBudgetLines}
                                isReviewMode={isReviewMode}
                            />
                        </ServicesComponentAccordion>
                    );
                })
            ) : (
                <p className="text-center margin-y-7">You have not added any Budget Lines yet.</p>
            )}
            <div className="display-flex flex-justify margin-top-1">
                {workflow === "agreement" && <GoBackButton handleGoBack={handleGoBack} />}
                <div className={workflow === "agreement" ? "" : "margin-left-auto"}>
                    <button
                        className="usa-button usa-button--unstyled margin-right-2"
                        data-cy="cancel-button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="usa-button"
                        data-cy="continue-btn"
                        onClick={() => {
                            setHasUnsavedChanges(false);
                            handleSave(false);
                        }}
                        disabled={(isReviewMode && !res.isValid()) || !isAgreementWorkflowOrCanEditBudgetLines}
                    >
                        {isReviewMode ? "Save Changes" : continueBtnText}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateBLIsAndSCs;

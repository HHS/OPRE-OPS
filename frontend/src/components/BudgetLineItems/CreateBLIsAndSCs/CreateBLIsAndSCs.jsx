import React from "react";
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
import StepIndicator from "../../UI/StepIndicator/StepIndicator";
import BudgetLinesForm from "../BudgetLinesForm";
import BudgetLinesTable from "../BudgetLinesTable";
import useCreateBLIsAndSCs from "./CreateBLIsAndSCs.hooks";

/**
 * Renders the Create Budget Lines and Services Components with React context.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to navigate to the next step in the flow. - optional
 * @param {Function} [props.goBack] - A function to navigate to the previous step in the flow. - optional
 * @param {Object} [props.formData] - The form data.
 * @param {string[]} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {Object} props.selectedResearchProject - The selected research project.
 * @param {Object} props.selectedAgreement - The selected agreement.
 * @param {Object} props.selectedProcurementShop - The selected procurement shop.
 * @param {Object[]} props.budgetLines - The selected Agreements budget lines.
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
    formData,
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
        setEnteredComments,
        setSelectedCan,
        setServicesComponentId,
        setShowModal,
        showModal,
        selectedCan,
        enteredAmount,
        needByDate,
        setNeedByDate,
        enteredComments,
        servicesComponentId,
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
        datePickerSuite
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
        formData,
        includeDrafts,
        canUserEditBudgetLines
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
                            serviceRequirementType={selectedAgreement.service_requirement_type}
                            agreementId={selectedAgreement.id}
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
                            procurementShopFee={selectedProcurementShop?.fee}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={tempBudgetLines} />
                    </div>
                </>
            )}

            {workflow === "none" && (
                // NOTE: this is the Agreement Details page
                <>
                    <ServicesComponents
                        serviceRequirementType={selectedAgreement.service_requirement_type}
                        agreementId={selectedAgreement.id}
                        isEditMode={isEditMode}
                    />
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
                            procurementShopFee={selectedProcurementShop?.fee}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                    </div>
                </>
            )}

            {isAgreementWorkflowOrCanEditBudgetLines && (
                <BudgetLinesForm
                    selectedCan={selectedCan}
                    servicesComponentId={servicesComponentId}
                    enteredAmount={enteredAmount}
                    needByDate={needByDate}
                    setNeedByDate={setNeedByDate}
                    enteredComments={enteredComments}
                    isEditing={isEditing}
                    setServicesComponentId={setServicesComponentId}
                    setSelectedCan={setSelectedCan}
                    setEnteredAmount={setEnteredAmount}
                    setEnteredComments={setEnteredComments}
                    handleEditBLI={handleEditBLI}
                    handleResetForm={handleResetForm}
                    handleAddBLI={handleAddBLI}
                    isReviewMode={isReviewMode}
                    isEditMode={isEditMode}
                    agreementId={selectedAgreement.id}
                    isBudgetLineNotDraft={isBudgetLineNotDraft}
                    budgetFormSuite={budgetFormSuite}
                    datePickerSuite={datePickerSuite}
                />
            )}

            {pageErrors && (
                <ul
                    className="usa-list--unstyled font-12px text-error"
                    data-cy="error-list"
                >
                    {Object.entries(pageErrors).map(([key, value]) => (
                        <li
                            key={key}
                            className="border-left-2px padding-left-1"
                            data-cy="error-item"
                        >
                            {
                                <span>
                                    {value.map((message, index) => (
                                        <React.Fragment key={index}>
                                            <span>{message}</span>
                                            {index < value.length - 1 && <span>, </span>}
                                        </React.Fragment>
                                    ))}
                                </span>
                            }
                        </li>
                    ))}
                </ul>
            )}

            {groupedBudgetLinesByServicesComponent.length > 0 ? (
                groupedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                    >
                        <BudgetLinesTable
                            budgetLines={group.budgetLines}
                            handleSetBudgetLineForEditing={handleSetBudgetLineForEditingById}
                            handleDeleteBudgetLine={handleDeleteBudgetLine}
                            handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                            canUserEditBudgetLines={canUserEditBudgetLines}
                            isReviewMode={isReviewMode}
                        />
                    </ServicesComponentAccordion>
                ))
            ) : (
                <p className="text-center margin-y-7">You have not added any Budget Lines yet.</p>
            )}
            <div className="display-flex flex-justify margin-top-1">
                <GoBackButton handleGoBack={handleGoBack} />
                <div>
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
                        onClick={handleSave}
                        disabled={(isReviewMode && !res.isValid()) || !isAgreementWorkflowOrCanEditBudgetLines}
                    >
                        {isReviewMode ? "Review" : continueBtnText}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CreateBLIsAndSCs;

import React from "react";
import PropTypes from "prop-types";
import StepIndicator from "../../UI/StepIndicator/StepIndicator";
import ProjectAgreementSummaryCard from "../../Projects/ProjectAgreementSummaryCard";
import BudgetLinesTable from "../BudgetLinesTable";
import BudgetLinesForm from "../BudgetLinesForm";
import EditModeTitle from "../../../pages/agreements/EditModeTitle";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import ServicesComponents from "../../ServicesComponents";
import useCreateBLIsAndSCs from "./CreateBLIsAndSCs.hooks";
import { convertCodeForDisplay } from "../../../helpers/utils";
import ServicesComponentAccordion from "../../ServicesComponents/ServicesComponentAccordion";
import BLIsByFYSummaryCard from "../../Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../../Agreements/AgreementDetailsCards/AgreementTotalCard";
import GoBackButton from "../../UI/Button/GoBackButton";
import FormHeader from "../../UI/Form/FormHeader";
import AgreementBudgetLinesHeader from "../../Agreements/AgreementBudgetLinesHeader";
import DebugCode from "../../DebugCode";

/**
 * Renders the Create Budget Lines and Services Components with React context.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to navigate to the next step in the flow. - optional
 * @param {Function} [props.goBack] - A function to navigate to the previous step in the flow. - optional
 * @param {Array<String>} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {Object} props.selectedResearchProject - The selected research project.
 * @param {Object} props.selectedAgreement - The selected agreement.
 * @param {Object} props.selectedProcurementShop - The selected procurement shop.
 * @param {Array<any>} props.budgetLines - The selected Agreements budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} props.setIsEditMode - A function to set the edit mode state.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {Function} [props.continueOverRide] - A function to override the default "Continue" button behavior. - optional
 * @param {"agreement" | "budgetLines" | "none"} props.workflow - The workflow type.
 * @param {Object} [props.cardData] - The card data. - optional
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
    cardData = {}
}) => {
    const {
        budgetLinePageErrorsExist,
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
        tempBudgetLines,
        handleSave
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
        workflow
    );

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

            {
                // TODO: consider moving this to a separate component for BudgetLine tab
                // if workflow is none, skip the title
                workflow !== "none" ? (
                    workflow === "agreement" ? (
                        <EditModeTitle isEditMode={isEditMode || isReviewMode} />
                    ) : (
                        <FormHeader
                            heading="Create New Budget Line"
                            details="Step Two: Text explaining this page"
                        />
                    )
                ) : null
            }

            {workflow !== "none" && (
                <>
                    <StepIndicator
                        steps={wizardSteps}
                        currentStep={currentStep}
                    />
                    <ProjectAgreementSummaryCard
                        selectedResearchProject={selectedResearchProject}
                        selectedAgreement={selectedAgreement}
                        selectedProcurementShop={selectedProcurementShop}
                    />
                    <ServicesComponents
                        serviceRequirementType={selectedAgreement.service_requirement_type}
                        agreementId={selectedAgreement.id}
                    />
                    <div className="margin-top-3">
                        <FormHeader
                            heading="Add Budget Lines"
                            details="Add Budget lines to each Services Component to outline how the work will be funded."
                        />
                    </div>
                    <div className="display-flex flex-justify margin-y-2">
                        <BLIsByFYSummaryCard budgetLineItems={budgetLines} />
                        <AgreementTotalCard
                            total={totalsForCards}
                            subtotal={subTotalForCards}
                            fees={feesForCards}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee}
                        />
                    </div>
                </>
            )}

            {workflow === "none" && (
                <>
                    <ServicesComponents
                        serviceRequirementType={selectedAgreement.service_requirement_type}
                        agreementId={selectedAgreement.id}
                        isEditMode={isEditMode}
                    />
                    <AgreementBudgetLinesHeader
                        heading="Edit Budget Lines"
                        includeDrafts={cardData.includeDrafts}
                        setIncludeDrafts={cardData.setIncludeDrafts}
                    />
                    <div className="display-flex flex-justify margin-y-2">
                        <BLIsByFYSummaryCard budgetLineItems={cardData.filteredBlis} />
                        <AgreementTotalCard
                            total={cardData.agreementTotal}
                            subtotal={cardData.agreementSubtotal}
                            fees={cardData.agreementFees}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee}
                        />
                    </div>
                </>
            )}

            {workflow === "budgetLines" && (
                <>
                    <FormHeader
                        heading="Budget Lines"
                        details="This is a list of all budget lines for the selected project and agreement. The budget lines you
                        add will display in draft status. The Fiscal Year (FY) will populate based on the election date
                        you provide."
                    />
                </>
            )}

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
            />
            {budgetLinePageErrorsExist && (
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
                            <strong>{convertCodeForDisplay("validation", key)}: </strong>
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
            <DebugCode data={tempBudgetLines} />
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
                        // onClick={continueOverRide ? continueOverRide : goToNext}
                        onClick={handleSave}
                        disabled={isReviewMode && !res.isValid()}
                    >
                        {isReviewMode ? "Review" : continueBtnText}
                    </button>
                </div>
            </div>
        </>
    );
};

CreateBLIsAndSCs.propTypes = {
    goToNext: PropTypes.func,
    goBack: PropTypes.func,
    wizardSteps: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentStep: PropTypes.number.isRequired,
    selectedResearchProject: PropTypes.object,
    selectedAgreement: PropTypes.object,
    selectedProcurementShop: PropTypes.object,
    budgetLines: PropTypes.array,
    continueBtnText: PropTypes.string.isRequired,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
    canUserEditBudgetLines: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    continueOverRide: PropTypes.func,
    workflow: PropTypes.oneOf(["agreement", "budgetLines", "none"]).isRequired,
    cardData: PropTypes.object
};

export default CreateBLIsAndSCs;

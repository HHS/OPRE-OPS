import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../../StepIndicator/StepIndicator";
import ProjectAgreementSummaryCard from "../../Form/ProjectAgreementSummaryCard";
import BudgetLinesTable from "../../../BudgetLineItems/BudgetLinesTable";
import CreateBudgetLinesForm from "../../Form/CreateBudgetLinesForm";
import EditModeTitle from "../../../../pages/agreements/EditModeTitle";
import ConfirmationModal from "../../Modals/ConfirmationModal";
import ServicesComponents from "../../../../pages/servicesComponents";
import DebugCode from "../../../../pages/servicesComponents/DebugCode";
import { useBudgetLinesDispatch } from "./context";
import useCreateBLIsAndSCs from "./useCreateBLIsAndSCs.hooks";
import { convertCodeForDisplay } from "../../../../helpers/utils";
import ServicesComponentAccordion from "../../../../pages/servicesComponents/ServicesComponentAccordion";
import BLIsByFYSummaryCard from "../../../Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import AgreementTotalCard from "../../../Agreements/AgreementDetailsCards/AgreementTotalCard";

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
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} props.setIsEditMode - A function to set the edit mode state.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {Function} [props.continueOverRide] - A function to override the default "Continue" button behavior. - optional
 * @param {"agreement" | "budgetLines" | "none"} props.workflow - The workflow type.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const StepCreateBLIsAndSCs = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject = {},
    selectedAgreement = {},
    selectedProcurementShop = {},
    existingBudgetLines = [],
    continueBtnText,
    continueOverRide,
    isEditMode,
    canUserEditBudgetLines = false,
    setIsEditMode = () => {},
    isReviewMode,
    workflow
}) => {
    const navigate = useNavigate();
    const dispatch = useBudgetLinesDispatch();
    const {
        budgetLinePageErrorsExist,
        handleDeleteBudgetLine,
        handleDuplicateBudgetLine,
        handleEditForm,
        handleResetForm,
        handleSetBudgetLineForEditing,
        handleSubmitForm,
        isEditing,
        modalProps,
        pageErrors,
        saveBudgetLineItems,
        setEnteredAmount,
        setEnteredComments,
        setEnteredDay,
        setEnteredMonth,
        setEnteredYear,
        setModalProps,
        setSelectedCan,
        setServicesComponentId,
        setShowModal,
        showModal,
        selectedCan,
        enteredAmount,
        enteredMonth,
        enteredDay,
        enteredYear,
        enteredComments,
        servicesComponentId,
        newBudgetLines,
        groupedBudgetLinesByServicesComponent,
        res,
        feesForCards,
        subTotalForCards,
        totalsForCards
    } = useCreateBLIsAndSCs(
        isReviewMode,
        existingBudgetLines,
        goToNext,
        continueOverRide,
        selectedAgreement,
        selectedProcurementShop,
        setIsEditMode
    );

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
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
                        <>
                            <h2 className="font-sans-lg">Create New Budget Line</h2>
                            <p>Step Two: Text explaining this page</p>
                        </>
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
                    <h2 className="font-sans-lg margin-top-3">Add Budget Lines</h2>
                    <p>Add Budget lines to each Services Component to outline how the work will be funded.</p>
                </>
            )}
            <CreateBudgetLinesForm
                selectedCan={selectedCan}
                servicesComponentId={servicesComponentId}
                enteredAmount={enteredAmount}
                enteredMonth={enteredMonth}
                enteredDay={enteredDay}
                enteredYear={enteredYear}
                enteredComments={enteredComments}
                isEditing={isEditing}
                setServicesComponentId={setServicesComponentId}
                setSelectedCan={setSelectedCan}
                setEnteredAmount={setEnteredAmount}
                setEnteredMonth={setEnteredMonth}
                setEnteredDay={setEnteredDay}
                setEnteredYear={setEnteredYear}
                setEnteredComments={setEnteredComments}
                handleEditForm={handleEditForm}
                handleResetForm={handleResetForm}
                handleSubmitForm={handleSubmitForm}
                isReviewMode={isReviewMode}
                agreementId={selectedAgreement.id}
            />
            {workflow === "budgetLines" && (
                <>
                    <h2 className="font-sans-lg">Budget Lines</h2>
                    <p>
                        This is a list of all budget lines for the selected project and agreement. The budget lines you
                        add will display in draft status. The Fiscal Year (FY) will populate based on the election date
                        you provide.
                    </p>
                </>
            )}
            <div className="display-flex flex-justify margin-y-2">
                <BLIsByFYSummaryCard budgetLineItems={newBudgetLines} />
                <AgreementTotalCard
                    total={totalsForCards}
                    subtotal={subTotalForCards}
                    fees={feesForCards}
                    procurementShopAbbr={selectedProcurementShop?.abbr}
                    procurementShopFee={selectedProcurementShop?.fee}
                />
            </div>
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
            {groupedBudgetLinesByServicesComponent.length > 0 &&
                groupedBudgetLinesByServicesComponent.map((group) => (
                    <ServicesComponentAccordion
                        key={group.servicesComponentId}
                        servicesComponentId={group.servicesComponentId}
                    >
                        <BudgetLinesTable
                            budgetLines={group.budgetLines}
                            handleSetBudgetLineForEditing={handleSetBudgetLineForEditing}
                            handleDeleteBudgetLine={handleDeleteBudgetLine}
                            handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                            canUserEditBudgetLines={canUserEditBudgetLines}
                            isReviewMode={isReviewMode}
                        />
                    </ServicesComponentAccordion>
                ))}
            <DebugCode
                title="Budget Lines BY Services Component"
                data={groupedBudgetLinesByServicesComponent}
            />
            <div className="grid-row flex-justify-end margin-top-1">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="back-button"
                    onClick={() => {
                        // if no budget lines have been added, go back
                        if (newBudgetLines?.length === 0) {
                            if (workflow === "none") {
                                setIsEditMode(false);
                                navigate(`/agreements/${selectedAgreement?.id}`);
                            } else {
                                goBack();
                                return;
                            }
                        }
                        // if budget lines have been added, show modal
                        setShowModal(true);
                        setModalProps({
                            heading: "Are you sure you want to go back? Your budget lines will not be saved.",
                            actionButtonText: "Go Back",
                            handleConfirm: () => {
                                dispatch({ type: "RESET_FORM_AND_BUDGET_LINES" });
                                setModalProps({});
                                goBack();
                            }
                        });
                    }}
                >
                    Back
                </button>
                <button
                    className="usa-button"
                    data-cy="continue-btn"
                    onClick={saveBudgetLineItems}
                    disabled={isReviewMode && !res.isValid()}
                >
                    {isReviewMode ? "Review" : continueBtnText}
                </button>
            </div>
        </>
    );
};

StepCreateBLIsAndSCs.propTypes = {
    goToNext: PropTypes.func,
    goBack: PropTypes.func,
    wizardSteps: PropTypes.arrayOf(PropTypes.string).isRequired,
    currentStep: PropTypes.number.isRequired,
    selectedResearchProject: PropTypes.object,
    selectedAgreement: PropTypes.object,
    selectedProcurementShop: PropTypes.object,
    existingBudgetLines: PropTypes.arrayOf(PropTypes.object),
    continueBtnText: PropTypes.string.isRequired,
    isEditMode: PropTypes.bool,
    setIsEditMode: PropTypes.func,
    canUserEditBudgetLines: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    continueOverRide: PropTypes.func,
    workflow: PropTypes.oneOf(["agreement", "budgetLines", "none"]).isRequired
};

export default StepCreateBLIsAndSCs;

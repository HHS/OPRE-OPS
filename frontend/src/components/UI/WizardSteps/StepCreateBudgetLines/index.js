import StepCreateBudgetLines from "./StepCreateBudgetLines";
import { CreateBudgetLinesProvider } from "./context";

/**
 * Renders the Create Budget Lines component with React context.
 *
 * @param {Object} props - The component props.
 * @param {Function} props.goToNext - A function to navigate to the next step in the flow.
 * @param {Function} props.goBack - A function to navigate to the previous step in the flow.
 * @param {Array<String>} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {Object} props.selectedResearchProject - The selected research project.
 * @param {Object} props.selectedAgreement - The selected agreement.
 * @param {Object} props.selectedProcurementShop - The selected procurement shop.
 * @param {Array<any>} props.existingBudgetLines - An array of existing budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} [props.isEditMode ]- A flag indicating whether the component is in edit mode.- optional
 * @param {"agreement" | "budgetLines"} props.workflow - The workflow type ("agreement" or "budgetLines").
 * @returns {JSX.Element} - The rendered component.
 */
const CreateBudgetLines = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject,
    selectedAgreement,
    selectedProcurementShop,
    existingBudgetLines,
    continueBtnText,
    isEditMode,
    workflow,
}) => {
    return (
        <CreateBudgetLinesProvider>
            <StepCreateBudgetLines
                goToNext={goToNext}
                goBack={goBack}
                wizardSteps={wizardSteps}
                currentStep={currentStep}
                selectedResearchProject={selectedResearchProject}
                selectedAgreement={selectedAgreement}
                selectedProcurementShop={selectedProcurementShop}
                existingBudgetLines={existingBudgetLines}
                continueBtnText={continueBtnText}
                isEditMode={isEditMode}
                workflow={workflow}
            />
        </CreateBudgetLinesProvider>
    );
};

export default CreateBudgetLines;
